import { describe, it, expect } from 'vitest';
import { createDefaultDocument, createRow, createColumn, createBlock } from '@lit-pigeon/core';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

describe('parsing repeat rows', () => {
  it('reads an mj-raw {{#each}} marker back into the row repeat', () => {
    const { document } = mjmlToDocument(`<mjml><mj-body>
      <mj-raw>{{#each order.items}}</mj-raw>
      <mj-section><mj-column><mj-text>{{name}}</mj-text></mj-column></mj-section>
      <mj-raw>{{/each}}</mj-raw>
      <mj-section><mj-column><mj-text>Total</mj-text></mj-column></mj-section>
    </mj-body></mjml>`);
    expect(document.body.rows.map((r) => r.attributes.repeat)).toEqual(['order.items', undefined]);
    expect(document.body.rows[0].attributes.condition).toBeUndefined();
  });

  it('reads a condition and a repeat on the same row', () => {
    const { document } = mjmlToDocument(`<mjml><mj-body>
      <mj-raw>{{#if order.items}}</mj-raw>
      <mj-raw>{{#each order.items}}</mj-raw>
      <mj-section><mj-column><mj-text>{{name}}</mj-text></mj-column></mj-section>
      <mj-raw>{{/each}}</mj-raw>
      <mj-raw>{{/if}}</mj-raw>
    </mj-body></mjml>`);
    expect(document.body.rows[0].attributes).toMatchObject({ condition: 'order.items', repeat: 'order.items' });
  });

  it('round-trips repeat and condition through document → MJML → document', () => {
    const doc = createDefaultDocument('Loop');
    const items = createRow([createColumn([createBlock('text', { content: '<p>{{name}}</p>' })])]);
    items.attributes.repeat = 'shipment.containers';
    items.attributes.condition = 'shipment.containers';
    const hero = createRow([createColumn([createBlock('hero')])]);
    hero.attributes.repeat = 'slides';
    const plain = createRow([createColumn([createBlock('text')])]);
    doc.body.rows = [items, hero, plain];

    const { document } = mjmlToDocument(documentToMjml(doc));
    expect(document.body.rows.map((r) => [r.attributes.condition, r.attributes.repeat])).toEqual([
      ['shipment.containers', 'shipment.containers'],
      [undefined, 'slides'],
      [undefined, undefined],
    ]);
  });
});
