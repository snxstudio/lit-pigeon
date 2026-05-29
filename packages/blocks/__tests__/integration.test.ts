import { describe, it, expect, beforeAll } from 'vitest';
import {
  createBlock,
  createColumn,
  createDefaultDocument,
  createRow,
} from '@lit-pigeon/core';
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';
import { registerStandardBlocks } from '../src/index.js';

beforeAll(() => {
  registerStandardBlocks();
});

const renderer = new MjmlRenderer();

async function renderOne(type: string, overrides: Record<string, unknown> = {}) {
  const doc = createDefaultDocument('Test');
  doc.body.rows.push(createRow([createColumn([createBlock(type, overrides)])]));
  return renderer.render(doc);
}

describe('standard blocks → real mjml2html compilation', () => {
  it('video compiles cleanly with a poster URL', async () => {
    const { html, errors } = await renderOne('video', {
      posterUrl: 'https://example.com/p.jpg',
      videoUrl: 'https://example.com/v',
    });
    expect(errors).toEqual([]);
    expect(html).toContain('https://example.com/p.jpg');
    expect(html).toContain('href="https://example.com/v"');
  });

  it('countdown compiles via image path', async () => {
    const { html, errors } = await renderOne('countdown', {
      imageUrl: 'https://example.com/c.png',
    });
    expect(errors).toEqual([]);
    expect(html).toContain('https://example.com/c.png');
  });

  it('countdown compiles via fallback label', async () => {
    const { html, errors } = await renderOne('countdown', {
      imageUrl: '',
      endDateLabel: 'Sale ends Dec 31',
    });
    expect(errors).toEqual([]);
    expect(html).toContain('Sale ends Dec 31');
  });

  it('accordion compiles via mj-accordion', async () => {
    const { errors, html } = await renderOne('accordion', {
      items: 'Q1 :: A1\nQ2 :: A2',
    });
    expect(errors).toEqual([]);
    expect(html).toContain('Q1');
    expect(html).toContain('A1');
  });

  it('table compiles to a real HTML table', async () => {
    const { html, errors } = await renderOne('table', {
      header: 'Item | Price',
      rows: 'Coffee | $4\nMuffin | $3',
    });
    expect(errors).toEqual([]);
    expect(html).toMatch(/<table[\s>]/);
    expect(html).toContain('Coffee');
    expect(html).toContain('Muffin');
  });

  it('carousel compiles via mj-carousel', async () => {
    const { html, errors } = await renderOne('carousel', {
      images: 'https://example.com/1.jpg\nhttps://example.com/2.jpg',
    });
    expect(errors).toEqual([]);
    expect(html).toContain('https://example.com/1.jpg');
    expect(html).toContain('https://example.com/2.jpg');
  });
});
