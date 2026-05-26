import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidDocument } from '@lit-pigeon/core';
import { figmaFrameToDocument, importFromFigma } from '../src/index.js';
import { widthsToRatios } from '../src/converters/layout.js';
import type { FigmaNode } from '../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
function readFixture(name: string): FigmaNode {
  return JSON.parse(readFileSync(join(__dirname, 'fixtures', `${name}.json`), 'utf8'));
}

describe('figmaFrameToDocument', () => {
  it('produces a valid PigeonDocument', () => {
    const { document, warnings } = figmaFrameToDocument(readFixture('welcome-frame'));
    expect(isValidDocument(document)).toBe(true);
    expect(warnings).toEqual([]);
  });

  it('maps Figma TEXT nodes to text blocks with extracted color + font-size', () => {
    const { document } = figmaFrameToDocument(readFixture('welcome-frame'));
    const firstRow = document.body.rows[0];
    expect(firstRow.columns).toHaveLength(1);
    const firstBlock = firstRow.columns[0].blocks[0];
    expect(firstBlock.type).toBe('text');
    if (firstBlock.type === 'text') {
      expect(firstBlock.values.content).toContain('Welcome to Lumen');
      expect(firstBlock.values.content).toContain('font-size:32px');
      expect(firstBlock.values.content).toContain('font-weight:700');
      expect(firstBlock.values.textAlign).toBe('center');
    }
  });

  it('detects a button heuristically (rounded rect + single text child)', () => {
    const { document } = figmaFrameToDocument(readFixture('welcome-frame'));
    const buttonRow = document.body.rows.find((r) =>
      r.columns.some((c) => c.blocks.some((b) => b.type === 'button')),
    );
    expect(buttonRow).toBeDefined();
    const button = buttonRow!.columns[0].blocks.find((b) => b.type === 'button')!;
    if (button.type === 'button') {
      expect(button.values.content).toContain('Get started');
      expect(button.values.backgroundColor).toBe('#3b82f5'); // rgb(0.23, 0.51, 0.96) → #3b82f5
      expect(button.values.textColor).toBe('#ffffff');
      expect(button.values.borderRadius).toBe(6);
    }
  });

  it('extracts canvas width + backgroundColor from the root frame', () => {
    const { document } = figmaFrameToDocument(readFixture('welcome-frame'));
    expect(document.body.attributes.width).toBe(600);
    // rgb(0.96, 0.97, 0.99) → roughly #f5f7fc
    expect(document.body.attributes.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('treats horizontal autolayout frames as multi-column rows', () => {
    const { document } = figmaFrameToDocument(readFixture('two-column-row'));
    expect(document.body.rows).toHaveLength(1);
    const row = document.body.rows[0];
    expect(row.columns).toHaveLength(2);
    expect(row.columnRatios).toHaveLength(2);
    expect(row.columnRatios[0] + row.columnRatios[1]).toBe(12);
    // 200:400 ratio → roughly [4, 8]
    expect(row.columnRatios).toEqual([4, 8]);
  });

  it('warns about unsupported nodes but does not fail the import', () => {
    const frame: FigmaNode = {
      id: '0:1',
      name: 'Mixed',
      type: 'FRAME',
      absoluteBoundingBox: { x: 0, y: 0, width: 600, height: 200 },
      children: [
        // VECTOR is not mapped — should warn and skip.
        { id: '1:1', name: 'Icon', type: 'VECTOR' },
        // TEXT is mapped — should land.
        {
          id: '1:2', name: 'Para', type: 'TEXT', characters: 'Hi',
          fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
          style: { fontSize: 16 },
        },
      ],
    };
    const { document, warnings } = figmaFrameToDocument(frame);
    expect(document.body.rows).toHaveLength(1);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Icon');
  });
});

describe('widthsToRatios', () => {
  it('handles a 1:2 split → [4,8]', () => {
    expect(widthsToRatios([100, 200])).toEqual([4, 8]);
  });
  it('handles three equal widths → [4,4,4]', () => {
    expect(widthsToRatios([100, 100, 100])).toEqual([4, 4, 4]);
  });
  it('always sums to 12', () => {
    const ratios = widthsToRatios([7, 3, 1]);
    expect(ratios.reduce((a, b) => a + b, 0)).toBe(12);
  });
  it('ensures every column gets at least 1', () => {
    const ratios = widthsToRatios([100, 1]);
    expect(ratios.every((r) => r >= 1)).toBe(true);
    expect(ratios.reduce((a, b) => a + b, 0)).toBe(12);
  });
});

describe('importFromFigma (mocked fetch)', () => {
  it('hits /v1/files/{key}/nodes with the access token + parses the returned frame', async () => {
    const frame = readFixture('welcome-frame');
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      calls.push(url);
      if (url.includes('/nodes?')) {
        return new Response(JSON.stringify({ nodes: { '0:1': { document: frame } } }), { status: 200 });
      }
      if (url.endsWith('/images')) {
        return new Response(JSON.stringify({ meta: { images: { foo: 'https://cdn/a.png' } } }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    };
    const { document, warnings } = await importFromFigma('FILE_KEY', '0:1', 'token', { fetchImpl });
    expect(isValidDocument(document)).toBe(true);
    expect(warnings).toEqual([]);
    expect(calls.some((u) => u.includes('/nodes?'))).toBe(true);
    expect(calls.some((u) => u.endsWith('/images'))).toBe(true);
  });

  it('surfaces a non-2xx response from /nodes as an error', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response('forbidden', { status: 403, statusText: 'Forbidden' });
    await expect(importFromFigma('FILE_KEY', '0:1', 'bad-token', { fetchImpl })).rejects.toThrow(/Figma node fetch failed/);
  });
});
