import type { RowNode } from '../types/document.js';
import type { Command } from '../types/editor.js';
import { createDocStep } from '../state/transaction.js';
import { createRowSelection } from '../state/selection.js';
import { generateId } from '../utils/id.js';

export function insertRow(row: RowNode, index?: number): Command {
  return (state, dispatch) => {
    const insertIndex = index ?? state.doc.body.rows.length;

    if (dispatch) {
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'insertRow',
        'body.rows',
        (doc) => {
          doc.body.rows.splice(insertIndex, 0, row);
        },
        (doc) => {
          doc.body.rows.splice(insertIndex, 1);
        },
      );

      tr.addStep(step);
      tr.setSelection(createRowSelection(row.id));
      dispatch(tr);
    }

    return true;
  };
}

export function deleteRow(rowId: string): Command {
  return (state, dispatch) => {
    const rowIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return false;

    if (dispatch) {
      const deletedRow = JSON.parse(JSON.stringify(state.doc.body.rows[rowIndex]));
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'deleteRow',
        'body.rows',
        (doc) => {
          doc.body.rows.splice(rowIndex, 1);
        },
        (doc) => {
          doc.body.rows.splice(rowIndex, 0, deletedRow);
        },
      );

      tr.addStep(step);
      tr.setSelection(null);
      dispatch(tr);
    }

    return true;
  };
}

export function moveRow(rowId: string, toIndex: number): Command {
  return (state, dispatch) => {
    const fromIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (fromIndex === -1) return false;
    if (fromIndex === toIndex) return false;

    if (dispatch) {
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'moveRow',
        'body.rows',
        (doc) => {
          const [removed] = doc.body.rows.splice(fromIndex, 1);
          doc.body.rows.splice(toIndex, 0, removed);
        },
        (doc) => {
          const [removed] = doc.body.rows.splice(toIndex, 1);
          doc.body.rows.splice(fromIndex, 0, removed);
        },
      );

      tr.addStep(step);
      tr.setSelection(createRowSelection(rowId));
      dispatch(tr);
    }

    return true;
  };
}

export function duplicateRow(rowId: string): Command {
  return (state, dispatch) => {
    const rowIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return false;

    if (dispatch) {
      const original = state.doc.body.rows[rowIndex];
      const duplicate: RowNode = JSON.parse(JSON.stringify(original));
      duplicate.id = generateId();
      // Give new IDs to columns and blocks
      duplicate.columns.forEach((col) => {
        col.id = generateId();
        col.blocks.forEach((block) => {
          block.id = generateId();
        });
      });

      const insertIndex = rowIndex + 1;
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'duplicateRow',
        'body.rows',
        (doc) => {
          doc.body.rows.splice(insertIndex, 0, duplicate);
        },
        (doc) => {
          doc.body.rows.splice(insertIndex, 1);
        },
      );

      tr.addStep(step);
      tr.setSelection(createRowSelection(duplicate.id));
      dispatch(tr);
    }

    return true;
  };
}

export function updateRowAttributes(
  rowId: string,
  attributes: Partial<RowNode['attributes']>,
): Command {
  return (state, dispatch) => {
    const rowIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return false;

    if (dispatch) {
      const oldAttrs = { ...state.doc.body.rows[rowIndex].attributes };
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'updateRowAttributes',
        `body.rows[${rowIndex}].attributes`,
        (doc) => {
          Object.assign(doc.body.rows[rowIndex].attributes, attributes);
        },
        (doc) => {
          doc.body.rows[rowIndex].attributes = oldAttrs as any;
        },
      );

      tr.addStep(step);
      dispatch(tr);
    }

    return true;
  };
}
