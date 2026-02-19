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
import type { PigeonDocument, ContentBlock, RowNode } from '../src/index.js';

function createTestState(): { state: EditorState; doc: PigeonDocument; row: RowNode; textBlock: ContentBlock } {
  const textBlock = createBlock('text', { content: '<p>Hello</p>' });
  const column = createColumn([textBlock]);
  const row = createRow([column]);
  const doc = createDefaultDocument('Test');
  doc.body.rows = [row];
  const state = EditorState.create({ doc });
  return { state, doc, row, textBlock };
}

describe('Block Commands', () => {
  it('insertBlock should add a block to a column', () => {
    const { state, row } = createTestState();
    const col = row.columns[0];
    const newBlock = createBlock('button');

    const cmd = insertBlock(row.id, col.id, newBlock);
    expect(cmd(state)).toBe(true); // Can execute

    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].columns[0].blocks).toHaveLength(2);
    expect(newState.doc.body.rows[0].columns[0].blocks[1].type).toBe('button');
  });

  it('insertBlock at specific index', () => {
    const { state, row } = createTestState();
    const col = row.columns[0];
    const newBlock = createBlock('image');

    const cmd = insertBlock(row.id, col.id, newBlock, 0);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].columns[0].blocks[0].type).toBe('image');
    expect(newState.doc.body.rows[0].columns[0].blocks[1].type).toBe('text');
  });

  it('insertBlock should return false for invalid row', () => {
    const { state, row } = createTestState();
    const cmd = insertBlock('invalid', row.columns[0].id, createBlock('text'));
    expect(cmd(state)).toBe(false);
  });

  it('deleteBlock should remove a block', () => {
    const { state, row, textBlock } = createTestState();
    const col = row.columns[0];

    const cmd = deleteBlock(row.id, col.id, textBlock.id);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].columns[0].blocks).toHaveLength(0);
  });

  it('deleteBlock should return false for invalid block', () => {
    const { state, row } = createTestState();
    const cmd = deleteBlock(row.id, row.columns[0].id, 'invalid');
    expect(cmd(state)).toBe(false);
  });

  it('updateBlock should update block values', () => {
    const { state, row, textBlock } = createTestState();
    const col = row.columns[0];

    const cmd = updateBlock(row.id, col.id, textBlock.id, { content: '<p>Updated</p>' });
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect((newState.doc.body.rows[0].columns[0].blocks[0] as any).values.content).toBe('<p>Updated</p>');
  });

  it('duplicateBlock should create a copy', () => {
    const { state, row, textBlock } = createTestState();
    const col = row.columns[0];

    const cmd = duplicateBlock(row.id, col.id, textBlock.id);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    const blocks = newState.doc.body.rows[0].columns[0].blocks;
    expect(blocks).toHaveLength(2);
    expect(blocks[0].id).not.toBe(blocks[1].id);
    expect(blocks[0].type).toBe(blocks[1].type);
  });

  it('moveBlock should move a block between columns', () => {
    const block1 = createBlock('text', { content: '<p>Block 1</p>' });
    const block2 = createBlock('button');
    const col1 = createColumn([block1]);
    const col2 = createColumn([block2]);
    const row = createRow([col1, col2], [6, 6]);
    const doc = createDefaultDocument('Test');
    doc.body.rows = [row];
    const state = EditorState.create({ doc });

    const cmd = moveBlock(row.id, col1.id, block1.id, row.id, col2.id, 0);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].columns[0].blocks).toHaveLength(0);
    expect(newState.doc.body.rows[0].columns[1].blocks).toHaveLength(2);
    expect(newState.doc.body.rows[0].columns[1].blocks[0].id).toBe(block1.id);
  });
});

describe('Row Commands', () => {
  it('insertRow should add a row', () => {
    const state = EditorState.create();
    const row = createRow();

    const cmd = insertRow(row);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows).toHaveLength(1);
  });

  it('insertRow at specific index', () => {
    const { state } = createTestState();
    const newRow = createRow();

    const cmd = insertRow(newRow, 0);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows).toHaveLength(2);
    expect(newState.doc.body.rows[0].id).toBe(newRow.id);
  });

  it('deleteRow should remove a row', () => {
    const { state, row } = createTestState();

    const cmd = deleteRow(row.id);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows).toHaveLength(0);
  });

  it('moveRow should reorder rows', () => {
    const row1 = createRow();
    const row2 = createRow();
    const doc = createDefaultDocument('Test');
    doc.body.rows = [row1, row2];
    const state = EditorState.create({ doc });

    const cmd = moveRow(row1.id, 1);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].id).toBe(row2.id);
    expect(newState.doc.body.rows[1].id).toBe(row1.id);
  });

  it('duplicateRow should create a copy with new IDs', () => {
    const { state, row } = createTestState();

    const cmd = duplicateRow(row.id);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows).toHaveLength(2);
    expect(newState.doc.body.rows[0].id).not.toBe(newState.doc.body.rows[1].id);
  });

  it('updateRowAttributes should update attributes', () => {
    const { state, row } = createTestState();

    const cmd = updateRowAttributes(row.id, { backgroundColor: '#ff0000' });
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].attributes.backgroundColor).toBe('#ff0000');
  });
});

describe('Column Commands', () => {
  it('addColumn should add a column to a row', () => {
    const { state, row } = createTestState();

    const cmd = addColumn(row.id);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].columns).toHaveLength(2);
    expect(newState.doc.body.rows[0].columnRatios).toEqual([6, 6]);
  });

  it('addColumn should fail if 4 columns already', () => {
    const doc = createDefaultDocument('Test');
    const row = createRow(
      [createColumn(), createColumn(), createColumn(), createColumn()],
      [3, 3, 3, 3],
    );
    doc.body.rows = [row];
    const state = EditorState.create({ doc });

    const cmd = addColumn(row.id);
    expect(cmd(state)).toBe(false);
  });

  it('removeColumn should remove a column', () => {
    const col1 = createColumn();
    const col2 = createColumn();
    const row = createRow([col1, col2], [6, 6]);
    const doc = createDefaultDocument('Test');
    doc.body.rows = [row];
    const state = EditorState.create({ doc });

    const cmd = removeColumn(row.id, col2.id);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].columns).toHaveLength(1);
    expect(newState.doc.body.rows[0].columnRatios).toEqual([12]);
  });

  it('removeColumn should fail if only 1 column', () => {
    const { state, row } = createTestState();
    const cmd = removeColumn(row.id, row.columns[0].id);
    expect(cmd(state)).toBe(false);
  });

  it('resizeColumns should update ratios', () => {
    const col1 = createColumn();
    const col2 = createColumn();
    const row = createRow([col1, col2], [6, 6]);
    const doc = createDefaultDocument('Test');
    doc.body.rows = [row];
    const state = EditorState.create({ doc });

    const cmd = resizeColumns(row.id, [4, 8]);
    let newState: EditorState = state;
    cmd(state, (tr) => { newState = state.apply(tr); });

    expect(newState.doc.body.rows[0].columnRatios).toEqual([4, 8]);
  });

  it('resizeColumns should fail if ratios dont sum to 12', () => {
    const col1 = createColumn();
    const col2 = createColumn();
    const row = createRow([col1, col2], [6, 6]);
    const doc = createDefaultDocument('Test');
    doc.body.rows = [row];
    const state = EditorState.create({ doc });

    const cmd = resizeColumns(row.id, [5, 5]);
    expect(cmd(state)).toBe(false);
  });
});
