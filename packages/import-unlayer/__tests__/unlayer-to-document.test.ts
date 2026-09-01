import { describe, expect, it } from 'vitest';
import { validateDocument } from '@lit-pigeon/core';
import { unlayerToDocument } from '../src/index.js';
import { cellsToRatios } from '../src/utils/values.js';
import { applyInlineStyle } from '../src/utils/inline-style.js';
import sample from './fixtures-unlayer-sample.json';

function design(rows: unknown[], bodyValues: Record<string, unknown> = {}) {
  return { body: { rows, values: bodyValues }, schemaVersion: 16 };
}

function row(contents: unknown[], opts: { cells?: number[]; values?: Record<string, unknown> } = {}) {
  return {
    cells: opts.cells ?? [1],
    columns: [{ contents, values: {} }],
    values: opts.values ?? {},
  };
}

describe('unlayerToDocument', () => {
  it('rejects input that is not an Unlayer design', () => {
    const { document, warnings } = unlayerToDocument({ nope: true } as never);
    expect(warnings[0].code).toBe('not-a-design');
    expect(document.body.rows).toEqual([]);
  });

  it('accepts a raw JSON string as well as a parsed object', () => {
    const json = JSON.stringify(design([row([{ type: 'text', values: { text: '<p>Hi</p>' } }])]));
    const { document, warnings } = unlayerToDocument(json);
    expect(warnings).toEqual([]);
    expect(document.body.rows).toHaveLength(1);
  });

  it('reports invalid JSON instead of throwing', () => {
    const { warnings } = unlayerToDocument('{ not json');
    expect(warnings[0].code).toBe('not-a-design');
  });

  it('maps body attributes', () => {
    const { document } = unlayerToDocument(
      design([], {
        contentWidth: 700,
        contentAlign: 'left',
        backgroundColor: '#000000',
        preheaderText: 'Peek',
        fontFamily: { value: 'helvetica,sans-serif' },
      }),
    );
    expect(document.body.attributes).toMatchObject({
      width: 700,
      backgroundColor: '#000000',
      fontFamily: 'helvetica,sans-serif',
      contentAlignment: 'left',
    });
    expect(document.metadata.previewText).toBe('Peek');
  });

  it('treats Unlayer\'s empty-string colours as unset', () => {
    const { document } = unlayerToDocument(design([row([], { values: { backgroundColor: '' } })]));
    expect(document.body.rows[0].attributes.backgroundColor).toBeUndefined();
  });

  it('handles a contentWidth given as a px string', () => {
    const { document } = unlayerToDocument(design([], { contentWidth: '500px' }));
    expect(document.body.attributes.width).toBe(500);
  });
});

