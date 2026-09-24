import { Parser } from 'htmlparser2';
import type { PigeonDocument } from '@lit-pigeon/core';

/**
 * mjmlToDocument gives every column in a section an equal width. This reads
 * the mj-column widths from the source and applies them to the imported rows,
 * rounded to the editor's 12-column grid. Rows come from mj-section and
 * mj-hero elements in source order, which is the order the parser uses.
 */
export function restoreColumnWidths(mjml: string, document: PigeonDocument, bodyWidth = document.body.attributes.width): string[] {
  const sections: Array<Array<string | undefined>> = [];
  let current: Array<string | undefined> | null = null;
  new Parser(
    {
      onopentag(name, attrs) {
        if (name === 'mj-section' || name === 'mj-hero') sections.push((current = []));
        else if (name === 'mj-column' && current) current.push(attrs.width);
      },
      onclosetag(name) {
        if (name === 'mj-section' || name === 'mj-hero') current = null;
      },
    },
    { lowerCaseTags: true, recognizeSelfClosing: true },
  ).end(mjml);

  const notes: string[] = [];
  sections.forEach((widths, index) => {
    const row = document.body.rows[index];
    if (!row || widths.length !== row.columns.length || widths.every((w) => w === undefined)) return;
    const percents = widths.map((w) => (w === undefined ? NaN : w.endsWith('%') ? parseFloat(w) : (parseFloat(w) / bodyWidth) * 100));
    const known = percents.filter((p) => !Number.isNaN(p));
    const share = (100 - known.reduce((a, b) => a + b, 0)) / (percents.length - known.length || 1);
    const ratios = percents.map((p) => Math.max(1, Math.round(((Number.isNaN(p) ? share : p) / 100) * 12)));
    if (ratios.join() !== row.columnRatios.join()) {
      notes.push(`row ${index + 1}: columns ${widths.map((w) => w ?? 'auto').join(' / ')} → ${ratios.join(':')} of 12`);
      row.columnRatios = ratios;
    }
  });
  return notes;
}
