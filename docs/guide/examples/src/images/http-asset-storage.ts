import type { Asset, AssetListFilter, AssetManagerConfig, AssetStorage } from '@lit-pigeon/core';
import type { TokenGetter } from './upload-handler.js';

/** An AssetStorage backed by your own API, so the Library tab lists the user's images. */
export class HttpAssetStorage implements AssetStorage {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: TokenGetter,
  ) {}

  async list(filter: AssetListFilter = {}): Promise<Asset[]> {
    const query = new URLSearchParams();
    if (filter.folder) query.set('folder', filter.folder);
    if (filter.search) query.set('search', filter.search);
    for (const tag of filter.tags ?? []) query.append('tags', tag);
    if (filter.limit !== undefined) query.set('limit', String(filter.limit));
    if (filter.offset !== undefined) query.set('offset', String(filter.offset));
    return this.request<Asset[]>(`?${query}`);
  }

  async get(id: string): Promise<Asset | null> {
    return this.request<Asset | null>(`/${encodeURIComponent(id)}`).catch(() => null);
  }

  async save(asset: Asset): Promise<void> {
    await this.request(`/${encodeURIComponent(asset.id)}`, { method: 'PUT', body: JSON.stringify(asset) });
  }

  async delete(id: string): Promise<void> {
    await this.request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async listFolders(): Promise<string[]> {
    return this.request<string[]>('/folders');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${await this.getToken()}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }
}

// #region upload-into-library
/** Uploads are not added to the library automatically; record them yourself. */
export function uploadIntoLibrary(
  storage: AssetStorage,
  upload: (file: File) => Promise<string>,
): AssetManagerConfig {
  return {
    uploadHandler: async (file) => {
      const src = await upload(file);
      const now = new Date().toISOString();
      await storage.save({
        id: crypto.randomUUID(),
        name: file.name,
        src,
        mimeType: file.type,
        sizeBytes: file.size,
        folder: '/',
        createdAt: now,
        updatedAt: now,
      });
      return src;
    },
  };
}
// #endregion upload-into-library
