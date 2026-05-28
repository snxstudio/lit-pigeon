import { describe, it, expect } from 'vitest';
import { InMemoryBrandKitStorage, type BrandKit } from '../src/index.js';

function makeKit(id: string, overrides: Partial<BrandKit> = {}): BrandKit {
  const now = new Date().toISOString();
  return {
    id,
    name: `Kit ${id}`,
    colors: [{ id: 'primary', name: 'Primary', value: '#3b82f6' }],
    fonts: [{ id: 'sans', name: 'Sans', family: 'Inter, sans-serif', weights: [400, 600] }],
    logos: [{ id: 'main', name: 'Main', src: 'https://x/logo.png', width: 160 }],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('InMemoryBrandKitStorage', () => {
  it('round-trips a kit through save/list/get', async () => {
    const store = new InMemoryBrandKitStorage();
    await store.save(makeKit('acme'));
    expect((await store.list()).map((k) => k.id)).toEqual(['acme']);
    const fetched = await store.get('acme');
    expect(fetched?.colors[0].value).toBe('#3b82f6');
  });

  it('deep-clones on read so mutations do not poison the store', async () => {
    const store = new InMemoryBrandKitStorage();
    await store.save(makeKit('acme'));
    const a = await store.get('acme');
    a!.colors[0].value = '#000000';
    const b = await store.get('acme');
    expect(b?.colors[0].value).toBe('#3b82f6');
  });

  it('save bumps updatedAt and sets createdAt on first write', async () => {
    const store = new InMemoryBrandKitStorage();
    const kit = makeKit('acme', { createdAt: '', updatedAt: '' });
    await store.save(kit);
    const fetched = await store.get('acme');
    expect(fetched?.createdAt).toBeTruthy();
    expect(fetched?.updatedAt).toBeTruthy();
  });

  it('delete removes the kit', async () => {
    const store = new InMemoryBrandKitStorage({ seed: [makeKit('a')] });
    await store.delete('a');
    expect(await store.get('a')).toBeNull();
  });

  it('rejects a save with empty id', async () => {
    const store = new InMemoryBrandKitStorage();
    await expect(store.save(makeKit(''))).rejects.toThrow(/id is required/i);
  });
});
