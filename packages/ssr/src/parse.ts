import type { PigeonDocument } from '@lit-pigeon/core';
import { mjmlToDocument, type ParseOptions, type ParseWarning } from '@lit-pigeon/parser-mjml';

export type ParseMjmlOptions = ParseOptions;

export interface ParseMjmlResult {
  document: PigeonDocument;
  warnings: ParseWarning[];
}

/**
 * Parse MJML markup into a `PigeonDocument`. Mirrors `@lit-pigeon/parser-mjml`
 * but is re-exported here so an SSR consumer only needs one dependency.
 */
export function parseMjml(mjml: string, options?: ParseMjmlOptions): ParseMjmlResult {
  const result = mjmlToDocument(mjml, options);
  return { document: result.document, warnings: result.warnings };
}
