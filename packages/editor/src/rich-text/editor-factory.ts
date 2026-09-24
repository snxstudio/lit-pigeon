import { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { GapCursor } from '@tiptap/pm/gapcursor';
import { buildBaseExtensions } from './extensions/base.js';
import { sanitizeHTML } from './serialization.js';
import { preprocessForEditor } from './preprocess.js';
import { holdRawFragments, RawStore } from './raw-html.js';
import { richTextController } from './controller.js';
import type { CreateEditorOptions } from './types.js';

export function createEditor(opts: CreateEditorOptions): Editor {
  // Email scaffolding the schema cannot hold (comments, tables, images,
  // wrapper attributes) is parked here for the lifetime of this editor.
  const store = new RawStore();
  const editor: Editor = new Editor({
    element: opts.element,
    extensions: buildBaseExtensions(store),
    content: preprocessForEditor(holdRawFragments(opts.initialHTML || '<p></p>', store)),
    autofocus: 'end',
    onCreate: ({ editor: e }) => {
      // `autofocus: 'end'` selects a held fragment that ends the block, so the
      // first keystroke would replace it. Put the cursor after it instead.
      const { selection, tr } = e.state;
      if (selection instanceof NodeSelection) {
        e.view.dispatch(tr.setSelection(new GapCursor(tr.doc.resolve(selection.to))));
      }
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape') {
          opts.onEscape?.(commitHTML());
          return true;
        }
        return false;
      },
      attributes: {
        class: 'pigeon-rich-text',
      },
    },
  });

  // TipTap normalises markup it loads (inline styles, <b> -> <strong>, ...).
  // If the user changed nothing, hand back the stored HTML untouched.
  const initial = editor.getHTML();
  const commitHTML = () => {
    const html = editor.getHTML();
    return html === initial ? opts.initialHTML : sanitizeHTML(html, store);
  };

  editor.on('focus', ({ editor: e }) => richTextController.setActive(e));
  editor.on('blur', ({ editor: e }) => {
    // The user is operating a formatting control (font-size select, color
    // input, link field) that stole DOM focus. Keep the editor alive and the
    // active binding intact so the command can apply to the preserved
    // selection; the real commit happens on the next genuine blur.
    if (richTextController.isHeld()) return;
    richTextController.clearIfActive(e);
    opts.onBlur?.(commitHTML());
  });
  editor.on('destroy', () => richTextController.clearIfActive(editor));
  if (opts.onUpdate) {
    editor.on('update', ({ editor: e }) => opts.onUpdate!(sanitizeHTML(e.getHTML(), store)));
  }
  // Register immediately — autofocus may not fire a separate focus event in some test envs.
  richTextController.setActive(editor);
  return editor;
}
