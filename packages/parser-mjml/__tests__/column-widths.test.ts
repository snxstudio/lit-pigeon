import { describe, it, expect } from 'vitest';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

function section(columns: string, bodyAttrs = ''): string {
  return `<mjml><mj-body${bodyAttrs}><mj-section>${columns}</mj-section></mj-body></mjml>`;
}

function ratios(source: string): number[] {
  return mjmlToDocument(source).document.body.rows[0].columnRatios;
}

/** The width percentages the renderer writes back out, in column order. */
function renderedWidths(source: string): string[] {
  const { document } = mjmlToDocument(source);
  return [...documentToMjml(document).matchAll(/<mj-column width="([^"]+)"/g)].map((m) => m[1]);
}

describe('mj-column widths set the row ratios', () => {
  it('reads a percentage split instead of assuming an even one', () => {
    expect(ratios(section(`
      <mj-column width="33%"><mj-text>sidebar</mj-text></mj-column>
      <mj-column width="67%"><mj-text>main</mj-text></mj-column>
    `))).toEqual([4, 8]);
  });

  it('renders the split back out at the width it came in at', () => {
    expect(renderedWidths(section(`
      <mj-column width="33%"><mj-text>a</mj-text></mj-column>
      <mj-column width="67%"><mj-text>b</mj-text></mj-column>
    `))).toEqual(['33.33%', '66.67%']);
  });

  it('reads pixel widths against the body width', () => {
    // 150px and 450px of a 600px body is a quarter and three quarters.
    expect(ratios(section(`
      <mj-column width="150px"><mj-text>a</mj-text></mj-column>
      <mj-column width="450px"><mj-text>b</mj-text></mj-column>
    `))).toEqual([3, 9]);
  });

  it('reads pixel widths against a non-default body width', () => {
    expect(ratios(section(`
      <mj-column width="240px"><mj-text>a</mj-text></mj-column>
      <mj-column width="720px"><mj-text>b</mj-text></mj-column>
    `, ' width="960px"'))).toEqual([3, 9]);
  });

  it('treats a bare number as pixels, as MJML does', () => {
    expect(ratios(section(`
      <mj-column width="200"><mj-text>a</mj-text></mj-column>
      <mj-column width="400"><mj-text>b</mj-text></mj-column>
    `))).toEqual([4, 8]);
  });

  it('gives the columns without a width an equal share of what is left', () => {
    expect(ratios(section(`
      <mj-column width="50%"><mj-text>a</mj-text></mj-column>
      <mj-column><mj-text>b</mj-text></mj-column>
      <mj-column><mj-text>c</mj-text></mj-column>
    `))).toEqual([6, 3, 3]);
  });

  it('handles a mix of percentage and pixel widths in one section', () => {
    expect(ratios(section(`
      <mj-column width="25%"><mj-text>a</mj-text></mj-column>
      <mj-column width="450px"><mj-text>b</mj-text></mj-column>
    `))).toEqual([3, 9]);
  });

  it('keeps a column too thin to land on the grid', () => {
    const [thin] = ratios(section(`
      <mj-column width="2%"><mj-text>a</mj-text></mj-column>
      <mj-column width="98%"><mj-text>b</mj-text></mj-column>
    `));
    expect(thin).toBe(1);
  });

  it('warns when the declared widths overflow the body', () => {
    const { warnings } = mjmlToDocument(section(`
      <mj-column width="80%"><mj-text>a</mj-text></mj-column>
      <mj-column width="80%"><mj-text>b</mj-text></mj-column>
    `));
    expect(warnings.some((w) => /total 160%/.test(w.message))).toBe(true);
  });

  it('reads the widths of columns inside an mj-group', () => {
    expect(ratios(section(`
      <mj-group>
        <mj-column width="25%"><mj-text>logo</mj-text></mj-column>
        <mj-column width="75%"><mj-text>nav</mj-text></mj-column>
      </mj-group>
    `))).toEqual([3, 9]);
  });
});

describe('sections that declare no widths are unchanged', () => {
  it('splits two bare columns evenly', () => {
    expect(ratios(section(`
      <mj-column><mj-text>a</mj-text></mj-column>
      <mj-column><mj-text>b</mj-text></mj-column>
    `))).toEqual([6, 6]);
  });

  it('splits five bare columns the way it always has', () => {
    expect(ratios(section(
      '<mj-column><mj-text>x</mj-text></mj-column>'.repeat(5),
    ))).toEqual([2, 2, 2, 2, 2]);
  });

  it('does not force five equal declared widths onto a lopsided grid', () => {
    expect(ratios(section(
      '<mj-column width="20%"><mj-text>x</mj-text></mj-column>'.repeat(5),
    ))).toEqual([2, 2, 2, 2, 2]);
  });

  it('gives a single column the full grid', () => {
    expect(ratios(section('<mj-column><mj-text>a</mj-text></mj-column>'))).toEqual([12]);
  });

  it('ignores a width it cannot read', () => {
    expect(ratios(section(`
      <mj-column width="auto"><mj-text>a</mj-text></mj-column>
      <mj-column width="auto"><mj-text>b</mj-text></mj-column>
    `))).toEqual([6, 6]);
  });
});
