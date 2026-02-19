/**
 * Drop-zone calculation utilities.
 * Given a mouse position and the set of rendered rows/columns/blocks,
 * determines where the dragged item should be inserted.
 */

export interface DropTarget {
  /** 'row' means inserting a new row between existing rows */
  zone: 'row' | 'block';
  /** Index to insert the row at (for zone=row) */
  rowIndex?: number;
  /** IDs for block drops */
  rowId?: string;
  columnId?: string;
  /** Index within the column's block list */
  blockIndex?: number;
}

/**
 * Given a Y coordinate and a list of row elements, determine
 * which row gap the cursor is closest to.
 */
export function calculateRowDropIndex(
  clientY: number,
  rowElements: HTMLElement[],
): number {
  if (rowElements.length === 0) return 0;

  for (let i = 0; i < rowElements.length; i++) {
    const rect = rowElements[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return i;
    }
  }
  return rowElements.length;
}

/**
 * Given a Y coordinate and a list of block elements within a column,
 * determine which block gap the cursor is closest to.
 */
export function calculateBlockDropIndex(
  clientY: number,
  blockElements: HTMLElement[],
): number {
  if (blockElements.length === 0) return 0;

  for (let i = 0; i < blockElements.length; i++) {
    const rect = blockElements[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return i;
    }
  }
  return blockElements.length;
}
