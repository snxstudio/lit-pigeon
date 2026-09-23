import { describe, it, expect } from 'vitest';
import {
  EditorState,
  createDefaultDocument,
  createRow,
  createColumn,
  updateColumnAttributes,
  createHistoryPlugin,
  undo,
} from '../src/index.js';

function setup(locked = false) {
  const column = createColumn();
  const row = createRow([createColumn(), column]);
  row.locked = locked;
  const doc = createDefaultDocument('Cols');
  doc.body.rows = [row];
  return { state: EditorState.create({ doc, plugins: [createHistoryPlugin()] }), row, column };
}

describe('updateColumnAttributes', () => {
  it('merges attributes into the column and undoes back', () => {
    const { state, row, column } = setup();
    let next = state;
    expect(updateColumnAttributes(row.id, column.id, { hideOnMobile: true })(state, (tr) => { next = state.apply(tr); })).toBe(true);
    expect(next.doc.body.rows[0].columns[1].attributes).toMatchObject({ hideOnMobile: true, verticalAlign: 'top' });
    expect(next.doc.body.rows[0].columns[0].attributes.hideOnMobile).toBeUndefined();

    let undone = next;
    undo(next, (tr) => { undone = next.apply(tr); });
    expect(undone.doc.body.rows[0].columns[1].attributes).toEqual(column.attributes);
  });

  it('refuses unknown ids and locked rows', () => {
    const { state, row, column } = setup();
    expect(updateColumnAttributes('nope', column.id, { hideOnMobile: true })(state)).toBe(false);
    expect(updateColumnAttributes(row.id, 'nope', { hideOnMobile: true })(state)).toBe(false);
    const locked = setup(true);
    expect(updateColumnAttributes(locked.row.id, locked.column.id, { hideOnMobile: true })(locked.state)).toBe(false);
  });
});
