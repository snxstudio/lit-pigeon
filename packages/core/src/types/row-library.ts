import type { RowNode } from './document.js';

/** A user-saved reusable row. */
export interface LibraryEntry {
  /** Stable, URL-safe slug; doubles as filename when persisted. */
  id: string;
  /** Display name shown in the Saved tab. */
  name: string;
  /** What the entry holds. Only 'row' is supported now. */
  kind: 'row';
  /** The saved row (with its columns/blocks). */
  node: RowNode;
  /** ISO-8601 timestamps. */
  createdAt: string;
  updatedAt: string;
}

/** Pluggable persistence for the row library. Mirrors {@link TemplateStorage}. */
export interface RowLibraryStorage {
  list(): Promise<LibraryEntry[]>;
  get(id: string): Promise<LibraryEntry | null>;
  save(entry: LibraryEntry): Promise<void>;
  delete(id: string): Promise<void>;
}
