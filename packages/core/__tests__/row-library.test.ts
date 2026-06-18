import { describe, it, expect } from 'vitest';
import {
  InMemoryRowLibraryStorage,
  cloneRowWithNewIds,
  createRow,
  createColumn,
  createBlock,
} from '../src/index.js';
import type { LibraryEntry, RowNode } from '../src/index.js';

function sampleRow(): RowNode {
  const block = createBlock('text');
  return createRow([createColumn([block])]);
}

describe('InMemoryRowLibraryStorage', () => {
  it('saves, lists, gets and deletes entries (deep-cloned on read)', async () => {
    const store = new InMemoryRowLibraryStorage();
    const entry: LibraryEntry = {
      id: 'hero', name: 'Hero', kind: 'row', node: sampleRow(),
      createdAt: '', updatedAt: '',
    };
    await store.save(entry);
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Hero');
    list[0].name = 'Mutated';
    expect((await store.get('hero'))!.name).toBe('Hero');
    await store.delete('hero');
    expect(await store.list()).toHaveLength(0);
  });
});

describe('cloneRowWithNewIds', () => {
  it('assigns fresh ids to the row, columns, and blocks', () => {
    const row = sampleRow();
    const clone = cloneRowWithNewIds(row);
    expect(clone.id).not.toBe(row.id);
    expect(clone.columns[0].id).not.toBe(row.columns[0].id);
    expect(clone.columns[0].blocks[0].id).not.toBe(row.columns[0].blocks[0].id);
    expect(clone.columns[0].blocks[0].type).toBe(row.columns[0].blocks[0].type);
  });
});
