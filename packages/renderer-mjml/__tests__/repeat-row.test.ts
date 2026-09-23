import { describe, it, expect } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
} from '@lit-pigeon/core';
import { documentToMjml, MjmlRenderer } from '../src/index.js';

function docWithRow(repeat?: string, condition?: string, type: 'text' | 'hero' = 'text') {
  const doc = createDefaultDocument('Test');
  const row = createRow([createColumn([createBlock(type, { content: '<p>{{name}} x {{qty}}</p>' })])]);
  if (repeat !== undefined) row.attributes.repeat = repeat;
  if (condition !== undefined) row.attributes.condition = condition;
  doc.body.rows = [row];
  return doc;
}

function inOrder(haystack: string, needles: string[]): boolean {
  const idx = needles.map((n) => haystack.indexOf(n));
  return idx.every((i) => i >= 0) && idx.every((i, n) => n === 0 || idx[n - 1] < i);
}

describe('repeat rows → MJML', () => {
  it('wraps a repeated row in {{#each}} / {{/each}} via mj-raw', () => {
    const mjml = documentToMjml(docWithRow('order.items'));
    expect(inOrder(mjml, ['<mj-raw>{{#each order.items}}</mj-raw>', '<mj-section', '</mj-section>', '<mj-raw>{{/each}}</mj-raw>'])).toBe(true);
  });

  it('emits no loop for a missing or blank repeat', () => {
    expect(documentToMjml(docWithRow())).not.toContain('{{#each');
    expect(documentToMjml(docWithRow('  '))).not.toContain('{{#each');
  });

  it('puts the row condition outside the loop', () => {
    const mjml = documentToMjml(docWithRow('order.items', 'order.items.length'));
    expect(
      inOrder(mjml, ['{{#if order.items.length}}', '{{#each order.items}}', '<mj-section', '{{/each}}', '{{/if}}']),
    ).toBe(true);
  });

  it('repeats a hero row too', () => {
    const mjml = documentToMjml(docWithRow('slides', undefined, 'hero'));
    expect(inOrder(mjml, ['{{#each slides}}', '<mj-hero', '</mj-hero>', '{{/each}}'])).toBe(true);
  });

  it('survives mjml2html with the item merge tags inside the loop', async () => {
    const { html, errors } = await new MjmlRenderer().render(docWithRow('order.items'));
    expect(errors ?? []).toHaveLength(0);
    expect(inOrder(html, ['{{#each order.items}}', '{{name}} x {{qty}}', '{{/each}}'])).toBe(true);
  });
});
