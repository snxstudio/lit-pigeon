import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { Asset, AssetListFilter, AssetStorage } from '@lit-pigeon/core';

export interface FsAssetStorageOptions {
  /** Directory in which asset metadata JSON files live. Defaults to `~/.lit-pigeon/assets`. */
  dir?: string;
}

const ID_RE = /^[a-z0-9][a-z0-9-]*$/i;

function assertSafeId(id: string): void {
  if (!ID_RE.test(id)) {
    throw new Error(
      `Invalid asset id: ${JSON.stringify(id)}. Must match ${ID_RE}.`,
    );
  }
}

function isSafeId(id: string): boolean {
  return ID_RE.test(id);
}

function defaultDir(): string {
  return path.join(os.homedir(), '.lit-pigeon', 'assets');
}

/**
 * Filesystem-backed `AssetStorage` — one JSON metadata file per asset.
 * The asset *file* lives wherever `Asset.src` points (S3, CDN, file://);
 * this storage layer only manages the catalog metadata so any upload
 * pipeline can plug in.
 */
export class FsAssetStorage implements AssetStorage {
  readonly dir: string;

  constructor(opts: FsAssetStorageOptions = {}) {
    this.dir = opts.dir ?? defaultDir();
  }

  private filePath(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private async readFile(id: string): Promise<Asset | null> {
    try {
      const raw = await fs.readFile(this.filePath(id), 'utf-8');
      return JSON.parse(raw) as Asset;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  private async readAll(): Promise<Asset[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.dir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: Asset[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(this.dir, entry), 'utf-8');
        out.push(JSON.parse(raw) as Asset);
      } catch (err) {
        console.error(
          `[FsAssetStorage] Skipping unreadable file ${entry}:`,
          (err as Error).message,
        );
      }
    }
    return out;
  }

  async list(filter: AssetListFilter = {}): Promise<Asset[]> {
    await this.ensureDir();
    const all = await this.readAll();
    let filtered = all.filter((a) => matches(a, filter));
    filtered.sort((a, b) => Date.parse(b.updatedAt || '0') - Date.parse(a.updatedAt || '0'));
    const offset = filter.offset ?? 0;
    const limit = filter.limit;
    filtered = filtered.slice(offset, limit !== undefined ? offset + limit : undefined);
    return filtered;
  }

  async get(id: string): Promise<Asset | null> {
    if (!isSafeId(id)) return null;
    await this.ensureDir();
    return this.readFile(id);
  }

  async save(asset: Asset): Promise<void> {
    if (!asset.id) throw new Error('Asset.id is required');
    if (!asset.src) throw new Error('Asset.src is required');
    assertSafeId(asset.id);
    await this.ensureDir();
    const now = new Date().toISOString();
    const existing = await this.readFile(asset.id);
    const clone: Asset = {
      ...asset,
      folder: asset.folder || '/',
      createdAt: existing?.createdAt ?? asset.createdAt ?? now,
      updatedAt: now,
    };
    await fs.writeFile(this.filePath(asset.id), JSON.stringify(clone, null, 2), 'utf-8');
  }

  async delete(id: string): Promise<void> {
    if (!isSafeId(id)) return;
    await this.ensureDir();
    try {
      await fs.unlink(this.filePath(id));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw err;
    }
  }

  async listFolders(): Promise<string[]> {
    await this.ensureDir();
    const folders = new Set<string>();
    for (const a of await this.readAll()) folders.add(a.folder || '/');
    return Array.from(folders).sort();
  }
}

function matches(asset: Asset, filter: AssetListFilter): boolean {
  if (filter.folder && (asset.folder || '/') !== filter.folder) return false;
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
