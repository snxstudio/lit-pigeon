import type { PigeonEditor } from '@lit-pigeon/editor';
import type { PigeonDocument } from '@lit-pigeon/core';
import { listen } from './event-map.js';

/**
 * Tracks unsaved changes. pigeon:change fires for loads and selection changes
 * as well as edits, so compare the current document with the last loaded or
 * saved one: every edit produces a new document object.
 */
export function createDirtyTracker(editor: PigeonEditor, onDirtyChange: (dirty: boolean) => void) {
  let baseline = editor.getDocument();
  let dirty = false;
  const update = () => {
    const next = editor.getDocument() !== baseline;
    if (next !== dirty) onDirtyChange((dirty = next));
  };
  const stop = listen(editor, 'pigeon:change', update);
  return {
    /** Load a document without marking the editor dirty. */
    load(document: PigeonDocument) {
      baseline = document;
      editor.loadDocument(document);
    },
    /** Call after a successful save, with the document that was saved. */
    markSaved(document: PigeonDocument) {
      baseline = document;
      update();
    },
    stop,
  };
}
