import { describe, it, expect } from 'vitest';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

const SOURCE = `<mjml lang="ar" dir="rtl">
  <mj-head>
    <mj-title>تأكيد الطلب</mj-title>
    <mj-preview>Preview line</mj-preview>
  </mj-head>
  <mj-body width="600px">
    <mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section>
  </mj-body>
</mjml>`;

describe('document language, direction and title', () => {
  it('reads all three off the source', () => {
    const { document } = mjmlToDocument(SOURCE);
    expect(document.body.attributes.language).toBe('ar');
    expect(document.body.attributes.direction).toBe('rtl');
    expect(document.metadata.name).toBe('تأكيد الطلب');
  });

  it('survives MJML -> document -> MJML', () => {
    const out = documentToMjml(mjmlToDocument(SOURCE).document);
    expect(out).toContain('<mjml lang="ar" dir="rtl">');
    expect(out).toContain('<mj-title>تأكيد الطلب</mj-title>');
    expect(documentToMjml(mjmlToDocument(out).document)).toBe(out);
  });

  it('ignores the und/auto placeholders MJML emits for a bare root', () => {
    const { document } = mjmlToDocument('<mjml lang="und" dir="auto"><mj-body><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>');
    expect(document.body.attributes.language).toBeUndefined();
    expect(document.body.attributes.direction).toBeUndefined();
  });

  it('keeps a language whose direction is left implicit', () => {
    const { document } = mjmlToDocument('<mjml lang="pt-BR"><mj-body><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>');
    expect(document.body.attributes.language).toBe('pt-BR');
    expect(document.body.attributes.direction).toBeUndefined();
  });

  it('falls back to the default name when the source has no mj-title', () => {
    const { document } = mjmlToDocument('<mjml><mj-body><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>');
    expect(document.metadata.name).toBe('Imported Template');
  });
});
