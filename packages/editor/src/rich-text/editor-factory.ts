import { Editor } from '@tiptap/core';
import { buildBaseExtensions } from './extensions/base.js';
import { sanitizeHTML } from './serialization.js';
import { preprocessForEditor } from './preprocess.js';
import { richTextController } from './controller.js';
import type { CreateEditorOptions } from './types.js';

export function createEditor(opts: CreateEditorOptions): Editor {
  const editor: Editor = new Editor({
    element: opts.element,
    extensions: buildBaseExtensions(),
    content: preprocessForEditor(opts.initialHTML || '<p></p>'),
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
  });

  editor.on('focus', ({ editor: e }) => richTextController.setActive(e));
  editor.on('blur', ({ editor: e }) => {
    // The user is operating a formatting control (font-size select, color
    // input, link field) that stole DOM focus. Keep the editor alive and the
    // active binding intact so the command can apply to the preserved
    // selection; the real commit happens on the next genuine blur.
    if (richTextController.isHeld()) return;
    richTextController.clearIfActive(e);
    opts.onBlur?.(sanitizeHTML(e.getHTML()));
  });
  editor.on('destroy', () => richTextController.clearIfActive(editor));
  if (opts.onUpdate) {
    editor.on('update', ({ editor: e }) => opts.onUpdate!(sanitizeHTML(e.getHTML())));
  }
  // Register immediately — autofocus may not fire a separate focus event in some test envs.
  richTextController.setActive(editor);
  return editor;
}
