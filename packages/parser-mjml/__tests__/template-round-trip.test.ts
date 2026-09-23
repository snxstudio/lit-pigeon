import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import mjml2html from 'mjml';
import { documentToMjml, MjmlRenderer } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

const dir = join(__dirname, 'fixtures');
const WRAPPER_WARNING =
  'mj-wrapper styling (padding, background-color) was dropped: the document model has no wrapper; its sections were imported unwrapped';

const words = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort();
const urls = (html: string) => new Set([...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => m[1]));
const colours = (html: string) => new Set([...html.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()));
const authoredComments = (html: string) =>
  [...html.matchAll(/<!--[\s\S]*?-->/g)].map((m) => m[0]).filter((c) => !c.startsWith('<!--[if mso | IE]>'));

describe.each(readdirSync(dir).filter((f) => f.endsWith('.mjml')).sort())('%s', (file) => {
  const source = readFileSync(join(dir, file), 'utf8');
  const original = mjml2html(source).html;
  const { document, warnings } = mjmlToDocument(source);
  const saved = documentToMjml(document);
  const html = mjml2html(saved).html;

  it('only warns about mj-wrapper', () => {
    const expected = source.includes('<mj-wrapper') ? [WRAPPER_WARNING] : [];
    expect(warnings.map((w) => w.message)).toEqual(expected);
  });

  it('keeps all visible text', () => {
    expect(words(html)).toEqual(expect.arrayContaining(words(original)));
  });

  it('keeps every href and src', () => {
    for (const url of urls(original)) expect(urls(html)).toContain(url);
  });

  it('keeps every colour', () => {
    for (const colour of colours(original)) expect(colours(html)).toContain(colour);
  });

  it('keeps authored HTML comments, including through MjmlRenderer', async () => {
    const rendered = (await new MjmlRenderer().render(document)).html;
    for (const comment of authoredComments(original)) {
      expect(html).toContain(comment);
      expect(rendered).toContain(comment);
    }
  });

  it('is stable when the saved MJML is imported again', () => {
    expect(documentToMjml(mjmlToDocument(saved).document)).toBe(saved);
  });
});

describe('Shipthis acceptance template', () => {
  const source = readFileSync(join(dir, '1-acceptance.mjml'), 'utf8');
  const html = mjml2html(documentToMjml(mjmlToDocument(source).document)).html;

  it('keeps the #333333 text colour, the 16px size and the .brand a CSS', () => {
    expect(html).toContain('<span style="color: #333333; font-size: 16px">Hi {{ customer_name }},<br>');
    expect(html).toContain('.brand a { color:#0b5fff; }');
    expect(html).toMatch(/class="brand"/);
  });
});
