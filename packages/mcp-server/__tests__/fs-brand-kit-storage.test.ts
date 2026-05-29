import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FsBrandKitStorage } from '../src/store/fs-brand-kit-storage.js';

let dir: string;
let store: FsBrandKitStorage;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'lp-kits-'));
  store = new FsBrandKitStorage({ dir });
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function makeKit(id: string) {
  const now = new Date().toISOString();
  return {
    id,
    name: `Kit ${id}`,
    colors: [{ id: 'primary', name: 'Primary', value: '#000' }],
    fonts: [],
    logos: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('FsBrandKitStorage', () => {
  it('round-trips a kit through disk', async () => {
    await store.save(makeKit('acme'));
    const fetched = await store.get('acme');
    expect(fetched?.colors[0].value).toBe('#000');
  });

  it('list reads every JSON file', async () => {
    await store.save(makeKit('a'));
    await store.save(makeKit('b'));
    expect((await store.list()).map((k) => k.id).sort()).toEqual(['a', 'b']);
  });

  it('delete removes the file', async () => {
    await store.save(makeKit('x'));
    await store.delete('x');
    expect(await store.get('x')).toBeNull();
  });

  it('rejects unsafe ids', async () => {
    await expect(store.save(makeKit('../oops'))).rejects.toThrow(/Invalid brand-kit id/);
  });

  it('returns null for unsafe id on get', async () => {
    expect(await store.get('../oops')).toBeNull();
  });

  it('preserves createdAt on upsert', async () => {
    await store.save(makeKit('x'));
    const original = await store.get('x');
    await new Promise((r) => setTimeout(r, 5));
    await store.save({ ...original!, name: 'Renamed' });
    const next = await store.get('x');
    expect(next?.createdAt).toBe(original?.createdAt);
    expect(next?.updatedAt).not.toBe(original?.updatedAt);
  });
});
