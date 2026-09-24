import { unlayerToDocument, type ImportWarning, type UnlayerDesign } from '@lit-pigeon/import-unlayer';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { renderDocument } from '@lit-pigeon/ssr';
import type { PigeonDocument } from '@lit-pigeon/core';

export interface UnlayerRecord {
  id: string;
  name: string;
  /** What Unlayer's editor.saveDesign() returned, as an object or a JSON string. */
  design: UnlayerDesign | string;
}

export interface MigratedTemplate {
  id: string;
  document: PigeonDocument;
  mjml: string;
  html: string;
  warnings: ImportWarning[];
}

/** Converts stored Unlayer designs and renders them, collecting warnings for review. */
export async function migrateUnlayerDesigns(records: UnlayerRecord[]): Promise<MigratedTemplate[]> {
  const migrated: MigratedTemplate[] = [];
  for (const record of records) {
    const { document, warnings } = unlayerToDocument(record.design, { name: record.name });
    const { html, errors } = await renderDocument(document);
    if (errors.length > 0) throw new Error(`${record.id}: ${errors.map((e) => e.message).join('; ')}`);
    migrated.push({ id: record.id, document, mjml: documentToMjml(document), html, warnings });
  }
  return migrated;
}