describe('block conversion', () => {
  it('inlines block-level colour so the design survives the round trip', () => {
    const { document } = unlayerToDocument(
      design([row([{ type: 'text', values: { text: '<p>Hello</p>', color: '#ffffff', fontSize: '17px' } }])]),
    );
    const block = document.body.rows[0].columns[0].blocks[0];
    expect(block.type).toBe('text');
    // Style must be on a <span> inside the <p>: the editor's sanitiser drops
    // style from every other tag, and wrapping outside would be invalid nesting.
    expect(block.values.content).toBe(
      '<p><span style="color: #ffffff; font-size: 17px">Hello</span></p>',
    );
  });

  it('falls back to the body text colour when a block sets none', () => {
    const { document } = unlayerToDocument(
      design([row([{ type: 'text', values: { text: '<p>Hi</p>' } }])], { textColor: '#ff0000' }),
    );
    const block = document.body.rows[0].columns[0].blocks[0];
    expect(block.values.content).toContain('color: #ff0000');
  });

  it('converts a heading into a text block wrapped in its heading tag', () => {
    const { document } = unlayerToDocument(
      design([row([{ type: 'heading', values: { text: 'Title', headingType: 'h2', color: '#111' } }])]),
    );
    const block = document.body.rows[0].columns[0].blocks[0];
    expect(block.values.content).toBe('<h2><span style="color: #111">Title</span></h2>');
  });

  it('clamps heading levels the editor cannot represent', () => {
    const { document, warnings } = unlayerToDocument(
      design([row([{ type: 'heading', values: { text: 'Deep', headingType: 'h5' } }])]),
    );
    expect(warnings.map((w) => w.code)).toContain('heading-level-clamped');
    expect(document.body.rows[0].columns[0].blocks[0].values.content).toContain('<h3>');
  });

  it('converts an image, including its link and auto width', () => {
    const { document } = unlayerToDocument(
      design([
        row([
          {
            type: 'image',
            values: {
              src: { url: 'https://x.test/a.png', width: 116, autoWidth: false },
              altText: 'Logo',
              textAlign: 'center',
              action: { values: { href: 'https://x.test' } },
            },
          },
        ]),
      ]),
    );
    expect(document.body.rows[0].columns[0].blocks[0].values).toMatchObject({
      src: 'https://x.test/a.png',
      alt: 'Logo',
      width: 116,
      href: 'https://x.test',
      alignment: 'center',
    });
  });

  it('maps button colours, radius and the inverted fullWidth flag', () => {
    const { document } = unlayerToDocument(
      design([
        row([
          {
            type: 'button',
            values: {
              text: 'Buy',
              href: { values: { href: 'https://x.test' } },
              buttonColors: { color: '#FFFFFF', backgroundColor: '#0071e3' },
              size: { autoWidth: false },
              borderRadius: '25px',
              padding: '10px 20px',
              containerPadding: '10px',
              fontSize: '17px',
            },
          },
        ]),
      ]),
    );
    expect(document.body.rows[0].columns[0].blocks[0].values).toMatchObject({
      content: '<p>Buy</p>',
      href: 'https://x.test',
      backgroundColor: '#0071e3',
      textColor: '#FFFFFF',
      borderRadius: 25,
      fontSize: 17,
      fullWidth: true,
      innerPadding: { top: 10, right: 20, bottom: 10, left: 20 },
    });
  });

  it('converts a divider', () => {
    const { document } = unlayerToDocument(
      design([
        row([
          {
            type: 'divider',
            values: {
              width: '100%',
              border: { borderTopWidth: '1px', borderTopStyle: 'dashed', borderTopColor: '#424245' },
            },
          },
        ]),
      ]),
    );
    expect(document.body.rows[0].columns[0].blocks[0].values).toMatchObject({
      borderColor: '#424245',
      borderWidth: 1,
      borderStyle: 'dashed',
    });
  });

  it('converts a menu into a navbar', () => {
    const { document } = unlayerToDocument(
      design([
        row([
          {
            type: 'menu',
            values: {
              menu: { items: [{ text: 'Shop', link: { values: { href: 'https://x.test' } } }] },
              align: 'center',
              fontSize: '14px',
              linkColor: '#d2d2d7',
            },
          },
        ]),
      ]),
    );
    expect(document.body.rows[0].columns[0].blocks[0].values).toMatchObject({
      links: [{ href: 'https://x.test', text: 'Shop' }],
      alignment: 'center',
      linkFontSize: 14,
      linkColor: '#d2d2d7',
    });
  });

  it('maps social icons and falls back to custom for unknown platforms', () => {
    const { document } = unlayerToDocument(
      design([
        row([
          {
            type: 'social',
            values: {
              icons: {
                icons: [
                  { name: 'Facebook', url: 'https://fb.test' },
                  { name: 'X', url: 'https://x.test' },
                  { name: 'Mastodon', url: 'https://m.test', image: { url: 'https://m.test/i.png' } },
                ],
              },
            },
          },
        ]),
      ]),
    );
    const icons = document.body.rows[0].columns[0].blocks[0].values.icons;
    expect(icons.map((i: { type: string }) => i.type)).toEqual(['facebook', 'twitter', 'custom']);
    expect(icons[2].iconUrl).toBe('https://m.test/i.png');
  });

  it('passes an html block through', () => {
    const { document } = unlayerToDocument(
      design([row([{ type: 'html', values: { html: '<table></table>' } }])]),
    );
    expect(document.body.rows[0].columns[0].blocks[0].values.content).toBe('<table></table>');
  });
});

