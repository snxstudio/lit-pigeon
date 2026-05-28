import type { BrandKit, BrandKitStorage } from '../types/brand-kit.js';

export interface InMemoryBrandKitStorageOptions {
  /** Brand kits to seed the store with on construction. */
  seed?: BrandKit[];
}

/**
 * Default `BrandKitStorage` — `Map`-backed, per-process. Mirrors
 * `InMemoryTemplateStorage`: deep-clones on read so callers can't poison
 * the store by mutating returned objects.
 */
export class InMemoryBrandKitStorage implements BrandKitStorage {
  private readonly _byId = new Map<string, BrandKit>();

  constructor(opts: InMemoryBrandKitStorageOptions = {}) {
    if (opts.seed) {
      for (const k of opts.seed) this._byId.set(k.id, k);
    }
  }

  async list(): Promise<BrandKit[]> {
    return Array.from(this._byId.values()).map((k) => structuredClone(k));
  }

  async get(id: string): Promise<BrandKit | null> {
    const k = this._byId.get(id);
    return k ? structuredClone(k) : null;
  }

  async save(kit: BrandKit): Promise<void> {
    if (!kit.id) throw new Error('BrandKit.id is required');
    const clone = structuredClone(kit);
    clone.updatedAt = new Date().toISOString();
    if (!this._byId.has(clone.id)) clone.createdAt = clone.updatedAt;
    this._byId.set(clone.id, clone);
  }

  async delete(id: string): Promise<void> {
    this._byId.delete(id);
  }
}
