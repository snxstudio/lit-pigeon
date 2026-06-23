// packages/editor/__tests__/stock-unsplash.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createUnsplashProvider } from '../src/components/asset-manager/stock/unsplash.js';
import { StockError } from '../src/components/asset-manager/stock/types.js';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

const SAMPLE = {
  total: 100,
  total_pages: 5,
  results: [
    {
      id: 'abc',
      alt_description: 'a cat',
      description: null,
      width: 4000,
      height: 3000,
      urls: { thumb: 't.jpg', small: 's.jpg', regular: 'r.jpg', full: 'f.jpg' },
      links: { html: 'https://unsplash.com/photos/abc', download_location: 'https://api.unsplash.com/photos/abc/download' },
      user: { name: 'Ada', links: { html: 'https://unsplash.com/@ada' } },
    },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe('unsplash adapter', () => {
  it('searches the correct endpoint with Client-ID auth and maps results', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SAMPLE));
    const provider = createUnsplashProvider('KEY', 'acme');

    const result = await provider.search('cats', 2);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://api.unsplash.com/search/photos?query=cats&page=2&per_page=24');
    expect((init as RequestInit).headers).toEqual({ Authorization: 'Client-ID KEY' });

    const photo = result.photos[0];
    expect(photo.id).toBe('unsplash:abc');
    expect(photo.provider).toBe('unsplash');
    expect(photo.thumbUrl).toBe('s.jpg');
    expect(photo.fullUrl).toBe('r.jpg');
    expect(photo.alt).toBe('a cat');
    expect(photo.photographerName).toBe('Ada');
    expect(photo.photographerUrl).toBe('https://unsplash.com/@ada?utm_source=acme&utm_medium=referral');
    expect(photo.providerUrl).toBe('https://unsplash.com/photos/abc?utm_source=acme&utm_medium=referral');
    expect(photo.downloadLocation).toBe('https://api.unsplash.com/photos/abc/download');
    expect(result.hasMore).toBe(true); // page 2 < total_pages 5
  });

  it('falls back to description for alt and reports hasMore false on the last page', async () => {
    const body = { total: 1, total_pages: 5, results: [{ ...SAMPLE.results[0], alt_description: null, description: 'desc' }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(body));
    const provider = createUnsplashProvider('KEY', 'acme');
    const result = await provider.search('x', 5);
    expect(result.photos[0].alt).toBe('desc');
    expect(result.hasMore).toBe(false);
  });

  it('throws StockError with the status on a non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 429));
    const provider = createUnsplashProvider('KEY', 'acme');
    await expect(provider.search('x', 1)).rejects.toMatchObject({ status: 429 });
    await expect(provider.search('x', 1)).rejects.toBeInstanceOf(StockError);
  });

  it('trackDownload GETs the download_location with auth, swallowing errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));
    const provider = createUnsplashProvider('KEY', 'acme');
    await provider.trackDownload({
      id: 'unsplash:abc', provider: 'unsplash', thumbUrl: '', fullUrl: '', width: 0, height: 0,
      alt: '', photographerName: '', photographerUrl: '', providerUrl: '',
      downloadLocation: 'https://api.unsplash.com/photos/abc/download',
    });
    expect(String(fetchSpy.mock.calls[0][0])).toBe('https://api.unsplash.com/photos/abc/download');
    expect((fetchSpy.mock.calls[0][1] as RequestInit).headers).toEqual({ Authorization: 'Client-ID KEY' });

    fetchSpy.mockRejectedValueOnce(new Error('network'));
    await expect(provider.trackDownload({ ...({} as any), downloadLocation: 'x' })).resolves.toBeUndefined();
  });
});
