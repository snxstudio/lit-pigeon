import { SvelteComponentTyped } from 'svelte';
import type {
  PigeonDocument,
  EditorConfig,
  Renderer,
  Selection,
} from '@lit-pigeon/core';

export interface PigeonEditorProps {
  document?: PigeonDocument;
  config?: Partial<EditorConfig>;
  renderer?: Renderer;
  documentToMjml?: (doc: PigeonDocument) => string;
}

export interface PigeonEditorEvents {
  change: CustomEvent<{ document: PigeonDocument }>;
  select: CustomEvent<{ selection: Selection | null }>;
  ready: CustomEvent<void>;
  preview: CustomEvent<unknown>;
  exportHtml: CustomEvent<{ html: string }>;
  exportMjml: CustomEvent<{ mjml: string | null }>;
  exportJson: CustomEvent<{ document: PigeonDocument }>;
  mergeTagRequest: CustomEvent<unknown>;
}

export interface PigeonEditorSlots {
  default: Record<string, never>;
}

export default class PigeonEditor extends SvelteComponentTyped<
  PigeonEditorProps,
  PigeonEditorEvents,
  PigeonEditorSlots
> {}
