import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { createDefaultDocument, createRow, createColumn, createBlock, type PigeonDocument } from '@lit-pigeon/core';
import { documentToMjml } from '../src/index.js';

function twoColumnDoc(noStackOnMobile?: boolean): PigeonDocument {
  const doc = createDefaultDocument('Grouping');
  const row = createRow(
    [createColumn([createBlock('text', { content: '<p>logo</p>' })]), createColumn([createBlock('text', { content: '<p>nav</p>' })])],
    [4, 8],
  );
  if (noStackOnMobile !== undefined) row.attributes.noStackOnMobile = noStackOnMobile;
  doc.body.rows = [row];
  return doc;
}

/**
 * The inline width MJML writes on each compiled column is what decides whether
 * the row stacks. A stacking column is `width:100%` inline and is narrowed only
 * by a `min-width:480px` media query, so below that breakpoint it fills the
 * row; a grouped column carries its real width inline and holds it everywhere.
 */
function inlineColumnWidths(doc: PigeonDocument): string[] {
  const html = mjml2html(documentToMjml(doc)).html;
  return [...html.matchAll(/class="mj-column-per-(?!100\b)\d+[^"]*"[^>]*?width:([\d.]+%)/g)].map((m) => m[1]);
}

describe('rows that do not stack on mobile', () => {
  it('wraps the columns in mj-group', () => {
    const mjml = documentToMjml(twoColumnDoc(true));
    expect(mjml).toContain('<mj-group>');
    expect(mjml).toContain('</mj-group>');
    expect(mjml.indexOf('<mj-group>')).toBeLessThan(mjml.indexOf('<mj-column'));
  });

  it('gives each column its real width inline, so it holds below the breakpoint', () => {
    const widths = inlineColumnWidths(twoColumnDoc(true));
    expect(widths).toHaveLength(2);
    expect(widths.every((w) => w !== '100%')).toBe(true);
  });

  it('still stacks when the flag is not set', () => {
    expect(documentToMjml(twoColumnDoc())).not.toContain('mj-group');
    // Every column is full width inline and only narrowed by the media query.
    expect(inlineColumnWidths(twoColumnDoc())).toEqual(['100%', '100%']);
  });

  it('still stacks when the flag is explicitly false', () => {
    expect(documentToMjml(twoColumnDoc(false))).not.toContain('mj-group');
  });

  it('renders byte-identically to an unflagged row when the flag is off', () => {
    expect(documentToMjml(twoColumnDoc(false))).toBe(documentToMjml(twoColumnDoc()));
  });

  it('keeps the column widths inside the group', () => {
    const mjml = documentToMjml(twoColumnDoc(true));
    expect(mjml).toContain('width="33.33%"');
    expect(mjml).toContain('width="66.67%"');
  });

  it('compiles to valid MJML with no errors', () => {
    expect(mjml2html(documentToMjml(twoColumnDoc(true))).errors).toEqual([]);
  });
});
