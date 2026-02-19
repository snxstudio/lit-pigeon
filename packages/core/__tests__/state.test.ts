import { describe, it, expect } from 'vitest';
import {
  EditorState,
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  createHistoryPlugin,
  createBlockSelection,
  createRowSelection,
  createBodySelection,
  selectionsEqual,
  createDocStep,
} from '../src/index.js';

describe('EditorState', () => {
  it('should create with default document', () => {
    const state = EditorState.create();
    expect(state.doc).toBeDefined();
    expect(state.doc.version).toBe('1.0');
    expect(state.doc.body.rows).toHaveLength(0);
    expect(state.selection).toBeNull();
  });

  it('should create with provided document', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [createRow()];

    const state = EditorState.create({ doc });
    expect(state.doc.metadata.name).toBe('Test');
    expect(state.doc.body.rows).toHaveLength(1);
  });

  it('should create with plugins', () => {
    const state = EditorState.create({
      plugins: [createHistoryPlugin()],
    });
    expect(state.plugins.has('history')).toBe(true);
  });

  it('should apply transaction with steps', () => {
    const doc = createDefaultDocument('Test');
    const row = createRow();
    doc.body.rows = [row];

    const state = EditorState.create({ doc });
    const tr = state.createTransaction();

    const step = createDocStep(
      'test',
      'body.rows',
      (d) => {
        d.body.rows.push(createRow());
      },
      (d) => {
        d.body.rows.pop();
      },
    );

    tr.addStep(step);
    const newState = state.apply(tr);

    expect(newState.doc.body.rows).toHaveLength(2);
    expect(state.doc.body.rows).toHaveLength(1); // Original unchanged
  });

  it('should apply transaction with selection', () => {
    const state = EditorState.create();
    const tr = state.createTransaction();
    tr.setSelection(createBodySelection());

    const newState = state.apply(tr);
    expect(newState.selection).toEqual({ type: 'body' });
    expect(state.selection).toBeNull(); // Original unchanged
  });

  it('should preserve selection when transaction does not set selection', () => {
    const state = EditorState.create();
    const tr1 = state.createTransaction();
    tr1.setSelection(createRowSelection('r1'));
    const state2 = state.apply(tr1);

    const tr2 = state2.createTransaction();
    // Don't set selection
    const state3 = state2.apply(tr2);
    expect(state3.selection).toEqual({ type: 'row', rowId: 'r1' });
  });
});

describe('Selection', () => {
  it('should create block selection', () => {
    const sel = createBlockSelection('r1', 'c1', 'b1');
    expect(sel).toEqual({ type: 'block', rowId: 'r1', columnId: 'c1', blockId: 'b1' });
  });

  it('should create row selection', () => {
    const sel = createRowSelection('r1');
    expect(sel).toEqual({ type: 'row', rowId: 'r1' });
  });

  it('should create body selection', () => {
    const sel = createBodySelection();
    expect(sel).toEqual({ type: 'body' });
  });

  it('should compare equal selections', () => {
    const a = createBlockSelection('r1', 'c1', 'b1');
    const b = createBlockSelection('r1', 'c1', 'b1');
    expect(selectionsEqual(a, b)).toBe(true);
  });

  it('should compare unequal selections', () => {
    const a = createBlockSelection('r1', 'c1', 'b1');
    const c = createBlockSelection('r1', 'c1', 'b2');
    expect(selectionsEqual(a, c)).toBe(false);
  });

  it('should handle null comparisons', () => {
    const a = createBlockSelection('r1', 'c1', 'b1');
    expect(selectionsEqual(null, null)).toBe(true);
    expect(selectionsEqual(a, null)).toBe(false);
    expect(selectionsEqual(null, a)).toBe(false);
  });
});