describe('lossy input', () => {
  it('drops unsupported blocks with a warning rather than failing', () => {
    const { document, warnings } = unlayerToDocument(
      design([row([{ type: 'timer', values: {} }, { type: 'text', values: { text: '<p>Kept</p>' } }])]),
    );
    expect(warnings.find((w) => w.code === 'unsupported-block')?.contentType).toBe('timer');
    expect(document.body.rows[0].columns[0].blocks).toHaveLength(1);
  });

  it('names the custom tool that needs re-creating', () => {
    const { warnings } = unlayerToDocument(design([row([{ type: 'custom#product_grid', values: {} }])]));
    const warning = warnings.find((w) => w.code === 'custom-tool');
    expect(warning?.message).toContain('product_grid');
  });

  it('drops display conditions loudly instead of guessing a translation', () => {
    const { document, warnings } = unlayerToDocument(
      design([row([], { values: { displayCondition: { label: 'Premium only', before: '{% if p %}' } } })]),
    );
    const warning = warnings.find((w) => w.code === 'display-condition-dropped');
    expect(warning?.message).toContain('Premium only');
    expect(document.body.rows[0].attributes.condition).toBeUndefined();
  });

  it('skips rows with no columns', () => {
    const { document, warnings } = unlayerToDocument(design([{ cells: [1], columns: [], values: {} }]));
    expect(warnings.map((w) => w.code)).toContain('empty-row');
    expect(document.body.rows).toHaveLength(0);
  });
});

describe('cellsToRatios', () => {
  it('maps Unlayer cells onto the 12-column grid', () => {
    expect(cellsToRatios([1], 1)).toEqual([12]);
    expect(cellsToRatios([1, 1], 2)).toEqual([6, 6]);
    expect(cellsToRatios([1, 2], 2)).toEqual([4, 8]);
    expect(cellsToRatios([1, 1, 1], 3)).toEqual([4, 4, 4]);
  });

  it('always sums to 12 even when the split does not divide evenly', () => {
    for (const cells of [[1, 1, 1, 1, 1], [2, 3], [1, 1, 1, 1, 1, 1, 1]]) {
      const ratios = cellsToRatios(cells, cells.length);
      expect(ratios.reduce((a, b) => a + b, 0)).toBe(12);
      expect(ratios.every((r) => r >= 1)).toBe(true);
    }
  });

  it('falls back to an even split when cells is missing or mismatched', () => {
    expect(cellsToRatios(undefined, 2)).toEqual([6, 6]);
    expect(cellsToRatios([1], 2)).toEqual([6, 6]);
  });
});

describe('applyInlineStyle', () => {
  it('is a no-op when there is nothing to apply', () => {
    expect(applyInlineStyle('<p>Hi</p>', {})).toBe('<p>Hi</p>');
  });

  it('styles each top-level element independently', () => {
    expect(applyInlineStyle('<p>a</p><p>b</p>', { color: '#111' })).toBe(
      '<p><span style="color: #111">a</span></p><p><span style="color: #111">b</span></p>',
    );
  });

  it('does not wrap nested elements twice', () => {
    expect(applyInlineStyle('<p>a <strong>b</strong></p>', { color: '#111' })).toBe(
      '<p><span style="color: #111">a <strong>b</strong></span></p>',
    );
  });

  it('preserves existing attributes and escapes quotes', () => {
    expect(applyInlineStyle('<p><a href="https://x.test?a=1&b=2">l</a></p>', { color: '#111' })).toContain(
      'href="https://x.test?a=1&amp;b=2"',
    );
  });

  it('handles void elements and bare text', () => {
    expect(applyInlineStyle('hi<br>', { color: '#111' })).toBe(
      '<span style="color: #111">hi</span><span style="color: #111"><br></span>',
    );
  });
});

describe('the real Unlayer sample design', () => {
  const { document, warnings } = unlayerToDocument(sample as never);

  it('produces a document that passes the core schema validator', () => {
    expect(validateDocument(document)).toEqual([]);
  });

  it('imports every row and column', () => {
    expect(document.body.rows).toHaveLength(sample.body.rows.length);
    document.body.rows.forEach((r, i) => {
      expect(r.columns).toHaveLength(sample.body.rows[i].columns.length);
      expect(r.columnRatios).toHaveLength(r.columns.length);
    });
  });

  it('imports every content block the sample uses', () => {
    const imported = document.body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks));
    const source = sample.body.rows.flatMap((r) => r.columns.flatMap((c) => c.contents));
    expect(imported).toHaveLength(source.length);
    expect(warnings).toEqual([]);
  });

  it('carries the body palette across so text is not black-on-black', () => {
    expect(document.body.attributes.backgroundColor).toBe('#000000');
    const firstText = document.body.rows
      .flatMap((r) => r.columns.flatMap((c) => c.blocks))
      .find((b) => b.type === 'text');
    expect(firstText?.values.content).toContain('color:');
  });
});
