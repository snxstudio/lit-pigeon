import { describe, it, expect } from 'vitest';
import { InMemoryAssetStorage, type Asset } from '../src/index.js';

function makeAsset(id: string, overrides: Partial<Asset> = {}): Asset {
  const now = new Date().toISOString();
  return {
    id,
    name: id,
    src: `https://cdn/${id}.png`,
    folder: '/',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('InMemoryAssetStorage', () => {
  it('save → list returns the asset', async () => {
    const store = new InMemoryAssetStorage();
    await store.save(makeAsset('logo'));
    const list = await store.list();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('logo');
  });

  it('list sorts newest-first', async () => {
    // Seed with distinct timestamps to verify the sort. `save()` would bump
    // both updatedAt fields to "now" and could collide on the same ms.
    const store = new InMemoryAssetStorage({
      seed: [
        makeAsset('older', { updatedAt: '2026-01-01T00:00:00Z' }),
        makeAsset('newer', { updatedAt: '2026-06-01T00:00:00Z' }),
      ],
    });
    expect((await store.list()).map((a) => a.id)).toEqual(['newer', 'older']);
  });

  it('folder filter restricts to that folder', async () => {
    const store = new InMemoryAssetStorage();
    await store.save(makeAsset('a', { folder: '/marketing' }));
    await store.save(makeAsset('b', { folder: '/legal' }));
    const list = await store.list({ folder: '/marketing' });
    expect(list.map((a) => a.id)).toEqual(['a']);
  });

  it('search matches name, alt, and tags case-insensitively', async () => {
    const store = new InMemoryAssetStorage();
    await store.save(makeAsset('logo-light', { name: 'Brand Logo Light', tags: ['logo', 'header'] }));
    await store.save(makeAsset('footer-img', { name: 'Footer Image', alt: 'Brand outro' }));
    expect((await store.list({ search: 'brand' })).map((a) => a.id).sort()).toEqual(['footer-img', 'logo-light']);
    expect((await store.list({ search: 'header' })).map((a) => a.id)).toEqual(['logo-light']);
    expect((await store.list({ search: 'OUTRO' })).map((a) => a.id)).toEqual(['footer-img']);
  });

  it('tag filter requires every supplied tag', async () => {
    const store = new InMemoryAssetStorage();
    await store.save(makeAsset('a', { tags: ['hero', 'q3'] }));
    await store.save(makeAsset('b', { tags: ['hero'] }));
    expect((await store.list({ tags: ['hero', 'q3'] })).map((a) => a.id)).toEqual(['a']);
  });

  it('listFolders dedupes + sorts', async () => {
    const store = new InMemoryAssetStorage();
    await store.save(makeAsset('a', { folder: '/marketing' }));
    await store.save(makeAsset('b', { folder: '/legal' }));
    await store.save(makeAsset('c', { folder: '/marketing' }));
    expect(await store.listFolders()).toEqual(['/legal', '/marketing']);
  });

  it('paginates via offset + limit', async () => {
    const store = new InMemoryAssetStorage();
    for (let i = 0; i < 5; i++) await store.save(makeAsset(`a${i}`));
    const page = await store.list({ offset: 1, limit: 2 });
    expect(page).toHaveLength(2);
  });

  it('requires id + src on save', async () => {
    const store = new InMemoryAssetStorage();
    await expect(store.save(makeAsset('', { src: 'https://x' }))).rejects.toThrow(/id/i);
    await expect(store.save(makeAsset('x', { src: '' }))).rejects.toThrow(/src/i);
  });

  it('delete removes the asset', async () => {
    const store = new InMemoryAssetStorage({ seed: [makeAsset('a')] });
    await store.delete('a');
    expect(await store.get('a')).toBeNull();
  });
});
