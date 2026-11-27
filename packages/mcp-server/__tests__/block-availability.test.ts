import { describe, it, expect, afterEach } from 'vitest';
import { setAvailableBlockTypes } from '@lit-pigeon/core';
import { DocumentStore } from '../src/store/document-store.js';

afterEach(() => setAvailableBlockTypes(undefined));

function storeWithColumn() {
  const store = new DocumentStore();
  const { id } = store.create('Test');
  const { row, columnIds } = store.addRow(id);
  return { store, id, rowId: row.id, columnId: columnIds[0] };
}

describe('DocumentStore.addBlock honours block availability', () => {
  it('adds any block type when the host set no list', () => {
    const { store, id, rowId, columnId } = storeWithColumn();

    expect(() => store.addBlock(id, rowId, columnId, 'html')).not.toThrow();
  });

  it('refuses a block type the host left out', () => {
    // This store mutates the document directly instead of going through the
    // insertBlock command, so the rule has to hold here on its own — an agent
    // driving the editor over MCP is exactly the path a hidden palette misses.
    const { store, id, rowId, columnId } = storeWithColumn();
    setAvailableBlockTypes(['text']);

    expect(() => store.addBlock(id, rowId, columnId, 'html')).toThrow(/not available/i);
    expect(store.get(id).body.rows[0].columns[0].blocks).toHaveLength(0);
  });

  it('still adds an available type', () => {
    const { store, id, rowId, columnId } = storeWithColumn();
    setAvailableBlockTypes(['text']);

    store.addBlock(id, rowId, columnId, 'text');

    expect(store.get(id).body.rows[0].columns[0].blocks).toHaveLength(1);
  });
});
