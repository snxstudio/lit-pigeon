import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

function roundTrip(source: string): { mjml: string; html: string } {
  const { document } = mjmlToDocument(source);
  const mjml = documentToMjml(document);
  return { mjml, html: mjml2html(mjml).html };
}

describe('MJML → document → MJML → HTML', () => {
  it('keeps a single line break per <br/>', () => {
    const { mjml, html } = roundTrip(`<mjml><mj-body><mj-section><mj-column>
      <mj-text>Line one<br/>Line two</mj-text>
    </mj-column></mj-section></mj-body></mjml>`);
    expect(mjml).toContain('Line one<br>Line two');
    expect(html).toContain('Line one<br>Line two');
    expect(html).not.toMatch(/<\/br>|<br>\s*<br>/);
  });

  it('does not write closing tags for <img> and <hr> back into the MJML', () => {
    const { mjml, html } = roundTrip(`<mjml><mj-body><mj-section><mj-column>
      <mj-raw><img src="https://example.com/a.png" alt="a"><hr/></mj-raw>
    </mj-column></mj-section></mj-body></mjml>`);
    expect(mjml).toContain('<img src="https://example.com/a.png" alt="a"><hr>');
    expect(mjml).not.toMatch(/<\/img>|<\/hr>/);
    expect(html).toContain('<img src="https://example.com/a.png" alt="a"><hr>');
  });
});

describe('block display conditions round-trip', () => {
  it('keeps each block condition through document → MJML → document', async () => {
    const { createDefaultDocument, createRow, createColumn, createBlock } = await import('@lit-pigeon/core');
    const doc = createDefaultDocument('Conditions');
    const row = createRow([
      createColumn([
        createBlock('text', { content: '<p>Hi</p>', condition: 'user.first_name' }),
        createBlock('image', { src: 'https://example.com/a.png', alt: 'a' }),
        createBlock('button', { condition: 'cart.items' }),
      ]),
      createColumn([createBlock('divider', { condition: 'show_rule' })]),
    ]);
    row.attributes.condition = 'user.active';
    doc.body.rows = [row];

    const { document } = mjmlToDocument(documentToMjml(doc));
    const [parsed] = document.body.rows;
    expect(parsed.attributes.condition).toBe('user.active');
    expect(parsed.columns[0].blocks.map((b) => b.values.condition)).toEqual([
      'user.first_name',
      undefined,
      'cart.items',
    ]);
    expect(parsed.columns[1].blocks.map((b) => [b.type, b.values.condition])).toEqual([
      ['divider', 'show_rule'],
    ]);
  });
});
