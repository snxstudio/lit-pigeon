import { mjmlToDocument, type ParseWarning } from '@lit-pigeon/parser-mjml';
import type { PigeonDocument } from '@lit-pigeon/core';

export interface GrapesJsImport {
  document: PigeonDocument;
  warnings: ParseWarning[];
}

/** Imports the MJML a grapesjs-mjml editor produced (editor.getHtml()). */
export function importGrapesJsMjml(mjml: string, name: string): GrapesJsImport {
  const { document, warnings } = mjmlToDocument(mjml);
  document.metadata.name = name;
  return { document, warnings };
}
