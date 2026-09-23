import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

describe('mj-table round trip', () => {
  it('keeps the table text and styling through MJML → document → MJML → HTML', () => {
    const source = `<mjml><mj-body><mj-section><mj-column>
      <mj-table color="#1f2933" font-size="14px">
        <tr><td>Container</td><td>{{ container_no }}</td></tr>
      </mj-table>
    </mj-column></mj-section></mj-body></mjml>`;
    const original = mjml2html(source).html;
    const { document } = mjmlToDocument(source);
    const html = mjml2html(documentToMjml(document)).html;

    expect(html).toMatch(/<tr><td>Container<\/td><td>{{ container_no }}<\/td><\/tr>/);
    const tableTag = (h: string) =>
      h.match(/<table[^>]*font-size:14px[^>]*>/)?.[0].replace(/\s+/g, ' ').replace(' >', '>');
    expect(tableTag(html)).toBeDefined();
    expect(tableTag(html)).toBe(tableTag(original));
  });
});
