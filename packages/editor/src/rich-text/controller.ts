import type { Editor } from '@tiptap/core';

/**
 * Tracks the currently-active TipTap editor instance across all
 * `<pigeon-text-block>`, `<pigeon-hero-block>`, and `<pigeon-button-block>`
 * inline editors. There is at most one focused editor at a time.
 *
 * The merge-tag picker uses this to decide whether to call
 * `editor.chain().insertContent({...}).run()` (when an editor is focused)
 * or fall back to its existing textarea-insertion path (when none is).
 */
type Listener = (editor: Editor | null) => void;

class RichTextController {
  private _active: Editor | null = null;
  private _listeners = new Set<Listener>();
  private _held = false;

  setActive(editor: Editor | null): void {
    if (this._active === editor) return;
    this._active = editor;
    for (const l of this._listeners) l(editor);
  }

  /** Clear only if `editor` is the currently-active one (avoids races on rapid focus changes). */
  clearIfActive(editor: Editor): void {
    if (this._active === editor) this.setActive(null);
  }

  /**
   * "Focus hold" — set while the user operates a formatting control that lives
   * outside the editable (the bubble's link field, the sidebar format panel's
   * `<select>`/color inputs). Native form controls steal DOM focus, which would
   * otherwise blur the editor and tear it down before the command runs. While
   * held, the editor's blur handler keeps the editor alive and the active
   * binding intact so the command can apply to the preserved selection.
   */
  holdFocus(): void {
    this._held = true;
  }

  releaseFocus(): void {
    this._held = false;
  }

  isHeld(): boolean {
    return this._held;
  }

  getActive(): Editor | null {
    return this._active;
  }

  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }
}

export const richTextController = new RichTextController();
