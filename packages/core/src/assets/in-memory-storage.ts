import type {
  Asset,
  AssetListFilter,
  AssetStorage,
} from '../types/asset.js';

export interface InMemoryAssetStorageOptions {
  seed?: Asset[];
}

/**
 * Default `AssetStorage` — Map-backed, per-process. Search, folder filter,
 * and tag filter are all client-side; for very large libraries, back this
 * with an indexed storage (S3 + DynamoDB / Postgres / etc.).
 */
export class InMemoryAssetStorage implements AssetStorage {
  private readonly _byId = new Map<string, Asset>();

  constructor(opts: InMemoryAssetStorageOptions = {}) {
    if (opts.seed) {
      for (const a of opts.seed) this._byId.set(a.id, a);
    }
  }

  async list(filter: AssetListFilter = {}): Promise<Asset[]> {
    const all = Array.from(this._byId.values()).map((a) => structuredClone(a));
    let filtered = all.filter((asset) => matches(asset, filter));
    // Newest-first so recent uploads land at the top of a picker.
    filtered.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
    const offset = filter.offset ?? 0;
    const limit = filter.limit;
    filtered = filtered.slice(offset, limit !== undefined ? offset + limit : undefined);
    return filtered;
  }

  async get(id: string): Promise<Asset | null> {
    const a = this._byId.get(id);
    return a ? structuredClone(a) : null;
  }

  async save(asset: Asset): Promise<void> {
    if (!asset.id) throw new Error('Asset.id is required');
    if (!asset.src) throw new Error('Asset.src is required');
    const clone = structuredClone(asset);
    clone.updatedAt = new Date().toISOString();
    if (!this._byId.has(clone.id)) clone.createdAt = clone.updatedAt;
    if (!clone.folder) clone.folder = '/';
    this._byId.set(clone.id, clone);
  }

  async delete(id: string): Promise<void> {
    this._byId.delete(id);
  }

  async listFolders(): Promise<string[]> {
    const folders = new Set<string>();
    for (const a of this._byId.values()) folders.add(a.folder || '/');
    return Array.from(folders).sort();
  }
}

function matches(asset: Asset, filter: AssetListFilter): boolean {
  if (filter.folder) {
    const folder = asset.folder || '/';
    if (folder !== filter.folder) return false;
  }
  if (filter.tags && filter.tags.length > 0) {
    const tags = new Set(asset.tags ?? []);
    if (!filter.tags.every((t) => tags.has(t))) return false;
  }
  if (filter.search) {
    const needle = filter.search.toLowerCase();
    const haystack = [asset.name, asset.alt ?? '', ...(asset.tags ?? [])]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}
