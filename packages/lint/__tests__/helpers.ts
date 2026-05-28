import {
  createBlock,
  createColumn,
  createDefaultDocument,
  createRow,
  type ContentBlock,
  type PigeonDocument,
} from '@lit-pigeon/core';

/**
 * Construct a document with a single column holding the supplied blocks.
 * Tests use this to spin up a minimal, valid document around the values
 * the rule under test actually cares about.
 */
export function makeDoc(
  blocks: ContentBlock[],
  metadata?: Partial<PigeonDocument['metadata']>,
): PigeonDocument {
  const doc = createDefaultDocument(metadata?.name ?? 'Subject');
  if (metadata?.previewText) doc.metadata.previewText = metadata.previewText;
  doc.body.rows.push(createRow([createColumn(blocks)]));
  return doc;
}

export function makeBlock(type: string, values: Record<string, unknown> = {}): ContentBlock {
  return createBlock(type, values) as ContentBlock;
}
