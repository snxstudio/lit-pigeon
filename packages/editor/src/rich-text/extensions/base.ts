import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { buildLinkExtension } from './link.js';

/**
 * Returns the base extension set used by every Pigeon rich-text editor.
 * StarterKit covers paragraph, bold, italic, strike, code, headings,
 * lists, blockquote, and history.
 */
export function buildBaseExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // We rely on TipTap's built-in history. Each top-level commit
      // (one per blur/Escape) is a single editor-core transaction, so the
      // outer history-plugin records the whole edit atomically.
    }),
    Underline,
    buildLinkExtension(),
  ];
}
