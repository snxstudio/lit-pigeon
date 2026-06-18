import { describe, it, expect, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { createRow, createColumn, createBlock } from '@lit-pigeon/core';
import type { LibraryEntry } from '@lit-pigeon/core';
import { FsRowLibraryStorage } from '../src/store/fs-row-library-storage.js';

const dirs: string[] = [];
async function tmpDir(): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), 'rowlib-'));
  dirs.push(d);
  return d;
}
afterEach(async () => { for (const d of dirs.splice(0)) await fs.rm(d, { recursive: true, force: true }); });

function entry(id: string): LibraryEntry {
  return { id, name: id, kind: 'row', node: createRow([createColumn([createBlock('text')])]), createdAt: '', updatedAt: '' };
}

describe('FsRowLibraryStorage', () => {
  it('saves, lists, gets and deletes entries as JSON files', async () => {
    const dir = await tmpDir();
    const store = new FsRowLibraryStorage({ dir });
    await store.save(entry('hero'));
    expect(await store.list()).toHaveLength(1);
    expect((await store.get('hero'))!.name).toBe('hero');
    await store.delete('hero');
    expect(await store.get('hero')).toBeNull();
  });

  it('rejects unsafe ids on save and returns null on unsafe get', async () => {
    const dir = await tmpDir();
    const store = new FsRowLibraryStorage({ dir });
    await expect(store.save(entry('../escape'))).rejects.toThrow();
    expect(await store.get('../escape')).toBeNull();
  });

  it('preserves createdAt across updates and refreshes updatedAt', async () => {
    const dir = await tmpDir();
    const store = new FsRowLibraryStorage({ dir });
    await store.save(entry('hero'));
    const first = (await store.get('hero'))!;
    // save again with a different name
    await store.save({ ...entry('hero'), name: 'Renamed' });
    const second = (await store.get('hero'))!;
    expect(second.name).toBe('Renamed');
    expect(second.createdAt).toBe(first.createdAt); // preserved
    expect(Date.parse(second.updatedAt)).toBeGreaterThanOrEqual(Date.parse(first.updatedAt));
  });

  it('lists entries sorted by updatedAt descending', async () => {
    const dir = await tmpDir();
    const store = new FsRowLibraryStorage({ dir });
    await store.save(entry('old'));
    await new Promise((r) => setTimeout(r, 5));
    await store.save(entry('new'));
    const list = await store.list();
    expect(list.map((e) => e.id)).toEqual(['new', 'old']);
  });
});
