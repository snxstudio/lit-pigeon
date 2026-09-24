import { describe, it, expect } from 'vitest';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
} from '@lit-pigeon/core';
import { documentToMjml, MjmlRenderer } from '../src/index.js';

function docWithConditionalRow(condition?: string) {
  const doc = createDefaultDocument('Test');
  const row = createRow([createColumn([createBlock('text')])]);
  if (condition !== undefined) row.attributes.condition = condition;
  doc.body.rows = [row];
  return doc;
}

describe('conditional rows → MJML', () => {
  it('wraps a conditional row in {{#if}} / {{/if}} via mj-raw', () => {
    const mjml = documentToMjml(docWithConditionalRow('user.premium'));
    expect(mjml).toContain('<mj-raw>{{#if user.premium}}</mj-raw>');
    expect(mjml).toContain('<mj-raw>{{/if}}</mj-raw>');
    // The conditional must surround the section.
    const openIdx = mjml.indexOf('{{#if user.premium}}');
    const sectionIdx = mjml.indexOf('<mj-section');
    const closeIdx = mjml.indexOf('{{/if}}');
    expect(openIdx).toBeLessThan(sectionIdx);
    expect(sectionIdx).toBeLessThan(closeIdx);
  });

  it('emits no conditional wrapper when no condition is set', () => {
    const mjml = documentToMjml(docWithConditionalRow());
    expect(mjml).not.toContain('{{#if');
  });

  it('ignores an empty/whitespace condition', () => {
    const mjml = documentToMjml(docWithConditionalRow('   '));
    expect(mjml).not.toContain('{{#if');
  });

  it('survives full mjml2html compilation wrapping the section in order', async () => {
    const doc = createDefaultDocument('Test');
    const row = createRow([
      createColumn([createBlock('text', { content: '<p>PREMIUM ONLY</p>' })]),
    ]);
    row.attributes.condition = 'user.premium';
    doc.body.rows = [row];

    const { html, errors } = await new MjmlRenderer().render(doc);
    expect(errors ?? []).toHaveLength(0);

    const ifIdx = html.indexOf('{{#if user.premium}}');
    const contentIdx = html.indexOf('PREMIUM ONLY');
    const endIdx = html.indexOf('{{/if}}');
    expect(ifIdx).toBeGreaterThanOrEqual(0);
    expect(ifIdx).toBeLessThan(contentIdx);
    expect(contentIdx).toBeLessThan(endIdx);
  });
});

describe('conditional blocks → MJML', () => {
  function docWithBlocks(...blocks: ReturnType<typeof createBlock>[]) {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [createRow([createColumn(blocks)])];
    return doc;
  }

  it('wraps only the conditional block, inside its column', () => {
    const vip = createBlock('text', { content: '<p>VIP</p>', condition: 'user.vip' });
    const all = createBlock('text', { content: '<p>Everyone</p>' });
    const mjml = documentToMjml(docWithBlocks(vip, all));

    expect(mjml).toMatch(
      /<mj-column[^>]*>\s*<mj-raw>\{\{#if user\.vip\}\}<\/mj-raw>\s*<mj-text[^>]*>\s*<p>VIP<\/p>\s*<\/mj-text>\s*<mj-raw>\{\{\/if\}\}<\/mj-raw>\s*<mj-text/,
    );
    expect(mjml.match(/\{\{#if/g)).toHaveLength(1);
  });

  it('ignores an empty/whitespace block condition', () => {
    const mjml = documentToMjml(docWithBlocks(createBlock('button', { condition: '  ' })));
    expect(mjml).not.toContain('{{#if');
  });

  it('nests a hero block condition inside the row condition', () => {
    const doc = docWithBlocks(createBlock('hero', { condition: 'user.vip' }));
    doc.body.rows[0].attributes.condition = 'user.active';
    const mjml = documentToMjml(doc);
    const order = ['{{#if user.active}}', '{{#if user.vip}}', '<mj-hero', '{{/if}}'].map((s) =>
      mjml.indexOf(s),
    );
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(mjml.match(/\{\{\/if\}\}/g)).toHaveLength(2);
  });

  it('survives mjml2html with the block content between the markers', async () => {
    const doc = docWithBlocks(
      createBlock('text', { content: '<p>BEFORE</p>' }),
      createBlock('image', { src: 'https://example.com/vip.png', alt: 'VIP', condition: 'user.vip' }),
      createBlock('text', { content: '<p>AFTER</p>' }),
    );
    const { html, errors } = await new MjmlRenderer().render(doc);
    expect(errors ?? []).toHaveLength(0);
    const idx = ['BEFORE', '{{#if user.vip}}', 'vip.png', '{{/if}}', 'AFTER'].map((s) => html.indexOf(s));
    expect(idx.every((i) => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });
});
