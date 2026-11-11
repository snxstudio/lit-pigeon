import { describe, it, expect } from 'vitest';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import type { ButtonBlock } from '@lit-pigeon/core';
import { mjmlToDocument } from '../src/index.js';
import { parseBorder } from '../src/utils/parse-border.js';

function parseButton(attrs: string): ButtonBlock['values'] {
  const { document } = mjmlToDocument(
    `<mjml><mj-body><mj-section><mj-column>
      <mj-button ${attrs}>Buy</mj-button>
    </mj-column></mj-section></mj-body></mjml>`,
  );
  return (document.body.rows[0].columns[0].blocks[0] as ButtonBlock).values;
}

describe('parseBorder', () => {
  it('reads the CSS shorthand in its usual order', () => {
    expect(parseBorder('2px solid #e8590c')).toEqual({ width: 2, style: 'solid', color: '#e8590c' });
  });

  it('classifies the parts rather than reading them positionally', () => {
    expect(parseBorder('#e8590c dashed 3px')).toEqual({ width: 3, style: 'dashed', color: '#e8590c' });
  });

  it('keeps a colour written in functional notation whole', () => {
    expect(parseBorder('1px dotted rgb(232, 89, 12)')).toEqual({
      width: 1,
      style: 'dotted',
      color: 'rgb(232, 89, 12)',
    });
  });

  it('reads a style the model cannot represent as solid', () => {
    expect(parseBorder('4px double red')).toEqual({ width: 4, style: 'solid', color: 'red' });
  });

  it.each(['', '   ', 'none', 'NONE', 'hidden', '0 solid #e8590c', '0px solid #e8590c'])(
    'reads %o as no border at all',
    (value) => {
      expect(parseBorder(value)).toBeUndefined();
    },
  );

  it('fills in the parts a terse shorthand leaves out', () => {
    expect(parseBorder('#e8590c')).toEqual({ width: 1, style: 'solid', color: '#e8590c' });
    expect(parseBorder('2px')).toEqual({ width: 2, style: 'solid', color: '#000000' });
  });
});

describe('mj-button border', () => {
  it('parses a border into the structured value', () => {
    expect(parseButton('border="2px dashed #e8590c"').border).toEqual({
      width: 2,
      style: 'dashed',
      color: '#e8590c',
    });
  });

  it('leaves the border unset when the attribute is absent', () => {
    // mj-button's own MJML default is `border: none`, which resolve-attributes
    // merges in — without parseBorder rejecting it every parsed button would
    // come back carrying a border it never had.
    expect(parseButton('href="https://example.test"').border).toBeUndefined();
  });

  it('keeps the border through document → MJML → document', () => {
    const source = `<mjml><mj-body><mj-section><mj-column>
      <mj-button border="3px dotted #0071e3">Buy</mj-button>
    </mj-column></mj-section></mj-body></mjml>`;
    const first = mjmlToDocument(source).document;
    const second = mjmlToDocument(documentToMjml(first)).document;

    const border = (second.body.rows[0].columns[0].blocks[0] as ButtonBlock).values.border;
    expect(border).toEqual({ width: 3, style: 'dotted', color: '#0071e3' });
  });

  it('does not invent a border on a round trip for a button that has none', () => {
    const source = `<mjml><mj-body><mj-section><mj-column>
      <mj-button>Buy</mj-button>
    </mj-column></mj-section></mj-body></mjml>`;
    const mjml = documentToMjml(mjmlToDocument(source).document);
    expect(mjml).not.toMatch(/<mj-button[^>]*\sborder=/);
  });
});
