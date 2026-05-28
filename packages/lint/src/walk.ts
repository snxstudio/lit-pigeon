import type {
  ColumnNode,
  ContentBlock,
  PigeonDocument,
  RowNode,
} from '@lit-pigeon/core';

/** A block plus its location, returned by {@link collectBlocks}. */
export interface BlockHit {
  block: ContentBlock;
  row: RowNode;
  column: ColumnNode;
  rowIndex: number;
  columnIndex: number;
  blockIndex: number;
  path: string;
}

/**
 * Return every block in document order along with its location info.
 * Tiny by definition (one entry per block) so the array allocation is fine.
 */
export function collectBlocks(doc: PigeonDocument): BlockHit[] {
  const hits: BlockHit[] = [];
  doc.body.rows.forEach((row, rowIndex) => {
    row.columns.forEach((column, columnIndex) => {
      column.blocks.forEach((block, blockIndex) => {
        hits.push({
          block,
          row,
          column,
          rowIndex,
          columnIndex,
          blockIndex,
          path: `body.rows[${rowIndex}].columns[${columnIndex}].blocks[${blockIndex}]`,
        });
      });
    });
  });
  return hits;
}

/**
 * Read a string-valued field from `block.values`, returning `fallback` when
 * absent or of the wrong type. Lets each rule inspect URLs / alt text / etc.
 * without re-narrowing the block's union shape.
 */
export function readString(
  block: ContentBlock,
  key: string,
  fallback = '',
): string {
  const v = (block as unknown as { values: Record<string, unknown> }).values?.[key];
  return typeof v === 'string' ? v : fallback;
}
