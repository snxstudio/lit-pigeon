import { describe, it, expect } from 'vitest';
import { createDefaultDocument, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { PigeonDocument, TextBlock } from '@lit-pigeon/core';
import { documentToPlainText, documentToMjml } from '../src/index.js';

function textBlock(content: string, condition?: string): TextBlock {
  const block = createBlock('text') as TextBlock;
  block.values.content = content;
  if (condition) block.values.condition = condition;
  return block;
}

function docWith(block: TextBlock, rowAttributes: Record<string, string> = {}): PigeonDocument {
  const doc = createDefaultDocument('Test');
  const row = createRow([createColumn([block])]);
  Object.assign(row.attributes, rowAttributes);
  doc.body.rows = [row];
  return doc;
}

/** The template-engine wrappers a rendered string carries, in order. */
function wrappers(output: string): string[] {
  return [...output.matchAll(/\{\{([#/])(if|each)(?: ([^}]*))?\}\}/g)]
    .map(([, mark, tag, expr]) => `${mark}${tag}${expr ? ` ${expr.trim()}` : ''}`);
}

describe('plain text keeps display conditions', () => {
  it('wraps a conditional block so the text part is not delivered to everyone', () => {
    const text = documentToPlainText(docWith(textBlock('<p>Premium offer</p>', 'user.premium')));

    expect(text).toContain('{{#if user.premium}}');
    expect(text).toContain('{{/if}}');
    expect(text.indexOf('{{#if user.premium}}')).toBeLessThan(text.indexOf('Premium offer'));
    expect(text.indexOf('Premium offer')).toBeLessThan(text.indexOf('{{/if}}'));
  });

  it('leaves an unconditional block unwrapped', () => {
    const text = documentToPlainText(docWith(textBlock('<p>Everyone</p>')));

    expect(text.trim()).toBe('Everyone');
  });

  it('writes no wrapper around a block that produces no text', () => {
    // An image with no alt text contributes nothing; a bare {{#if}}{{/if}}
    // would be noise the recipient can see.
    const doc = createDefaultDocument('Test');
    const image = createBlock('image');
    (image.values as { alt: string; condition?: string }).alt = '';
    (image.values as { alt: string; condition?: string }).condition = 'user.premium';
    doc.body.rows = [createRow([createColumn([image])])];

    expect(documentToPlainText(doc)).toBe('');
  });
});

describe('plain text keeps row repeats', () => {
  it('wraps a repeated row so every item reaches the text part', () => {
    const text = documentToPlainText(
      docWith(textBlock('<p>{{name}} x{{qty}}</p>'), { repeat: 'order.items' }),
    );

    expect(text).toContain('{{#each order.items}}');
    expect(text).toContain('{{/each}}');
    expect(text).toContain('{{name}} x{{qty}}');
  });

  it('nests a condition outside a repeat, as the MJML renderer does', () => {
    const doc = docWith(textBlock('<p>{{name}}</p>'), {
      repeat: 'order.items',
      condition: 'order.hasItems',
    });

    expect(wrappers(documentToPlainText(doc))).toEqual([
      '#if order.hasItems',
      '#each order.items',
      '/each',
      '/if',
    ]);
  });
});

describe('the two MIME parts agree', () => {
  const cases: Array<{ name: string; doc: PigeonDocument }> = [
    { name: 'a block condition', doc: docWith(textBlock('<p>Hi</p>', 'user.premium')) },
    { name: 'a row condition', doc: docWith(textBlock('<p>Hi</p>'), { condition: 'user.active' }) },
    { name: 'a row repeat', doc: docWith(textBlock('<p>Hi</p>'), { repeat: 'order.items' }) },
    {
      name: 'a conditional repeated row holding a conditional block',
      doc: docWith(textBlock('<p>Hi</p>', 'item.inStock'), {
        repeat: 'order.items',
        condition: 'order.hasItems',
      }),
    },
  ];

  // Guards the class of bug this fixes: a feature added to one renderer and
  // not the other ships an email whose two parts say different things.
  it.each(cases)('carries the same wrappers for $name', ({ doc }) => {
    expect(wrappers(documentToPlainText(doc))).toEqual(wrappers(documentToMjml(doc)));
  });
});
