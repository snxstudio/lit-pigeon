import { describe, it, expect } from 'vitest';
import {
  InMemoryAssetStorage,
  InMemoryBrandKitStorage,
  type Asset,
  type BrandKit,
} from '@lit-pigeon/core';
import { handleRequest, type RouteContext } from '../src/route.js';

function makeKit(id: string): BrandKit {
  const now = new Date().toISOString();
  return {
    id,
    name: id,
    colors: [{ id: 'primary', name: 'Primary', value: '#3b82f6' }],
    fonts: [],
    logos: [],
    createdAt: now,
    updatedAt: now,
  };
}

function makeAsset(id: string, folder = '/'): Asset {
  const now = new Date().toISOString();
  return {
    id,
    name: id,
    src: `https://cdn/${id}.png`,
    folder,
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('brand-kit routes', () => {
  it('returns 503 when no storage is configured', async () => {
    const res = await handleRequest({ method: 'GET', path: '/brand-kits', body: null });
    expect(res.status).toBe(503);
  });

  it('lists kits when storage is configured', async () => {
    const brandKitStorage = new InMemoryBrandKitStorage({ seed: [makeKit('acme')] });
    const ctx: RouteContext = { brandKitStorage };
    const res = await handleRequest({ method: 'GET', path: '/brand-kits', body: null }, ctx);
    expect(res.status).toBe(200);
    const body = res.body as { brandKits: BrandKit[] };
    expect(body.brandKits).toHaveLength(1);
  });

  it('upserts via POST then deletes via DELETE', async () => {
    const brandKitStorage = new InMemoryBrandKitStorage();
    const ctx: RouteContext = { brandKitStorage };
    const saveRes = await handleRequest(
      { method: 'POST', path: '/brand-kits', body: { brandKit: makeKit('a') } },
      ctx,
    );
    expect(saveRes.status).toBe(200);
    expect((await brandKitStorage.list()).map((k) => k.id)).toEqual(['a']);

    const delRes = await handleRequest({ method: 'DELETE', path: '/brand-kits/a', body: null }, ctx);
    expect(delRes.status).toBe(200);
    expect(await brandKitStorage.get('a')).toBeNull();
  });

  it('returns 404 for an unknown kit', async () => {
    const brandKitStorage = new InMemoryBrandKitStorage();
    const res = await handleRequest({ method: 'GET', path: '/brand-kits/nope', body: null }, { brandKitStorage });
    expect(res.status).toBe(404);
  });
});

describe('asset routes', () => {
  it('returns 503 when storage is unconfigured', async () => {
    const res = await handleRequest({ method: 'GET', path: '/assets', body: null });
    expect(res.status).toBe(503);
  });

  it('lists assets with folder + tag + search filters via query string', async () => {
    const assetStorage = new InMemoryAssetStorage();
    await assetStorage.save({ ...makeAsset('a', '/m'), tags: ['hero'] });
    await assetStorage.save({ ...makeAsset('b', '/m'), tags: ['footer'] });
    await assetStorage.save(makeAsset('c', '/n'));
    const ctx: RouteContext = { assetStorage };

    const res = await handleRequest(
      { method: 'GET', path: '/assets', body: null, query: { folder: '/m', tags: ['hero'] } },
      ctx,
    );
    expect(res.status).toBe(200);
    expect((res.body as { assets: Asset[] }).assets.map((a) => a.id)).toEqual(['a']);
  });

  it('upserts via POST and serves via GET /assets/:id', async () => {
    const assetStorage = new InMemoryAssetStorage();
    const ctx: RouteContext = { assetStorage };
    await handleRequest(
      { method: 'POST', path: '/assets', body: { asset: makeAsset('logo') } },
      ctx,
    );
    const res = await handleRequest({ method: 'GET', path: '/assets/logo', body: null }, ctx);
    expect(res.status).toBe(200);
    expect((res.body as { asset: Asset }).asset.id).toBe('logo');
  });

  it('lists folders', async () => {
    const assetStorage = new InMemoryAssetStorage({
      seed: [makeAsset('a', '/m'), makeAsset('b', '/n')],
    });
    const res = await handleRequest({ method: 'GET', path: '/asset-folders', body: null }, { assetStorage });
    expect(res.status).toBe(200);
    expect((res.body as { folders: string[] }).folders.sort()).toEqual(['/m', '/n']);
  });
});
