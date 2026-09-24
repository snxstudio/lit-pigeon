import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from './font-size.js';
import { buildLinkExtension } from './link.js';
import { MergeTag } from './merge-tag.js';
import { RawBlock, RawInline, RawWrapper } from './raw-html.js';
import type { RawStore } from '../raw-html.js';

/**
 * Returns the base extension set used by every Pigeon rich-text editor.
 * StarterKit covers paragraph, bold, italic, strike, code, headings,
 * lists, blockquote, and history.
 *
 * `store` holds the email scaffolding kept out of the schema; the raw nodes
 * render from it.
 */
export function buildBaseExtensions(store: RawStore) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // We rely on TipTap's built-in history. Each top-level commit
      // (one per blur/Escape) is a single editor-core transaction, so the
      // outer history-plugin records the whole edit atomically.
    }),
    Underline,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    buildLinkExtension(),
    MergeTag,
    RawBlock.configure({ store }),
    RawInline.configure({ store }),
    RawWrapper.configure({ store }),
  ];
}
