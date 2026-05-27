import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  getStarterTemplates,
  type Template,
  type TemplateStorage,
} from '@lit-pigeon/core';

export interface FsTemplateStorageOptions {
  /**
   * Directory in which template JSON files live.
   * Defaults to `~/.lit-pigeon/templates`.
   */
  dir?: string;
  /**
   * When true (default), seed the directory with the built-in starter templates
   * — but only if the directory is empty. Existing user files are never
   * overwritten.
   */
  includeStarters?: boolean;
  /**
   * Additional templates to seed alongside the starters (also only when the
   * directory is empty).
   */
  seed?: Template[];
}

/** Allowed shape for template ids — safe to use as a filename. */
const ID_RE = /^[a-z0-9][a-z0-9-]*$/i;

function assertSafeId(id: string): void {
  if (!ID_RE.test(id)) {
    throw new Error(
      `Invalid template id: ${JSON.stringify(id)}. Must match ${ID_RE} (alphanumeric + hyphens, no slashes, no dotfiles).`,
    );
  }
}

function isSafeId(id: string): boolean {
  return ID_RE.test(id);
}

function defaultDir(): string {
  return path.join(os.homedir(), '.lit-pigeon', 'templates');
}

/**
 * Filesystem-backed `TemplateStorage` — one JSON file per template under a
 * configurable directory (default `~/.lit-pigeon/templates`).
 *
 * Designed to be drop-in compatible with `InMemoryTemplateStorage`, so the
 * MCP server can persist user-saved templates across restarts.
 */
export class FsTemplateStorage implements TemplateStorage {
  readonly dir: string;
  private readonly includeStarters: boolean;
  private readonly initialSeed: Template[];
  /** Promise that resolves once the (lazy) initial seeding has completed. */
  private seedPromise: Promise<void> | null = null;

  constructor(opts: FsTemplateStorageOptions = {}) {
    this.dir = opts.dir ?? defaultDir();
    this.includeStarters = opts.includeStarters !== false;
    this.initialSeed = opts.seed ?? [];
  }

  /**
   * Ensure the directory exists and, if empty, drop the starter templates in.
   * Idempotent and lazy — runs once per instance, on the first mutating or
   * reading call. Re-entrant: subsequent calls await the same promise.
   */
  private async ensureSeeded(): Promise<void> {
    if (this.seedPromise) return this.seedPromise;
    this.seedPromise = (async () => {
      await fs.mkdir(this.dir, { recursive: true });
      const existing = (await fs.readdir(this.dir)).filter((f) => f.endsWith('.json'));
      if (existing.length > 0) return; // Never overwrite user content.

      const toSeed: Template[] = [];
      if (this.includeStarters) toSeed.push(...getStarterTemplates());
      toSeed.push(...this.initialSeed);
      for (const t of toSeed) {
        // Bypass id validation here — starters use a controlled shape, and we
        // want to fail loudly if a built-in id is somehow unsafe.
        assertSafeId(t.id);
        await this.writeFile(t);
      }
    })();
    return this.seedPromise;
  }

  private filePath(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }

  private async writeFile(t: Template): Promise<void> {
    const json = JSON.stringify(t, null, 2);
    await fs.writeFile(this.filePath(t.id), json, 'utf-8');
  }

  private async readFile(id: string): Promise<Template | null> {
    try {
      const raw = await fs.readFile(this.filePath(id), 'utf-8');
      return JSON.parse(raw) as Template;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return null;
      throw err;
    }
  }

  async list(): Promise<Template[]> {
    await this.ensureSeeded();
    let entries: string[];
    try {
      entries = await fs.readdir(this.dir);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return [];
      throw err;
    }

    const out: Template[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const full = path.join(this.dir, entry);
      try {
        const raw = await fs.readFile(full, 'utf-8');
        const parsed = JSON.parse(raw) as Template;
        out.push(parsed);
      } catch (err) {
        // Skip files we can't parse; surface a warning on stderr so users can
        // diagnose corruption without crashing the server.
        // eslint-disable-next-line no-console
        console.error(
          `[FsTemplateStorage] Skipping unreadable template file ${full}:`,
          (err as Error).message,
        );
      }
    }

    out.sort((a, b) => {
      const aT = Date.parse(a.updatedAt) || 0;
      const bT = Date.parse(b.updatedAt) || 0;
      return bT - aT;
    });
    return out;
  }

  async get(id: string): Promise<Template | null> {
    if (!isSafeId(id)) return null;
    await this.ensureSeeded();
    return this.readFile(id);
  }

  async save(template: Template): Promise<void> {
    if (!template.id) throw new Error('Template.id is required');
    assertSafeId(template.id);
    await this.ensureSeeded();

    const now = new Date().toISOString();
    const existing = await this.readFile(template.id);
    const clone: Template = {
      ...template,
      createdAt: existing?.createdAt ?? template.createdAt ?? now,
      updatedAt: now,
    };
    await this.writeFile(clone);
  }

  async delete(id: string): Promise<void> {
    if (!isSafeId(id)) return; // Match get(): unsafe ids cannot reference real files.
    await this.ensureSeeded();
    try {
      await fs.unlink(this.filePath(id));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return; // No-op if missing.
      throw err;
    }
  }
}
