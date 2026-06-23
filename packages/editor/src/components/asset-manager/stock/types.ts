export const STOCK_PER_PAGE = 24;

export type StockProviderId = 'unsplash' | 'pexels';

export interface StockPhoto {
  /** Namespaced id, e.g. "unsplash:abc123". */
  id: string;
  provider: StockProviderId;
  /** Small image URL for the result grid. */
  thumbUrl: string;
  /** Hotlinked URL inserted into the email. */
  fullUrl: string;
  width: number;
  height: number;
  /** Description / alt from the provider (may be empty). */
  alt: string;
  photographerName: string;
  /** UTM-tagged where the provider requires it. */
  photographerUrl: string;
  /** Link to the photo on the provider site (UTM-tagged for Unsplash). */
  providerUrl: string;
  /** Unsplash only: links.download_location, used by trackDownload. */
  downloadLocation?: string;
}

export interface StockSearchResult {
  photos: StockPhoto[];
  page: number;
  hasMore: boolean;
}

export interface StockProvider {
  readonly id: StockProviderId;
  readonly label: string;
  search(query: string, page: number): Promise<StockSearchResult>;
  /** Unsplash: GET download_location. Pexels: resolved no-op. */
  trackDownload(photo: StockPhoto): Promise<void>;
}

/** Thrown by adapters on a non-OK HTTP response; carries the status code. */
export class StockError extends Error {
  constructor(public readonly status: number) {
    super(`Stock request failed: ${status}`);
    this.name = 'StockError';
  }
}
