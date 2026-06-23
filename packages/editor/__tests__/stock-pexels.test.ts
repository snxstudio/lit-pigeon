// packages/editor/__tests__/stock-pexels.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPexelsProvider } from '../src/components/asset-manager/stock/pexels.js';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

const SAMPLE = {
  next_page: 'https://api.pexels.com/v1/search?page=3',
  photos: [
    {
      id: 123,
      width: 2000,
      height: 1500,
      url: 'https://www.pexels.com/photo/123/',
      photographer: 'Bo',
      photographer_url: 'https://www.pexels.com/@bo',
      alt: 'a dog',
      src: { tiny: 'ti.jpg', medium: 'm.jpg', large: 'l.jpg', large2x: 'l2.jpg', original: 'o.jpg' },
    },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe('pexels adapter', () => {
  it('searches the correct endpoint with bare-key auth and maps results', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SAMPLE));
    const provider = createPexelsProvider('PKEY');

    const result = await provider.search('dogs', 1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://api.pexels.com/v1/search?query=dogs&page=1&per_page=24');
    expect((init as RequestInit).headers).toEqual({ Authorization: 'PKEY' });

    const photo = result.photos[0];
    expect(photo.id).toBe('pexels:123');
    expect(photo.provider).toBe('pexels');
    expect(photo.thumbUrl).toBe('m.jpg');
    expect(photo.fullUrl).toBe('l.jpg');
    expect(photo.alt).toBe('a dog');
    expect(photo.photographerName).toBe('Bo');
    expect(photo.photographerUrl).toBe('https://www.pexels.com/@bo');
    expect(photo.providerUrl).toBe('https://www.pexels.com/photo/123/');
    expect(photo.downloadLocation).toBeUndefined();
    expect(result.hasMore).toBe(true); // next_page present
  });

  it('reports hasMore false when next_page is absent and empty alt → ""', async () => {
    const body = { photos: [{ ...SAMPLE.photos[0], alt: null }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(body));
    const provider = createPexelsProvider('PKEY');
    const result = await provider.search('x', 1);
    expect(result.photos[0].alt).toBe('');
    expect(result.hasMore).toBe(false);
  });

  it('throws StockError on non-OK, and trackDownload is a no-op', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 401));
    const provider = createPexelsProvider('PKEY');
    await expect(provider.search('x', 1)).rejects.toMatchObject({ status: 401 });
    await expect(provider.trackDownload({} as any)).resolves.toBeUndefined();
  });
});
