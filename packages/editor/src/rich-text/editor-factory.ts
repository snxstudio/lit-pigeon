import { Editor } from '@tiptap/core';
import { buildBaseExtensions } from './extensions/base.js';
import type { CreateEditorOptions } from './types.js';

export function createEditor(opts: CreateEditorOptions): Editor {
  const editor = new Editor({
    element: opts.element,
    extensions: buildBaseExtensions(),
    content: opts.initialHTML || '<p></p>',
    autofocus: 'end',
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape') {
          opts.onEscape?.();
          return true;
        }
        return false;
      },
      attributes: {
        class: 'pigeon-rich-text',
      },
    },
    onBlur: ({ editor: e }) => opts.onBlur?.(e.getHTML()),
    onUpdate: opts.onUpdate ? ({ editor: e }) => opts.onUpdate!(e.getHTML()) : undefined,
  });
  return editor;
}
