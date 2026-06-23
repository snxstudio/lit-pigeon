// packages/editor/src/components/asset-manager/stock/unsplash.ts
import type { StockPhoto, StockProvider, StockSearchResult } from './types.js';
import { STOCK_PER_PAGE, StockError } from './types.js';

interface UnsplashResult {
  id: string;
  alt_description: string | null;
  description: string | null;
  width: number;
  height: number;
  urls: { thumb: string; small: string; regular: string; full: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}
interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashResult[];
}

export function createUnsplashProvider(accessKey: string, appName: string): StockProvider {
  const auth = { Authorization: `Client-ID ${accessKey}` };
  const utm = `utm_source=${encodeURIComponent(appName)}&utm_medium=referral`;
  const withUtm = (url: string) => url + (url.includes('?') ? '&' : '?') + utm;

  return {
    id: 'unsplash',
    label: 'Unsplash',
    async search(query: string, page: number): Promise<StockSearchResult> {
      const url =
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
        `&page=${page}&per_page=${STOCK_PER_PAGE}`;
      const res = await fetch(url, { headers: auth });
      if (!res.ok) throw new StockError(res.status);
      const data = (await res.json()) as UnsplashSearchResponse;
      const photos: StockPhoto[] = data.results.map((r) => ({
        id: `unsplash:${r.id}`,
        provider: 'unsplash',
        thumbUrl: r.urls.small,
        fullUrl: r.urls.regular,
        width: r.width,
        height: r.height,
        alt: r.alt_description ?? r.description ?? '',
        photographerName: r.user.name,
        photographerUrl: withUtm(r.user.links.html),
        providerUrl: withUtm(r.links.html),
        downloadLocation: r.links.download_location,
      }));
      return { photos, page, hasMore: page < data.total_pages };
    },
    async trackDownload(photo: StockPhoto): Promise<void> {
      if (!photo.downloadLocation) return;
      try {
        await fetch(photo.downloadLocation, { headers: auth });
      } catch {
        // Best-effort ping; failure must never block insertion.
      }
    },
  };
}
