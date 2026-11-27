import { describe, it, expect } from 'vitest';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { mjmlToDocument } from '../src/index.js';

const GROUPED = `<mjml><mj-body><mj-section>
  <mj-group>
    <mj-column width="40%"><mj-text>logo</mj-text></mj-column>
    <mj-column width="60%"><mj-text>nav</mj-text></mj-column>
  </mj-group>
</mj-section></mj-body></mjml>`;

function firstRow(source: string) {
  return mjmlToDocument(source).document.body.rows[0];
}

describe('mj-group becomes a non-stacking row', () => {
  it('sets the flag instead of discarding the group', () => {
    expect(firstRow(GROUPED).attributes.noStackOnMobile).toBe(true);
  });

  it('keeps the grouped columns and their widths', () => {
    const row = firstRow(GROUPED);
    expect(row.columns).toHaveLength(2);
    expect(row.columnRatios).toEqual([5, 7]);
  });

  it('re-emits the group on the way back out', () => {
    const mjml = documentToMjml(mjmlToDocument(GROUPED).document);
    expect(mjml).toContain('<mj-group>');
    expect(mjmlToDocument(mjml).document.body.rows[0].attributes.noStackOnMobile).toBe(true);
  });

  it('is stable over a second round trip', () => {
    const once = documentToMjml(mjmlToDocument(GROUPED).document);
    expect(documentToMjml(mjmlToDocument(once).document)).toBe(once);
  });

  it('does not warn about a section that is one whole group', () => {
    expect(mjmlToDocument(GROUPED).warnings).toEqual([]);
  });
});

describe('sections a row-level flag cannot express', () => {
  const MIXED = `<mjml><mj-body><mj-section>
    <mj-group>
      <mj-column width="25%"><mj-text>a</mj-text></mj-column>
      <mj-column width="25%"><mj-text>b</mj-text></mj-column>
    </mj-group>
    <mj-column width="50%"><mj-text>c</mj-text></mj-column>
  </mj-section></mj-body></mjml>`;

  const TWO_GROUPS = `<mjml><mj-body><mj-section>
    <mj-group><mj-column width="25%"><mj-text>a</mj-text></mj-column></mj-group>
    <mj-group><mj-column width="75%"><mj-text>b</mj-text></mj-column></mj-group>
  </mj-section></mj-body></mjml>`;

  it('warns when a group sits beside a loose column, and does not set the flag', () => {
    const { document, warnings } = mjmlToDocument(MIXED);
    expect(document.body.rows[0].attributes.noStackOnMobile).toBeUndefined();
    expect(warnings.some((w) => w.tag === 'mj-group')).toBe(true);
  });

  it('keeps every column from a mixed section', () => {
    expect(mjmlToDocument(MIXED).document.body.rows[0].columns).toHaveLength(3);
  });

  it('warns when a section holds more than one group', () => {
    const { document, warnings } = mjmlToDocument(TWO_GROUPS);
    expect(document.body.rows[0].attributes.noStackOnMobile).toBeUndefined();
    expect(warnings.some((w) => w.tag === 'mj-group')).toBe(true);
  });
});

describe('sections without a group are unchanged', () => {
  it('leaves the flag off', () => {
    const row = firstRow(`<mjml><mj-body><mj-section>
      <mj-column><mj-text>a</mj-text></mj-column>
      <mj-column><mj-text>b</mj-text></mj-column>
    </mj-section></mj-body></mjml>`);
    expect(row.attributes.noStackOnMobile).toBeUndefined();
    expect(Object.keys(row.attributes)).not.toContain('noStackOnMobile');
  });
});
