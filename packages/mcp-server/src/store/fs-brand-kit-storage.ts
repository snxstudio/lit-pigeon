import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { BrandKit, BrandKitStorage } from '@lit-pigeon/core';

export interface FsBrandKitStorageOptions {
  /** Directory in which brand-kit JSON files live. Defaults to `~/.lit-pigeon/brand-kits`. */
  dir?: string;
}

const ID_RE = /^[a-z0-9][a-z0-9-]*$/i;

function assertSafeId(id: string): void {
  if (!ID_RE.test(id)) {
    throw new Error(
      `Invalid brand-kit id: ${JSON.stringify(id)}. Must match ${ID_RE}.`,
    );
  }
}

function isSafeId(id: string): boolean {
  return ID_RE.test(id);
}

function defaultDir(): string {
  return path.join(os.homedir(), '.lit-pigeon', 'brand-kits');
}

/**
 * Filesystem-backed `BrandKitStorage` — one JSON file per kit, mirrored
 * after `FsTemplateStorage`. Drop-in compatible with
 * `InMemoryBrandKitStorage` so the MCP server can persist saved kits across
 * restarts without touching the consumer code.
 */
export class FsBrandKitStorage implements BrandKitStorage {
  readonly dir: string;

  constructor(opts: FsBrandKitStorageOptions = {}) {
    this.dir = opts.dir ?? defaultDir();
  }

  private filePath(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private async readFile(id: string): Promise<BrandKit | null> {
    try {
      const raw = await fs.readFile(this.filePath(id), 'utf-8');
      return JSON.parse(raw) as BrandKit;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async list(): Promise<BrandKit[]> {
    await this.ensureDir();
    let entries: string[];
    try {
      entries = await fs.readdir(this.dir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: BrandKit[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      try {
        const raw = await fs.readFile(path.join(this.dir, entry), 'utf-8');
        out.push(JSON.parse(raw) as BrandKit);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[FsBrandKitStorage] Skipping unreadable file ${entry}:`,
          (err as Error).message,
        );
      }
    }
    out.sort((a, b) => Date.parse(b.updatedAt || '0') - Date.parse(a.updatedAt || '0'));
    return out;
  }

  async get(id: string): Promise<BrandKit | null> {
    if (!isSafeId(id)) return null;
    await this.ensureDir();
    return this.readFile(id);
  }

  async save(kit: BrandKit): Promise<void> {
    if (!kit.id) throw new Error('BrandKit.id is required');
    assertSafeId(kit.id);
    await this.ensureDir();
    const now = new Date().toISOString();
    const existing = await this.readFile(kit.id);
    const clone: BrandKit = {
      ...kit,
      createdAt: existing?.createdAt ?? kit.createdAt ?? now,
      updatedAt: now,
    };
    await fs.writeFile(this.filePath(kit.id), JSON.stringify(clone, null, 2), 'utf-8');
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
}
