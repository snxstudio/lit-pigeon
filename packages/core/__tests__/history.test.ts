import { describe, it, expect } from 'vitest';
import {
  EditorState,
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  createHistoryPlugin,
  undo,
  redo,
  canUndo,
  canRedo,
  HISTORY_PLUGIN_NAME,
  insertRow,
  deleteRow,
  insertBlock,
} from '../src/index.js';
import type { HistoryState } from '../src/index.js';

function createHistoryState() {
  return EditorState.create({
    plugins: [createHistoryPlugin()],
  });
}

describe('History', () => {
  it('should start with empty history', () => {
    const state = createHistoryState();
    const history = state.getPluginState<HistoryState>(HISTORY_PLUGIN_NAME)!;
    expect(history.undoStack).toHaveLength(0);
    expect(history.redoStack).toHaveLength(0);
  });

  it('should track changes in undo stack', () => {
    let state = createHistoryState();
    const row = createRow();

    const cmd = insertRow(row);
    cmd(state, (tr) => { state = state.apply(tr); });

    const history = state.getPluginState<HistoryState>(HISTORY_PLUGIN_NAME)!;
    expect(history.undoStack).toHaveLength(1);
    expect(state.doc.body.rows).toHaveLength(1);
  });

  it('canUndo should reflect state', () => {
    let state = createHistoryState();
    const history0 = state.getPluginState<HistoryState>(HISTORY_PLUGIN_NAME)!;
    expect(canUndo(history0)).toBe(false);

    const row = createRow();
    insertRow(row)(state, (tr) => { state = state.apply(tr); });

    const history1 = state.getPluginState<HistoryState>(HISTORY_PLUGIN_NAME)!;
    expect(canUndo(history1)).toBe(true);
  });

  it('should undo a change', () => {
    let state = createHistoryState();
    const row = createRow();

    insertRow(row)(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(1);

    undo(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(0);
  });

  it('should redo a change', () => {
    let state = createHistoryState();
    const row = createRow();

    insertRow(row)(state, (tr) => { state = state.apply(tr); });
    undo(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(0);

    redo(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(1);
  });

  it('undo should return false when nothing to undo', () => {
    const state = createHistoryState();
    expect(undo(state)).toBe(false);
  });

  it('redo should return false when nothing to redo', () => {
    const state = createHistoryState();
    expect(redo(state)).toBe(false);
  });

  it('new changes should clear redo stack', () => {
    let state = createHistoryState();

    const row1 = createRow();
    insertRow(row1)(state, (tr) => { state = state.apply(tr); });

    undo(state, (tr) => { state = state.apply(tr); });

    const history1 = state.getPluginState<HistoryState>(HISTORY_PLUGIN_NAME)!;
    expect(canRedo(history1)).toBe(true);

    const row2 = createRow();
    insertRow(row2)(state, (tr) => { state = state.apply(tr); });

    const history2 = state.getPluginState<HistoryState>(HISTORY_PLUGIN_NAME)!;
    expect(canRedo(history2)).toBe(false);
  });

  it('should handle multiple undo/redo operations', () => {
    let state = createHistoryState();

    const row1 = createRow();
    insertRow(row1)(state, (tr) => { state = state.apply(tr); });

    const row2 = createRow();
    insertRow(row2)(state, (tr) => { state = state.apply(tr); });

    expect(state.doc.body.rows).toHaveLength(2);

    undo(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(1);

    undo(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(0);

    redo(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(1);

    redo(state, (tr) => { state = state.apply(tr); });
    expect(state.doc.body.rows).toHaveLength(2);
  });
});
