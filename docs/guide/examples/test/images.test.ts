import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@lit-pigeon/editor';
import type { PigeonAssetManager } from '@lit-pigeon/editor';
import { InMemoryAssetStorage, type AssetManagerConfig } from '@lit-pigeon/core';
import { createAssetManagerConfig } from '../src/images/upload-handler.js';
import { presignedPostConfig, presignedPutConfig } from '../src/images/presigned.js';
import { uploadUrlConfig } from '../src/images/upload-url.js';
import { HttpAssetStorage, uploadIntoLibrary } from '../src/images/http-asset-storage.js';
import { tick } from './helpers.js';

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];

function mockFetch(respond: (url: string, init: RequestInit) => unknown) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const body = respond(url, init);
    return new Response(body === undefined ? null : JSON.stringify(body), { status: body === undefined ? 204 : 200 });
  });
}

const png = () => new File([new Uint8Array(10)], 'logo.png', { type: 'image/png' });

async function uploadThrough(config: AssetManagerConfig, file: File): Promise<{ url?: string; error: string }> {
  const el = document.createElement('pigeon-asset-manager') as PigeonAssetManager;
  el.config = config;
  el.open = true;
  document.body.appendChild(el);
  await el.updateComplete;
  let url: string | undefined;
  el.addEventListener('asset-selected', (e) => (url = (e as CustomEvent<{ url: string }>).detail.url));
  const input = el.shadowRoot!.querySelector('#file-input') as HTMLInputElement;
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  input.dispatchEvent(new Event('change'));
  await tick(20);
  await el.updateComplete;
  const error = el.shadowRoot!.textContent ?? '';
  el.remove();
  return { url, error };
}

beforeEach(() => {
  calls = [];
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('images: uploadHandler', () => {
  it('sends the current token with every upload and stores the returned URL', async () => {
    mockFetch(() => ({ url: 'https://cdn.example.com/logo.png' }));
    let token = 'first';
    const config = createAssetManagerConfig(() => token);
    expect((await uploadThrough(config, png())).url).toBe('https://cdn.example.com/logo.png');
    token = 'refreshed';
    await uploadThrough(config, png());
    expect(calls.map((c) => (c.init.headers as Record<string, string>).Authorization)).toEqual(['Bearer first', 'Bearer refreshed']);
    expect((calls[0].init.body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('wins over the other adapters and shows thrown errors', async () => {
    mockFetch(() => undefined);
    const config: AssetManagerConfig = {
      ...createAssetManagerConfig(() => 't'),
      uploadUrl: '/never',
    };
    vi.stubGlobal('fetch', async (url: string) => {
      calls.push({ url, init: {} });
      return new Response(null, { status: 500 });
    });
    const { url, error } = await uploadThrough(config, png());
    expect(url).toBeUndefined();
    expect(calls.map((c) => c.url)).toEqual(['/api/email-assets']);
    expect(error).toContain('Upload failed (500)');
  });

  it('rejects files over maxFileSize or outside acceptedTypes before uploading', async () => {
    mockFetch(() => ({ url: 'x' }));
    const config = createAssetManagerConfig(() => 't');
    const big = new File([new Uint8Array(3 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    expect((await uploadThrough(config, big)).error).toContain('File too large. Maximum size: 2.0MB');
    const svg = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    expect((await uploadThrough(config, svg)).error).toContain('File type not accepted: image/svg+xml');
    expect(calls).toEqual([]);
  });

  it('falls back to a data: URL when no adapter is configured', async () => {
    const { url } = await uploadThrough({}, png());
    expect(url).toMatch(/^data:image\/png;base64,/);
  });
});

describe('images: presigned uploads', () => {
  it('PUTs the file with its Content-Type and stores publicUrl', async () => {
    mockFetch((url) => (url === '/api/email-assets/sign' ? { uploadUrl: 'https://bucket.example.com/k?sig=1', publicUrl: 'https://cdn.example.com/k' } : undefined));
    const { url } = await uploadThrough(presignedPutConfig(() => 't'), png());
    expect(url).toBe('https://cdn.example.com/k');
    const put = calls[1];
    expect(put.url).toBe('https://bucket.example.com/k?sig=1');
    expect(put.init.method).toBe('PUT');
    expect((put.init.headers as Record<string, string>)['Content-Type']).toBe('image/png');
    expect(put.init.body).toBeInstanceOf(File);
  });

  it('POSTs the signed fields followed by the file', async () => {
    mockFetch((url) => (url === '/api/email-assets/sign-post' ? { url: 'https://bucket.example.com/', fields: { key: 'k', policy: 'p' }, publicUrl: 'https://cdn.example.com/k' } : undefined));
    const { url } = await uploadThrough(presignedPostConfig(() => 't'), png());
    expect(url).toBe('https://cdn.example.com/k');
    const form = calls[1].init.body as FormData;
    expect([...form.keys()]).toEqual(['key', 'policy', 'file']);
    expect(calls[1].init.method).toBe('POST');
  });
});

describe('images: uploadUrl', () => {
  it('POSTs multipart with the fixed headers and reads url from the response', async () => {
    mockFetch(() => ({ location: 'https://cdn.example.com/l.png' }));
    const { url } = await uploadThrough(uploadUrlConfig('abc'), png());
    expect(url).toBe('https://cdn.example.com/l.png');
    expect(calls[0].init.headers).toEqual({ Authorization: 'Bearer abc' });
  });
});

describe('images: asset storage', () => {
  it('lists with the filter as query parameters', async () => {
    mockFetch(() => []);
    await new HttpAssetStorage('/api/assets', () => 't').list({ folder: '/brand', tags: ['logo', 'dark'], limit: 20 });
    expect(calls[0].url).toBe('/api/assets?folder=%2Fbrand&tags=logo&tags=dark&limit=20');
  });

  it('records uploads in the library', async () => {
    const storage = new InMemoryAssetStorage();
    const config = uploadIntoLibrary(storage, async () => 'https://cdn.example.com/a.png');
    await uploadThrough(config, png());
    const [asset] = await storage.list();
    expect(asset).toMatchObject({ name: 'logo.png', src: 'https://cdn.example.com/a.png', mimeType: 'image/png' });
  });
});
