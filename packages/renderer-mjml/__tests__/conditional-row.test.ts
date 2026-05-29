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
