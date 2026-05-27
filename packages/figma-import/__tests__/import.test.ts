import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidDocument } from '@lit-pigeon/core';
import { figmaFrameToDocument, importFromFigma } from '../src/index.js';
import { widthsToRatios } from '../src/converters/layout.js';
import { looksLikeHero, heroNodeToBlock } from '../src/converters/hero.js';
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

describe('hero-block detection', () => {
  it('imports a hero-frame fixture as a single hero block (not separate image + text)', () => {
    const { document, warnings } = figmaFrameToDocument(readFixture('hero-frame'), {
      imageUrls: { 'hero-1': 'https://cdn/hero.png' },
    });
    expect(isValidDocument(document)).toBe(true);
    expect(warnings).toEqual([]);

    // First row must be a hero, not an image followed by a text row.
    const firstRow = document.body.rows[0];
    expect(firstRow.columns).toHaveLength(1);
    expect(firstRow.columns[0].blocks).toHaveLength(1);
    const heroBlock = firstRow.columns[0].blocks[0];
    expect(heroBlock.type).toBe('hero');

    // Body text rows should still appear after the hero (two body texts in fixture).
    const textRows = document.body.rows.slice(1);
    expect(textRows.length).toBe(2);
    expect(textRows[0].columns[0].blocks[0].type).toBe('text');
  });

  it("places the hero block in a full-width row with zero padding", () => {
    const { document } = figmaFrameToDocument(readFixture('hero-frame'), {
      imageUrls: { 'hero-1': 'https://cdn/hero.png' },
    });
    const heroRow = document.body.rows[0];
    expect(heroRow.attributes.fullWidth).toBe(true);
    expect(heroRow.attributes.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it("hero content HTML carries the headline as <h1> and sub-line as <p>", () => {
    const { document } = figmaFrameToDocument(readFixture('hero-frame'), {
      imageUrls: { 'hero-1': 'https://cdn/hero.png' },
    });
    const heroBlock = document.body.rows[0].columns[0].blocks[0];
    expect(heroBlock.type).toBe('hero');
    if (heroBlock.type === 'hero') {
      expect(heroBlock.values.backgroundUrl).toBe('https://cdn/hero.png');
      expect(heroBlock.values.content).toContain('<h1');
      expect(heroBlock.values.content).toContain('Welcome to Lumen');
      expect(heroBlock.values.content).toContain('font-size:32px');
      expect(heroBlock.values.content).toContain('color:#ffffff');
      expect(heroBlock.values.content).toContain('<p');
      expect(heroBlock.values.content).toContain('The fastest way to send beautiful email.');
      // Vertical align maps from counterAxisAlignItems=CENTER → 'middle'.
      expect(heroBlock.values.verticalAlign).toBe('middle');
      // Has autolayout → fluid-height.
      expect(heroBlock.values.mode).toBe('fluid-height');
      // Inner padding from the frame.
      expect(heroBlock.values.innerPadding).toEqual({ top: 48, right: 32, bottom: 48, left: 32 });
      // Outer padding always zero (managed by row).
      expect(heroBlock.values.padding).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
    }
  });

  it('does NOT misclassify a button-like frame as a hero', () => {
    const buttonFrame: FigmaNode = {
      id: 'btn',
      name: 'CTA',
      type: 'FRAME',
      layoutMode: 'HORIZONTAL',
      cornerRadius: 6,
      paddingTop: 12, paddingBottom: 12, paddingLeft: 24, paddingRight: 24,
      fills: [{ type: 'SOLID', color: { r: 0.23, g: 0.51, b: 0.96 } }],
      absoluteBoundingBox: { x: 0, y: 0, width: 320, height: 48 },
      children: [
        {
          id: 'btn:label', name: 'Label', type: 'TEXT', characters: 'Click me',
          fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
          style: { fontSize: 16, fontWeight: 600 },
        },
      ],
    };
    expect(looksLikeHero(buttonFrame)).toBe(false);
  });

  it('does NOT classify a tiny frame (h < 120) as a hero, even with an image fill', () => {
    const tinyFrame: FigmaNode = {
      id: 'banner', name: 'Promo banner', type: 'FRAME',
      fills: [{ type: 'IMAGE', imageRef: 'tiny-1' }],
      absoluteBoundingBox: { x: 0, y: 0, width: 600, height: 80 },
      children: [
        { id: 't', name: 'Tag', type: 'TEXT', characters: 'Hello', fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }] },
      ],
    };
    expect(looksLikeHero(tinyFrame)).toBe(false);
  });

  it('solid-fill hero falls through to backgroundColor (no imageUrls map needed)', () => {
    const solidHero: FigmaNode = {
      id: 'solid-hero', name: 'Solid Hero', type: 'FRAME',
      layoutMode: 'VERTICAL',
      counterAxisAlignItems: 'MAX',
      paddingTop: 24, paddingBottom: 24, paddingLeft: 16, paddingRight: 16,
      fills: [{ type: 'SOLID', color: { r: 0.06, g: 0.09, b: 0.16 } }],
      absoluteBoundingBox: { x: 0, y: 0, width: 600, height: 240 },
      children: [
        {
          id: 'h', name: 'Headline', type: 'TEXT', characters: 'Big news',
          fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
          style: { fontSize: 28, fontWeight: 700 },
        },
      ],
    };
    expect(looksLikeHero(solidHero)).toBe(true);
    const block = heroNodeToBlock(solidHero, {});
    expect(block.type).toBe('hero');
    expect(block.values.backgroundUrl).toBe('');
    // rgb(0.06,0.09,0.16) → #0f1729
    expect(block.values.backgroundColor).toMatch(/^#[0-9a-f]{6}$/);
    expect(block.values.verticalAlign).toBe('bottom');
    expect(block.values.content).toContain('Big news');
    expect(block.values.content).toContain('<h1');
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
