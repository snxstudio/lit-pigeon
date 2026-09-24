// @vitest-environment node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Every fenced block in docs/guide must mirror a file (or a #region of one)
// under examples/, which is what gets typechecked and tested. Shell and plain
// text blocks are the only exceptions.
const EXAMPLES = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GUIDE = resolve(EXAMPLES, '..');
const UNCHECKED = new Set(['bash', 'sh', 'text']);

interface Block {
  page: string;
  line: number;
  lang: string;
  code: string;
  marker?: string;
}

function readBlocks(page: string): Block[] {
  const lines = readFileSync(join(GUIDE, page), 'utf8').split('\n');
  const blocks: Block[] = [];
  let pendingMarker: string | undefined;
  for (let i = 0; i < lines.length; i++) {
    const marker = /^<!-- snippet: (\S+) -->$/.exec(lines[i]);
    if (marker) {
      pendingMarker = marker[1];
      continue;
    }
    const fence = /^```(\w*)\s*$/.exec(lines[i]);
    if (!fence) {
      if (lines[i].trim()) pendingMarker = undefined;
      continue;
    }
    const start = i;
    const body: string[] = [];
    for (i++; i < lines.length && lines[i] !== '```'; i++) body.push(lines[i]);
    blocks.push({ page, line: start + 1, lang: fence[1], code: body.join('\n'), marker: pendingMarker });
    pendingMarker = undefined;
  }
  return blocks;
}

function dedent(text: string): string {
  const lines = text.split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => /^ */.exec(l)![0].length);
  const min = Math.min(...indents);
  return lines.map((l) => l.slice(min)).join('\n');
}

function readSnippet(marker: string): string {
  const [file, region] = marker.split('#');
  const path = join(EXAMPLES, file);
  if (!existsSync(path)) throw new Error(`missing example file ${file}`);
  const text = readFileSync(path, 'utf8');
  if (!region) return text;
  const lines = text.split('\n');
  const from = lines.findIndex((l) => new RegExp(`#region ${region}\\b`).test(l));
  if (from < 0) throw new Error(`missing #region ${region} in ${file}`);
  const to = lines.findIndex((l, idx) => idx > from && /#endregion/.test(l));
  if (to < 0) throw new Error(`unterminated #region ${region} in ${file}`);
  return dedent(lines.slice(from + 1, to).join('\n'));
}

// GitHub's heading anchors: lower case, punctuation removed, spaces to hyphens.
const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');

function anchorsOf(path: string): Set<string> {
  const text = readFileSync(path, 'utf8').replace(/```[\s\S]*?```/g, '');
  return new Set([...text.matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1].trim())));
}

const normalise = (s: string) => s.replace(/[ \t]+$/gm, '').trim();

const pages = readdirSync(GUIDE).filter((f) => f.endsWith('.md'));
const blocks = pages.flatMap(readBlocks);

describe('docs/guide links', () => {
  for (const page of pages) {
    it(`${page}: relative links and anchors resolve`, () => {
      const text = readFileSync(join(GUIDE, page), 'utf8').replace(/```[\s\S]*?```/g, '');
      const broken: string[] = [];
      for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:)/.test(target)) continue;
        const [file, anchor] = target.split('#');
        const path = file ? resolve(GUIDE, file) : join(GUIDE, page);
        if (!existsSync(path)) broken.push(target);
        else if (anchor && path.endsWith('.md') && !anchorsOf(path).has(anchor)) broken.push(target);
      }
      expect(broken).toEqual([]);
    });
  }
});

describe('docs/guide snippets', () => {
  it('finds the guide pages', () => {
    expect(pages.length).toBeGreaterThanOrEqual(15);
  });

  for (const block of blocks.filter((b) => !UNCHECKED.has(b.lang))) {
    it(`${block.page}:${block.line} matches ${block.marker ?? '(no marker)'}`, () => {
      expect(block.lang, 'every checked block needs a language').not.toBe('');
      expect(block.marker, 'add <!-- snippet: path[#region] --> above the block').toBeDefined();
      expect(normalise(block.code)).toBe(normalise(readSnippet(block.marker!)));
      if (block.lang === 'json') expect(() => JSON.parse(block.code)).not.toThrow();
    });
  }
});
