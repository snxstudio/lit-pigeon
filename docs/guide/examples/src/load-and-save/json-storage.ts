import { validateDocument, type PigeonDocument } from '@lit-pigeon/core';

/** Store the document itself, plus the rendered HTML for sending. */
export interface StoredDocument {
  document: string;
  html: string;
}

export function serialiseDocument(document: PigeonDocument): string {
  return JSON.stringify(document);
}

export function parseStoredDocument(json: string): PigeonDocument {
  const value: unknown = JSON.parse(json);
  const errors = validateDocument(value);
  if (errors.length > 0) {
    throw new Error(`Invalid document: ${errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
  }
  return value as PigeonDocument;
}
