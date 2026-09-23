import type { PigeonEditor } from '@lit-pigeon/editor';
import type { BrandKit, PigeonDocument, Selection } from '@lit-pigeon/core';

/** The public events of <pigeon-editor>, with their `detail` types. */
export interface PigeonEditorEventMap {
  'pigeon:ready': CustomEvent<null>;
  'pigeon:change': CustomEvent<{ document: PigeonDocument }>;
  'pigeon:select': CustomEvent<{ selection: Selection | null }>;
  'pigeon:preview': CustomEvent<null>;
  'pigeon:export': CustomEvent<null>;
  'pigeon:export-html': CustomEvent<{ document: PigeonDocument; html: string | null }>;
  'pigeon:export-mjml': CustomEvent<{ document: PigeonDocument; mjml: string | null }>;
  'pigeon:export-json': CustomEvent<{ document: PigeonDocument }>;
  'pigeon:merge-tag-request': CustomEvent<null>;
  'brand-kit-change': CustomEvent<{ brandKit: BrandKit }>;
  'brand-kit-error': CustomEvent<{ error: unknown; operation: 'list' | 'save' }>;
  'row-library-error': CustomEvent<{ error: unknown; operation: 'save' | 'delete' }>;
}

/** Adds a typed listener and returns a function that removes it. */
export function listen<K extends keyof PigeonEditorEventMap>(
  editor: PigeonEditor,
  type: K,
  handler: (event: PigeonEditorEventMap[K]) => void,
): () => void {
  const listener = (event: Event) => handler(event as PigeonEditorEventMap[K]);
  editor.addEventListener(type, listener);
  return () => editor.removeEventListener(type, listener);
}
