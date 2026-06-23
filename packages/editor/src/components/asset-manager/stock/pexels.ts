// packages/editor/src/components/asset-manager/stock/pexels.ts
import type { StockPhoto, StockProvider, StockSearchResult } from './types.js';
import { STOCK_PER_PAGE, StockError } from './types.js';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt: string | null;
  src: { tiny: string; medium: string; large: string; large2x: string; original: string };
}
interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  next_page?: string;
}

export function createPexelsProvider(apiKey: string): StockProvider {
  return {
    id: 'pexels',
    label: 'Pexels',
    async search(query: string, page: number): Promise<StockSearchResult> {
      const url =
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
        `&page=${page}&per_page=${STOCK_PER_PAGE}`;
      const res = await fetch(url, { headers: { Authorization: apiKey } });
      if (!res.ok) throw new StockError(res.status);
      const data = (await res.json()) as PexelsSearchResponse;
      const photos: StockPhoto[] = data.photos.map((p) => ({
        id: `pexels:${p.id}`,
        provider: 'pexels',
        thumbUrl: p.src.medium,
        fullUrl: p.src.large,
        width: p.width,
        height: p.height,
        alt: p.alt ?? '',
        photographerName: p.photographer,
        photographerUrl: p.photographer_url,
        providerUrl: p.url,
      }));
      return { photos, page, hasMore: Boolean(data.next_page) };
    },
    async trackDownload(): Promise<void> {
      // Pexels has no download-tracking endpoint.
    },
  };
}
