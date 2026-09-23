import { mjmlToDocument, type ParseWarning } from '@lit-pigeon/parser-mjml';
import type { PigeonDocument } from '@lit-pigeon/core';
import { restoreColumnWidths } from './column-widths.js';

export interface GrapesJsImport {
  document: PigeonDocument;
  warnings: ParseWarning[];
  /** Column widths restored after parsing, for the migration report. */
  columnNotes: string[];
}

/** Imports the MJML a grapesjs-mjml editor produced (editor.getHtml()). */
export function importGrapesJsMjml(mjml: string, name: string): GrapesJsImport {
  const { document, warnings } = mjmlToDocument(mjml);
  document.metadata.name = name;
  const columnNotes = restoreColumnWidths(mjml, document);
  return { document, warnings, columnNotes };
}
