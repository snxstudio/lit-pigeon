import type { Selection } from '../types/editor.js';

export function createBlockSelection(rowId: string, columnId: string, blockId: string): Selection {
  return { type: 'block', rowId, columnId, blockId };
}

export function createRowSelection(rowId: string): Selection {
  return { type: 'row', rowId };
}

export function createColumnSelection(rowId: string, columnId: string): Selection {
  return { type: 'column', rowId, columnId };
}

export function createBodySelection(): Selection {
  return { type: 'body' };
}

export function selectionsEqual(a: Selection | null, b: Selection | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.type === b.type &&
    a.rowId === b.rowId &&
    a.columnId === b.columnId &&
    a.blockId === b.blockId
  );
}
