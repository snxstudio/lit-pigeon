import type { RichTextModule } from './types.js';

let modulePromise: Promise<RichTextModule> | null = null;

/**
 * Lazily import the rich-text module. The dynamic `import('./index.js')` is
 * what tells Vite/Rollup to code-split TipTap into a separate chunk. The
 * resolved promise is memoised so repeat edits do not re-import.
 */
export function loadRichTextEditor(): Promise<RichTextModule> {
  if (!modulePromise) {
    modulePromise = import('./index.js').then((m) => m.default);
  }
  return modulePromise;
}

/** Visible for tests — drop the memoised promise so the next call re-imports. */
export function _resetForTests(): void {
  modulePromise = null;
}
