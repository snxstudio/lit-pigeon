import type { FontDefinition, PigeonDocument, RenderError } from '@lit-pigeon/core';
import { mjmlToDocument, type ParseWarning } from '@lit-pigeon/parser-mjml';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

/** What the host application stores for each template. */
export interface StoredTemplate {
  mjml: string;
  html: string;
}

// #region open
export function openTemplate(stored: StoredTemplate): {
  document: PigeonDocument;
  warnings: ParseWarning[];
} {
  const { document, warnings } = mjmlToDocument(stored.mjml);
  // Show warnings to the user: each one is something that will not survive the next save.
  return { document, warnings };
}
// #endregion open

// #region save
const renderer = new MjmlRenderer();

export async function saveTemplate(
  document: PigeonDocument,
  fonts: FontDefinition[] = [],
): Promise<StoredTemplate & { errors: RenderError[] }> {
  // Pass the same fonts the editor uses (config.fontConfig) so both outputs load them.
  const mjml = documentToMjml(document, { fonts });
  const { html, errors } = await renderer.render(document, { fonts });
  return { mjml, html, errors };
}
// #endregion save
