import type { PigeonDocument } from './document.js';

export type TemplateCategory =
  | 'welcome'
  | 'newsletter'
  | 'transactional'
  | 'promo'
  | 'announcement'
  | 'other';

export interface Template {
  /** Stable, URL-safe slug. Doubles as filename when persisted. */
  id: string;
  /** Display name shown in pickers. */
  name: string;
  /** One-line summary used in template galleries. */
  description?: string;
  /** Optional category for grouping in UI. */
  category?: TemplateCategory;
  /** Optional preview image — base64 data URL or absolute URL. */
  thumbnail?: string;
  /** The full PigeonDocument the template materialises. */
  document: PigeonDocument;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Pluggable persistence layer for templates. The editor ships with an
 * in-memory implementation that includes the starter templates; consumers
 * implement this interface to back templates with localStorage, a REST
 * endpoint, IndexedDB, or the filesystem.
 */
export interface TemplateStorage {
  list(): Promise<Template[]>;
  get(id: string): Promise<Template | null>;
  save(template: Template): Promise<void>;
  delete(id: string): Promise<void>;
}
