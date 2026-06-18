import type { LibraryEntry, RowLibraryStorage } from '../types/row-library.js';

export interface InMemoryRowLibraryStorageOptions {
  /** Entries to seed the store with on construction. */
  seed?: LibraryEntry[];
}

/**
 * Default `RowLibraryStorage` — `Map`-backed, per-process. Mirrors
 * `InMemoryTemplateStorage`: deep-clones on read so callers can't poison the
 * store by mutating returned objects.
 */
export class InMemoryRowLibraryStorage implements RowLibraryStorage {
  private readonly _byId = new Map<string, LibraryEntry>();

  constructor(opts: InMemoryRowLibraryStorageOptions = {}) {
    if (opts.seed) {
      for (const e of opts.seed) this._byId.set(e.id, e);
    }
  }

  async list(): Promise<LibraryEntry[]> {
    return Array.from(this._byId.values()).map((e) => structuredClone(e));
  }

  async get(id: string): Promise<LibraryEntry | null> {
    const e = this._byId.get(id);
    return e ? structuredClone(e) : null;
  }

  async save(entry: LibraryEntry): Promise<void> {
    if (!entry.id) throw new Error('LibraryEntry.id is required');
    const clone = structuredClone(entry);
    clone.updatedAt = new Date().toISOString();
    if (!this._byId.has(clone.id)) clone.createdAt = clone.updatedAt;
    this._byId.set(clone.id, clone);
  }

  async delete(id: string): Promise<void> {
    this._byId.delete(id);
  }
}
