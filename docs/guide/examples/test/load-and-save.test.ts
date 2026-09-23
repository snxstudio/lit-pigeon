// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createBlock, createColumn, createDefaultDocument, createRow, type PigeonDocument } from '@lit-pigeon/core';
import { openTemplate, saveTemplate } from '../src/load-and-save/mjml-storage.js';
import { parseStoredDocument, serialiseDocument } from '../src/load-and-save/json-storage.js';
import { starter } from './helpers.js';

const LEGACY = `<mjml>
  <mj-head>
    <mj-title>Ignored</mj-title>
    <mj-font name="Inter" href="https://fonts.example.com/inter.css" />
    <mj-attributes><mj-all font-family="Inter, Arial" /><mj-text color="#333333" /></mj-attributes>
    <mj-style inline="inline">.x { color: red; }</mj-style>
    <mj-style>.brand { color: #0055ff; }</mj-style>
    <mj-preview>Preview line</mj-preview>
  </mj-head>
  <mj-body width="640px">
    <mj-wrapper padding="20px" background-color="#eeeeee">
      <mj-section css-class="hero">
        <mj-column width="30%"><mj-text css-class="brand">Left<br/>line</mj-text></mj-column>
        <mj-column width="70%"><mj-image src="https://example.com/a.png" alt="A" /></mj-column>
      </mj-section>
    </mj-wrapper>
    <mj-raw>{{#if user.vip}}</mj-raw>
    <mj-section><mj-column><mj-carousel><mj-carousel-image src="https://example.com/b.png" /></mj-carousel><mj-divider css-class="rule" /></mj-column></mj-section>
    <mj-raw>{{/if}}</mj-raw>
  </mj-body>
</mjml>`;

const shape = (doc: PigeonDocument) =>
  doc.body.rows.map((r) => ({ ratios: r.columnRatios, condition: r.attributes.condition, blocks: r.columns.map((c) => c.blocks.map((b) => b.type)) }));

describe('load and save: MJML round trip', () => {
  it('reports what it could not keep', () => {
    const { document, warnings } = openTemplate({ mjml: LEGACY, html: '' });
    const messages = warnings.map((w) => w.message);
    expect(messages).toContain('mj-wrapper styling (padding, background-color) was dropped: the document model has no wrapper; its sections were imported unwrapped');
    expect(messages).toContain('Unknown block element: mj-carousel');
    expect(messages).toContain('css-class "rule" on <mj-divider> was dropped');
    expect(warnings.every((w) => w.line === undefined)).toBe(true);
    expect(document.metadata.name).toBe('Imported Template');
    expect(document.metadata.previewText).toBe('Preview line');
    expect(document.body.attributes.width).toBe(640);
    expect(document.body.attributes.css).toBe('.brand { color: #0055ff; }');
    // Column widths are not read: every column gets an equal share.
    expect(shape(document)).toEqual([
      { ratios: [6, 6], condition: undefined, blocks: [['text'], ['image']] },
      { ratios: [12], condition: 'user.vip', blocks: [['divider']] },
    ]);
    expect(document.body.rows[0].attributes.cssClass).toBe('hero');
  });

  it('keeps line breaks single and saves MJML and HTML', async () => {
    const { document } = openTemplate({ mjml: LEGACY, html: '' });
    const saved = await saveTemplate(document);
    expect(saved.errors).toEqual([]);
    expect(saved.mjml).toContain('Left<br>line');
    expect(saved.mjml).not.toContain('</br>');
    expect(saved.mjml).not.toContain('<mj-font');
    expect(saved.mjml).not.toContain('mj-title');
    expect(saved.mjml).not.toContain('.x { color: red; }');
    expect(saved.mjml).toContain('{{#if user.vip}}');
    expect(saved.html).toMatch(/<!doctype html>/i);
  });

  it('emits registered fonts when they are passed to save', async () => {
    const fonts = [{ name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.example.com/inter.css' }];
    const saved = await saveTemplate(starter(), fonts);
    expect(saved.mjml).toContain('<mj-font name="Inter" href="https://fonts.example.com/inter.css" />');
    expect(saved.html).toContain('https://fonts.example.com/inter.css');
  });

  it('is stable when a saved template is opened and saved again', async () => {
    const first = await saveTemplate(openTemplate({ mjml: LEGACY, html: '' }).document);
    const second = await saveTemplate(openTemplate(first).document);
    expect(second.mjml).toBe(first.mjml);
  });

  it('loses column widths set in the editor on the next open', async () => {
    const doc = createDefaultDocument();
    doc.body.rows.push(createRow([createColumn([createBlock('text')]), createColumn([createBlock('text')])], [4, 8]));
    const saved = await saveTemplate(doc);
    expect(saved.mjml).toContain('width="33.33%"');
    expect(openTemplate(saved).document.body.rows[0].columnRatios).toEqual([6, 6]);
  });

  it('regenerates ids and drops locked on every open', async () => {
    const doc = createDefaultDocument('Kept name');
    const row = createRow([createColumn([createBlock('text')])]);
    row.locked = true;
    doc.body.rows.push(row);
    const reopened = openTemplate(await saveTemplate(doc)).document;
    expect(reopened.body.rows[0].id).not.toBe(row.id);
    expect(reopened.body.rows[0].locked).toBe(false);
    expect(reopened.metadata.name).toBe('Imported Template');
  });
});

describe('load and save: JSON storage', () => {
  it('round-trips the document exactly', () => {
    const doc = starter();
    expect(parseStoredDocument(serialiseDocument(doc))).toEqual(doc);
  });

  it('rejects invalid input', () => {
    expect(() => parseStoredDocument('{"version":"2.0"}')).toThrow(/Invalid document/);
  });
});
