import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

const SOURCE = `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Nunito, Arial" />
      <mj-text color="#333333" />
      <mj-class name="accent" color="#6a1b9a" />
    </mj-attributes>
    <mj-style>.brand a { color:#0b5fff; }</mj-style>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="16px" css-class="brand">Hi,<br/>track <a href="https://track.example.com">here</a>.</mj-text>
        <mj-text mj-class="accent"><p>Accent</p></mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

describe('head styling round trip', () => {
  const { document } = mjmlToDocument(SOURCE);
  const mjml = documentToMjml(document);
  const html = mjml2html(mjml).html;

  it('keeps mj-text colours and font size from mj-attributes, mj-class and the element', () => {
    expect(html).toMatch(/<span style="color: #333333; font-size: 16px">Hi,<br>track <a href="https:\/\/track.example.com">here<\/a>.<\/span>/);
    expect(html).toContain('<p><span style="color: #6a1b9a; font-size: 13px">Accent</span></p>');
  });

  it('keeps the mj-style CSS and the css-class it targets', () => {
    expect(html).toContain('.brand a { color:#0b5fff; }');
    expect(html).toMatch(/class="brand"/);
  });

  it('is stable when the saved MJML is imported again', () => {
    const again = documentToMjml(mjmlToDocument(mjml).document);
    expect(again).toBe(mjml);
  });
});
