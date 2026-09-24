import { describe, it, expect } from 'vitest';
import {
  EditorState,
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  insertBlock,
  deleteBlock,
  updateBlock,
  moveBlock,
  duplicateBlock,
  insertRow,
  deleteRow,
  moveRow,
  duplicateRow,
  updateRowAttributes,
  addColumn,
  removeColumn,
  resizeColumns,
} from '../src/index.js';
import type { Command } from '../src/index.js';

function setup() {
  const locked = createRow([createColumn([createBlock('text')]), createColumn([createBlock('button')])]);
  locked.locked = true;
  const open = createRow([createColumn([createBlock('text')])]);
  const doc = createDefaultDocument('Locked');
  doc.body.rows = [locked, open];
  return { state: EditorState.create({ doc }), locked, open };
}

describe('locked rows', () => {
  const { state, locked, open } = setup();
  const [lc0, lc1] = locked.columns;
  const lb = lc0.blocks[0];
  const oc = open.columns[0];
  const ob = oc.blocks[0];

  const refused: Array<[string, Command]> = [
    ['deleteRow', deleteRow(locked.id)],
    ['moveRow', moveRow(locked.id, 1)],
    ['duplicateRow', duplicateRow(locked.id)],
    ['updateRowAttributes', updateRowAttributes(locked.id, { backgroundColor: '#000' })],
    ['addColumn', addColumn(locked.id)],
    ['removeColumn', removeColumn(locked.id, lc1.id)],
    ['resizeColumns', resizeColumns(locked.id, [4, 8])],
    ['insertBlock', insertBlock(locked.id, lc0.id, createBlock('divider'))],
    ['deleteBlock', deleteBlock(locked.id, lc0.id, lb.id)],
    ['updateBlock', updateBlock(locked.id, lc0.id, lb.id, { content: '<p>x</p>' })],
    ['duplicateBlock', duplicateBlock(locked.id, lc0.id, lb.id)],
    ['moveBlock out of', moveBlock(locked.id, lc0.id, lb.id, open.id, oc.id, 0)],
    ['moveBlock within', moveBlock(locked.id, lc0.id, lb.id, locked.id, lc1.id, 0)],
    ['moveBlock into', moveBlock(open.id, oc.id, ob.id, locked.id, lc0.id, 0)],
  ];

  it.each(refused)('refuses %s and never dispatches', (_, cmd) => {
    let dispatched = false;
    expect(cmd(state)).toBe(false);
    expect(cmd(state, () => { dispatched = true; })).toBe(false);
    expect(dispatched).toBe(false);
  });

  it('still allows edits to unlocked rows and moving them past a locked row', () => {
    expect(updateBlock(open.id, oc.id, ob.id, { content: '<p>y</p>' })(state)).toBe(true);
    expect(moveRow(open.id, 0)(state)).toBe(true);
    expect(insertRow(createRow([createColumn()]), 0)(state)).toBe(true);
    expect(deleteRow(open.id)(state)).toBe(true);
  });
});
