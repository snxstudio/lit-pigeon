import type { RowNode } from '../types/document.js';
import { generateId } from '../utils/id.js';

/**
 * Deep-clone a row and assign fresh ids to the row, every column, and every
 * block. Used when inserting a saved library row so it never collides with
 * existing node ids. (Same id-regeneration the `duplicateRow` command performs.)
 */
export function cloneRowWithNewIds(row: RowNode): RowNode {
  const clone = structuredClone(row);
  clone.id = generateId();
  clone.columns.forEach((col) => {
    col.id = generateId();
    col.blocks.forEach((block) => {
      block.id = generateId();
    });
  });
  return clone;
}
