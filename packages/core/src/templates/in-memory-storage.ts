import type { Template, TemplateStorage } from '../types/template.js';
import { getStarterTemplates } from './starters.js';

export interface InMemoryTemplateStorageOptions {
  /** When true (default), the storage is seeded with the built-in starter templates. */
  includeStarters?: boolean;
  /** Additional templates to seed alongside the starters. */
  seed?: Template[];
}

/**
 * Default `TemplateStorage` implementation — backs templates in a `Map`
 * inside a single process. Suitable for the editor's default config, the
 * MCP server's per-session lifetime, and unit tests.
 *
 * Consumers that need persistence should implement `TemplateStorage` directly
 * (e.g. wrapping localStorage, a REST endpoint, or the filesystem).
 */
export class InMemoryTemplateStorage implements TemplateStorage {
  private readonly _byId = new Map<string, Template>();

  constructor(opts: InMemoryTemplateStorageOptions = {}) {
    if (opts.includeStarters !== false) {
      for (const t of getStarterTemplates()) this._byId.set(t.id, t);
    }
    if (opts.seed) {
      for (const t of opts.seed) this._byId.set(t.id, t);
    }
  }

  async list(): Promise<Template[]> {
    // Deep-clone on read so consumers can't mutate stored templates by reference.
    return Array.from(this._byId.values()).map((t) => structuredClone(t));
  }

  async get(id: string): Promise<Template | null> {
    const t = this._byId.get(id);
    return t ? structuredClone(t) : null;
  }

  async save(template: Template): Promise<void> {
    if (!template.id) throw new Error('Template.id is required');
    const clone = structuredClone(template);
    clone.updatedAt = new Date().toISOString();
    if (!this._byId.has(clone.id)) clone.createdAt = clone.updatedAt;
    this._byId.set(clone.id, clone);
  }

  async delete(id: string): Promise<void> {
    this._byId.delete(id);
  }
}
