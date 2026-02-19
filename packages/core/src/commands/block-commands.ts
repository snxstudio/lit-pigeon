import type { ContentBlock } from '../types/document.js';
import type { Command } from '../types/editor.js';
import { createDocStep } from '../state/transaction.js';
import { createBlockSelection } from '../state/selection.js';
import { generateId } from '../utils/id.js';

function findRowAndColumn(
  doc: { body: { rows: Array<{ id: string; columns: Array<{ id: string; blocks: ContentBlock[] }> }> } },
  rowId: string,
  columnId: string,
): { rowIndex: number; columnIndex: number } | null {
  const rowIndex = doc.body.rows.findIndex((r) => r.id === rowId);
  if (rowIndex === -1) return null;
  const columnIndex = doc.body.rows[rowIndex].columns.findIndex((c) => c.id === columnId);
  if (columnIndex === -1) return null;
  return { rowIndex, columnIndex };
}

export function insertBlock(
  rowId: string,
  columnId: string,
  block: ContentBlock,
  index?: number,
): Command {
  return (state, dispatch) => {
    const loc = findRowAndColumn(state.doc, rowId, columnId);
    if (!loc) return false;

    const col = state.doc.body.rows[loc.rowIndex].columns[loc.columnIndex];
    const insertIndex = index ?? col.blocks.length;

    if (dispatch) {
      const tr = ('createTransaction' in state)
        ? (state as any).createTransaction()
        : null;
      if (!tr) return false;

      const step = createDocStep(
        'insertBlock',
        `body.rows[${loc.rowIndex}].columns[${loc.columnIndex}].blocks`,
        (doc) => {
          doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks.splice(insertIndex, 0, block);
        },
        (doc) => {
          doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks.splice(insertIndex, 1);
        },
      );

      tr.addStep(step);
      tr.setSelection(createBlockSelection(rowId, columnId, block.id));
      dispatch(tr);
    }

    return true;
  };
}

export function deleteBlock(rowId: string, columnId: string, blockId: string): Command {
  return (state, dispatch) => {
    const loc = findRowAndColumn(state.doc, rowId, columnId);
    if (!loc) return false;

    const col = state.doc.body.rows[loc.rowIndex].columns[loc.columnIndex];
    const blockIndex = col.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return false;

    if (dispatch) {
      const deletedBlock = { ...col.blocks[blockIndex] };
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'deleteBlock',
        `body.rows[${loc.rowIndex}].columns[${loc.columnIndex}].blocks`,
        (doc) => {
          doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks.splice(blockIndex, 1);
        },
        (doc) => {
          doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks.splice(
            blockIndex, 0, deletedBlock as any,
          );
        },
      );

      tr.addStep(step);
      tr.setSelection(null);
      dispatch(tr);
    }

    return true;
  };
}

export function updateBlock(
  rowId: string,
  columnId: string,
  blockId: string,
  values: Record<string, unknown>,
): Command {
  return (state, dispatch) => {
    const loc = findRowAndColumn(state.doc, rowId, columnId);
    if (!loc) return false;

    const col = state.doc.body.rows[loc.rowIndex].columns[loc.columnIndex];
    const blockIndex = col.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return false;

    if (dispatch) {
      const oldValues = { ...col.blocks[blockIndex].values };
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'updateBlock',
        `body.rows[${loc.rowIndex}].columns[${loc.columnIndex}].blocks[${blockIndex}]`,
        (doc) => {
          const block = doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks[blockIndex];
          Object.assign(block.values, values);
        },
        (doc) => {
          const block = doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks[blockIndex];
          block.values = oldValues as any;
        },
      );

      tr.addStep(step);
      dispatch(tr);
    }

    return true;
  };
}

export function moveBlock(
  fromRowId: string,
  fromColumnId: string,
  blockId: string,
  toRowId: string,
  toColumnId: string,
  toIndex: number,
): Command {
  return (state, dispatch) => {
    const fromLoc = findRowAndColumn(state.doc, fromRowId, fromColumnId);
    if (!fromLoc) return false;

    const fromCol = state.doc.body.rows[fromLoc.rowIndex].columns[fromLoc.columnIndex];
    const blockIndex = fromCol.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return false;

    const toLoc = findRowAndColumn(state.doc, toRowId, toColumnId);
    if (!toLoc) return false;

    if (dispatch) {
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'moveBlock',
        'body.rows',
        (doc) => {
          const [removed] = doc.body.rows[fromLoc.rowIndex].columns[fromLoc.columnIndex].blocks.splice(blockIndex, 1);
          doc.body.rows[toLoc.rowIndex].columns[toLoc.columnIndex].blocks.splice(toIndex, 0, removed);
        },
        (doc) => {
          const [removed] = doc.body.rows[toLoc.rowIndex].columns[toLoc.columnIndex].blocks.splice(toIndex, 1);
          doc.body.rows[fromLoc.rowIndex].columns[fromLoc.columnIndex].blocks.splice(blockIndex, 0, removed);
        },
      );

      tr.addStep(step);
      tr.setSelection(createBlockSelection(toRowId, toColumnId, blockId));
      dispatch(tr);
    }

    return true;
  };
}

export function duplicateBlock(rowId: string, columnId: string, blockId: string): Command {
  return (state, dispatch) => {
    const loc = findRowAndColumn(state.doc, rowId, columnId);
    if (!loc) return false;

    const col = state.doc.body.rows[loc.rowIndex].columns[loc.columnIndex];
    const blockIndex = col.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return false;

    if (dispatch) {
      const original = col.blocks[blockIndex];
      const newId = generateId();
      const duplicate = JSON.parse(JSON.stringify(original));
      duplicate.id = newId;

      const insertIndex = blockIndex + 1;
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'duplicateBlock',
        `body.rows[${loc.rowIndex}].columns[${loc.columnIndex}].blocks`,
        (doc) => {
          doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks.splice(insertIndex, 0, duplicate);
        },
        (doc) => {
          doc.body.rows[loc.rowIndex].columns[loc.columnIndex].blocks.splice(insertIndex, 1);
        },
      );

      tr.addStep(step);
      tr.setSelection(createBlockSelection(rowId, columnId, newId));
      dispatch(tr);
    }

    return true;
  };
}
