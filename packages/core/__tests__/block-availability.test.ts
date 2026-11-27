import { describe, it, expect, afterEach } from 'vitest';
import {
  setAvailableBlockTypes,
  getAvailableBlockDefinitions,
  getAllBlockDefinitions,
  isBlockTypeAvailable,
  insertBlock,
  createBlock,
  createRow,
  createColumn,
  createDefaultDocument,
  EditorState,
} from '../src/index.js';

afterEach(() => setAvailableBlockTypes(undefined));

function stateWithOneColumn() {
  const doc = createDefaultDocument('Test');
  const column = createColumn();
  doc.body.rows = [createRow([column])];
  let state = EditorState.create({ doc });
  return {
    get state() { return state; },
    // EditorState.apply returns the next state rather than mutating.
    dispatch: (tr: Parameters<EditorState['apply']>[0]) => { state = state.apply(tr); },
    rowId: doc.body.rows[0].id,
    columnId: column.id,
  };
}

function blocksIn(state: EditorState) {
  return state.doc.body.rows[0].columns[0].blocks;
}

describe('block availability', () => {
  it('offers every registered block until a host says otherwise', () => {
    expect(getAvailableBlockDefinitions()).toEqual(getAllBlockDefinitions());
    expect(isBlockTypeAvailable('html')).toBe(true);
  });

  it('restricts the palette to the host’s list, in its order', () => {
    setAvailableBlockTypes(['button', 'text']);

    expect(getAvailableBlockDefinitions().map((d) => d.type)).toEqual(['button', 'text']);
    expect(isBlockTypeAvailable('text')).toBe(true);
    expect(isBlockTypeAvailable('html')).toBe(false);
  });

  it('skips a listed type nobody registered', () => {
    setAvailableBlockTypes(['text', 'nope']);

    expect(getAvailableBlockDefinitions().map((d) => d.type)).toEqual(['text']);
  });

  it('lifts the restriction when set back to undefined', () => {
    setAvailableBlockTypes(['text']);
    setAvailableBlockTypes(undefined);

    expect(getAvailableBlockDefinitions()).toEqual(getAllBlockDefinitions());
    expect(isBlockTypeAvailable('html')).toBe(true);
  });

  it('does not alias the caller’s array', () => {
    const types = ['text', 'button'];
    setAvailableBlockTypes(types);
    types.push('html');

    expect(isBlockTypeAvailable('html')).toBe(false);
  });
});

describe('insertBlock honours availability', () => {
  it('inserts an available block', () => {
    setAvailableBlockTypes(['text']);
    const ctx = stateWithOneColumn();

    const applied = insertBlock(ctx.rowId, ctx.columnId, createBlock('text'))(ctx.state, ctx.dispatch);

    expect(applied).toBe(true);
    expect(blocksIn(ctx.state)).toHaveLength(1);
  });

  it('refuses a block the host left out, even though the type is registered', () => {
    // The point of gating here rather than in the palette: this path is what
    // the keyboard handlers and paste use, none of which consult the palette.
    setAvailableBlockTypes(['text']);
    const ctx = stateWithOneColumn();

    const applied = insertBlock(ctx.rowId, ctx.columnId, createBlock('html'))(ctx.state, ctx.dispatch);

    expect(applied).toBe(false);
    expect(blocksIn(ctx.state)).toHaveLength(0);
  });

  it('reports refusal without a dispatch, so callers can probe first', () => {
    setAvailableBlockTypes(['text']);
    const ctx = stateWithOneColumn();

    expect(insertBlock(ctx.rowId, ctx.columnId, createBlock('html'))(ctx.state)).toBe(false);
    expect(insertBlock(ctx.rowId, ctx.columnId, createBlock('text'))(ctx.state)).toBe(true);
  });

  it('keeps rendering a document that already holds an omitted type', () => {
    // Availability gates authoring, not display — narrowing the palette must
    // never blank a template someone saved earlier.
    const doc = createDefaultDocument('Test');
    const column = createColumn([createBlock('html')]);
    doc.body.rows = [createRow([column])];
    setAvailableBlockTypes(['text']);

    expect(doc.body.rows[0].columns[0].blocks[0].type).toBe('html');
  });
});
