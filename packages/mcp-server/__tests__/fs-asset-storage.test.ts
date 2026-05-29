import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FsAssetStorage } from '../src/store/fs-asset-storage.js';

let dir: string;
let store: FsAssetStorage;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'lp-assets-'));
  store = new FsAssetStorage({ dir });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function make(id: string, overrides: Partial<{ folder: string; tags: string[]; name: string; alt: string }> = {}) {
  const now = new Date().toISOString();
  return {
    id,
    name: overrides.name ?? id,
    src: `https://cdn/${id}.png`,
    alt: overrides.alt,
    folder: overrides.folder ?? '/',
    tags: overrides.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('FsAssetStorage', () => {
  it('save → list round-trips through disk', async () => {
    await store.save(make('logo'));
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('logo');
  });

  it('list filters by folder', async () => {
    await store.save(make('a', { folder: '/m' }));
    await store.save(make('b', { folder: '/n' }));
    expect((await store.list({ folder: '/m' })).map((a) => a.id)).toEqual(['a']);
  });

  it('list filters by tag', async () => {
    await store.save(make('a', { tags: ['hero', 'q3'] }));
    await store.save(make('b', { tags: ['hero'] }));
    expect((await store.list({ tags: ['q3'] })).map((a) => a.id)).toEqual(['a']);
  });

  it('list filters by search', async () => {
    await store.save(make('a', { name: 'Brand Header' }));
    await store.save(make('b', { name: 'Footer Image', alt: 'Brand outro' }));
    expect((await store.list({ search: 'brand' })).map((a) => a.id).sort()).toEqual(['a', 'b']);
  });

  it('listFolders returns distinct folders', async () => {
    await store.save(make('a', { folder: '/m' }));
    await store.save(make('b', { folder: '/n' }));
    expect((await store.listFolders()).sort()).toEqual(['/m', '/n']);
  });

  it('rejects unsafe ids on save', async () => {
    await expect(store.save(make('../oops'))).rejects.toThrow(/Invalid asset id/);
  });

  it('requires src', async () => {
    await expect(store.save({ ...make('x'), src: '' })).rejects.toThrow(/src is required/);
  });
});
