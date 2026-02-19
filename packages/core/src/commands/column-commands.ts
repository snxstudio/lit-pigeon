import type { Command } from '../types/editor.js';
import { createDocStep } from '../state/transaction.js';
import { createColumn } from '../schema/defaults.js';

export function addColumn(rowId: string): Command {
  return (state, dispatch) => {
    const rowIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return false;

    const row = state.doc.body.rows[rowIndex];
    if (row.locked) return false;
    if (row.columns.length >= 4) return false;

    if (dispatch) {
      const newCol = createColumn();
      const newCount = row.columns.length + 1;
      const newRatios = distributeRatios(newCount);
      const oldRatios = [...row.columnRatios];

      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'addColumn',
        `body.rows[${rowIndex}]`,
        (doc) => {
          doc.body.rows[rowIndex].columns.push(newCol);
          doc.body.rows[rowIndex].columnRatios = newRatios;
        },
        (doc) => {
          doc.body.rows[rowIndex].columns.pop();
          doc.body.rows[rowIndex].columnRatios = oldRatios;
        },
      );

      tr.addStep(step);
      dispatch(tr);
    }

    return true;
  };
}

export function removeColumn(rowId: string, columnId: string): Command {
  return (state, dispatch) => {
    const rowIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return false;

    const row = state.doc.body.rows[rowIndex];
    if (row.locked) return false;
    if (row.columns.length <= 1) return false;

    const colIndex = row.columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) return false;

    if (dispatch) {
      const removedCol = JSON.parse(JSON.stringify(row.columns[colIndex]));
      const oldRatios = [...row.columnRatios];
      const newCount = row.columns.length - 1;
      const newRatios = distributeRatios(newCount);

      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'removeColumn',
        `body.rows[${rowIndex}]`,
        (doc) => {
          doc.body.rows[rowIndex].columns.splice(colIndex, 1);
          doc.body.rows[rowIndex].columnRatios = newRatios;
        },
        (doc) => {
          doc.body.rows[rowIndex].columns.splice(colIndex, 0, removedCol);
          doc.body.rows[rowIndex].columnRatios = oldRatios;
        },
      );

      tr.addStep(step);
      dispatch(tr);
    }

    return true;
  };
}

export function resizeColumns(rowId: string, ratios: number[]): Command {
  return (state, dispatch) => {
    const rowIndex = state.doc.body.rows.findIndex((r) => r.id === rowId);
    if (rowIndex === -1) return false;

    const row = state.doc.body.rows[rowIndex];
    if (ratios.length !== row.columns.length) return false;

    const sum = ratios.reduce((a, b) => a + b, 0);
    if (sum !== 12) return false;

    if (dispatch) {
      const oldRatios = [...row.columnRatios];
      const tr = (state as any).createTransaction();

      const step = createDocStep(
        'resizeColumns',
        `body.rows[${rowIndex}].columnRatios`,
        (doc) => {
          doc.body.rows[rowIndex].columnRatios = ratios;
        },
        (doc) => {
          doc.body.rows[rowIndex].columnRatios = oldRatios;
        },
      );

      tr.addStep(step);
      dispatch(tr);
    }

    return true;
  };
}

function distributeRatios(count: number): number[] {
  const base = Math.floor(12 / count);
  const remainder = 12 - base * count;
  const ratios = new Array(count).fill(base);
  for (let i = 0; i < remainder; i++) {
    ratios[i] += 1;
  }
  return ratios;
}
