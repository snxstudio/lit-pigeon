/**
 * A managed image / file asset. Lives in an `AssetStorage` so editors and
 * AI tools can search, tag, and reuse it without re-uploading.
 */
export interface Asset {
  /** Stable, URL-safe slug — used as the storage key. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Public URL of the underlying file. */
  src: string;
  /** Accessibility alt text. Recommended for every image. */
  alt?: string;
  /** MIME type (e.g. `image/png`). */
  mimeType?: string;
  /** Total bytes. Useful for {@link AssetStorage.list} filtering. */
  sizeBytes?: number;
  /** Pixel width when known. */
  width?: number;
  /** Pixel height when known. */
  height?: number;
  /** Folder path (`/marketing/Q3`). Defaults to `/` (root). */
  folder?: string;
  /** Free-form tags for search + filtering. */
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/** Filters accepted by {@link AssetStorage.list}. */
export interface AssetListFilter {
  /** Restrict to a folder path. Pass `/` for the root or omit for all folders. */
  folder?: string;
  /** Free-text search over `name`, `alt`, and `tags`. Case-insensitive. */
  search?: string;
  /** Restrict to assets that match every tag in this list. */
  tags?: string[];
  /** Pagination: max items to return. Default unlimited. */
  limit?: number;
  /** Pagination: skip this many items. Default 0. */
  offset?: number;
}

/**
 * Pluggable persistence for image / file assets. Mirrors `TemplateStorage`
 * and `BrandKitStorage`. Listing returns assets newest-first so picker UIs
 * surface recent uploads at the top.
 */
export interface AssetStorage {
  list(filter?: AssetListFilter): Promise<Asset[]>;
  get(id: string): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  delete(id: string): Promise<void>;
  /** Distinct folder paths in use across the store. */
  listFolders(): Promise<string[]>;
}
