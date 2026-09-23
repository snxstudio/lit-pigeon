import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

const SOURCE = `<mjml>
  <mj-head><mj-attributes><mj-all font-family="Arial, sans-serif" /></mj-attributes></mj-head>
  <mj-body>
    <mj-hero mode="fixed-height" height="360px" background-color="#13315c">
      <mj-text align="center" color="#ffffff" font-size="30px">Peak season is here</mj-text>
      <mj-text align="center" color="#e0e7ff">Book before {{ cutoff_date }}.</mj-text>
      <mj-button href="https://app.example.com/quote" background-color="#ffd166" color="#0b2545">Get a quote</mj-button>
    </mj-hero>
  </mj-body>
</mjml>`;

describe('mj-hero round trip', () => {
  const saved = documentToMjml(mjmlToDocument(SOURCE).document);
  const html = mjml2html(saved).html;

  it('keeps the hero text, its styling and the button link', () => {
    expect(html).toContain('<span style="color: #ffffff; font-size: 30px">Peak season is here</span>');
    expect(html).toContain('<span style="color: #e0e7ff; font-size: 13px">Book before {{ cutoff_date }}.</span>');
    expect(html).toMatch(/<td align="center" bgcolor="#ffd166"[^>]*><a href="https:\/\/app.example.com\/quote"/);
  });

  it('is stable when the saved MJML is imported again', () => {
    expect(documentToMjml(mjmlToDocument(saved).document)).toBe(saved);
  });
});
