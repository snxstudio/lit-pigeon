import type { Editor } from '@tiptap/core';

export interface CreateEditorOptions {
  element: HTMLElement;
  initialHTML: string;
  /** Called once on blur with the final HTML. */
  onBlur?: (html: string) => void;
  /** Called when the user presses Escape inside the editor. */
  onEscape?: () => void;
  /** Called on every TipTap transaction. Use sparingly — fires per keystroke. */
  onUpdate?: (html: string) => void;
}

export interface RichTextModule {
  createEditor(opts: CreateEditorOptions): Editor;
}
