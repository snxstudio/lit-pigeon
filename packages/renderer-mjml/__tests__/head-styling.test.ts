import { describe, it, expect } from 'vitest';
import type { PigeonDocument } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

function doc(css?: string): PigeonDocument {
  const padding = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    version: '1.0',
    metadata: { name: 'Test', createdAt: '', updatedAt: '' },
    body: {
      attributes: { width: 600, backgroundColor: '#ffffff', fontFamily: 'Arial', contentAlignment: 'center', css },
      rows: [
        {
          id: 'r',
          type: 'row',
          attributes: { padding, fullWidth: false, cssClass: 'row-c' },
          columnRatios: [12],
          locked: false,
          columns: [
            {
              id: 'c',
              type: 'column',
              attributes: { padding, verticalAlign: 'top', cssClass: 'col-c' },
              blocks: [
                { id: 't', type: 'text', values: { content: 'Hi', padding, lineHeight: '1.5', textAlign: 'left', cssClass: 'brand' } },
                {
                  id: 'b',
                  type: 'button',
                  values: {
                    content: '<p>Go</p>', href: '#', backgroundColor: '#000000', textColor: '#ffffff', borderRadius: 0,
                    padding, innerPadding: padding, fontSize: 14, fontWeight: '600', alignment: 'center', fullWidth: false,
                    cssClass: 'cta',
                  },
                },
                { id: 'i', type: 'image', values: { src: 'a.png', alt: '', width: 'auto', padding, alignment: 'center', cssClass: 'logo' } },
              ],
            },
          ],
        },
      ],
    },
  };
}

describe('document css and css-class', () => {
  it('writes document css as a non-inline mj-style', () => {
    const mjml = documentToMjml(doc('.brand a { color:#0b5fff; }'));
    expect(mjml).toContain('<mj-style>\n.brand a { color:#0b5fff; }\n    </mj-style>');
  });

  it('escapes </mj-style inside the css', () => {
    const mjml = documentToMjml(doc('a::after { content: "</mj-style><mj-raw>x</mj-raw>"; }'));
    expect(mjml).not.toContain('</mj-style><mj-raw>');
    expect(mjml).toContain('<\\/mj-style><mj-raw>');
  });

  it('writes no mj-style when the document has no css', () => {
    expect(documentToMjml(doc(), { outlookWorkarounds: false })).not.toContain('<mj-style');
  });

  it('writes css-class on sections, columns, text, buttons and images', () => {
    const mjml = documentToMjml(doc());
    for (const name of ['row-c', 'col-c', 'brand', 'cta', 'logo']) {
      expect(mjml).toContain(`css-class="${name}"`);
    }
  });
});
