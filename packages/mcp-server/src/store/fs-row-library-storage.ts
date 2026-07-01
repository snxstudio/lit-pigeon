import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type { LibraryEntry, RowLibraryStorage } from '@lit-pigeon/core';

export interface FsRowLibraryStorageOptions {
  /** Directory for entry JSON files. Defaults to `~/.lit-pigeon/row-library`. */
  dir?: string;
}

/** Allowed shape for entry ids — safe to use as a filename. */
const ID_RE = /^[a-z0-9][a-z0-9-]*$/i;

function assertSafeId(id: string): void {
  if (!ID_RE.test(id)) {
    throw new Error(
      `Invalid library entry id: ${JSON.stringify(id)}. Must match ${ID_RE} (alphanumeric + hyphens, no slashes, no dotfiles).`,
    );
  }
}
function isSafeId(id: string): boolean {
  return ID_RE.test(id);
}
function defaultDir(): string {
  return path.join(os.homedir(), '.lit-pigeon', 'row-library');
}

/**
 * Filesystem-backed `RowLibraryStorage` — one JSON file per entry under a
 * configurable directory (default `~/.lit-pigeon/row-library`). Drop-in
 * compatible with `InMemoryRowLibraryStorage`.
 */
export class FsRowLibraryStorage implements RowLibraryStorage {
  readonly dir: string;
  private ready: Promise<void> | null = null;

  constructor(opts: FsRowLibraryStorageOptions = {}) {
    this.dir = opts.dir ?? defaultDir();
  }

  private async ensureDir(): Promise<void> {
    if (!this.ready) this.ready = fs.mkdir(this.dir, { recursive: true }).then(() => undefined);
    return this.ready;
  }

  private filePath(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }

  async list(): Promise<LibraryEntry[]> {
    await this.ensureDir();
    let entries: string[];
    try {
      entries = await fs.readdir(this.dir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw err;
    }
    const out: LibraryEntry[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const full = path.join(this.dir, entry);
      try {
        out.push(JSON.parse(await fs.readFile(full, 'utf-8')) as LibraryEntry);
      } catch (err) {
        console.error(`[FsRowLibraryStorage] Skipping unreadable file ${full}:`, (err as Error).message);
      }
    }
    out.sort((a, b) => (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0));
    return out;
  }

  async get(id: string): Promise<LibraryEntry | null> {
    if (!isSafeId(id)) return null;
    await this.ensureDir();
    try {
      return JSON.parse(await fs.readFile(this.filePath(id), 'utf-8')) as LibraryEntry;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async save(entry: LibraryEntry): Promise<void> {
    if (!entry.id) throw new Error('LibraryEntry.id is required');
    assertSafeId(entry.id);
    await this.ensureDir();
    const now = new Date().toISOString();
    let createdAt = entry.createdAt || now;
    const existing = await this.get(entry.id);
    if (existing?.createdAt) createdAt = existing.createdAt;
    const clone: LibraryEntry = { ...entry, createdAt, updatedAt: now };
    await fs.writeFile(this.filePath(entry.id), JSON.stringify(clone, null, 2), 'utf-8');
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
