import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TextBlock } from '@lit-pigeon/core';
import type { Editor } from '@tiptap/core';
import { loadRichTextEditor } from '../../rich-text/loader.js';

@customElement('pigeon-text-block')
export class PigeonTextBlock extends LitElement {
  @property({ type: Object })
  block!: TextBlock;

  @property({ type: Boolean, reflect: true })
  selected = false;

  /** When true, a TipTap editor is mounted inside this block. */
  @property({ type: Boolean, reflect: true })
  editing = false;

  private _editor: Editor | null = null;
  private _editorHost: HTMLDivElement | null = null;

  static styles = css`
    :host {
      display: block;
      cursor: pointer;
      position: relative;
    }

    :host([selected]) .wrapper {
      outline: 2px solid var(--pigeon-selected-outline, #3b82f6);
      outline-offset: 0px;
    }

    :host(:hover:not([selected])) .wrapper {
      outline: 1px dashed var(--pigeon-border, #e2e8f0);
      outline-offset: 0px;
    }

    .wrapper {
      border-radius: var(--pigeon-radius-sm, 4px);
      transition: outline 0.15s ease;
    }

    .content {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .content p {
      margin: 0;
    }

    :host([editing]) .wrapper {
      outline: 2px solid var(--pigeon-primary, #3b82f6);
      outline-offset: 0px;
    }

    .content .pigeon-rich-text {
      outline: none;
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const padStyle = `padding: ${v.padding.top}px ${v.padding.right}px ${v.padding.bottom}px ${v.padding.left}px;`;
    const textStyle = `text-align: ${v.textAlign}; line-height: ${v.lineHeight};`;
    return html`
      <div
        class="wrapper"
        style="${padStyle}"
        @click=${this._handleClick}
        @dblclick=${this._handleDblClick}
      >
        ${this.editing
          ? html`<div class="content" style="${textStyle}"></div>`
          : html`<div class="content" style="${textStyle}" .innerHTML=${v.content}></div>`}
      </div>
    `;
  }

  updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('editing')) {
      if (this.editing) {
        void this._mountEditor();
      } else {
        this._teardownEditor();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownEditor();
  }

  private async _mountEditor() {
    const host = this.renderRoot.querySelector('.content') as HTMLDivElement | null;
    if (!host) return;
    this._editorHost = host;
    const mod = await loadRichTextEditor();
    if (!this.editing || !this._editorHost) return; // bailed out before module resolved
    this._editor = mod.createEditor({
      element: this._editorHost,
      initialHTML: this.block.values.content,
      onBlur: (html) => this._commit(html),
      onEscape: () => this._exit(),
    });
  }

  private _teardownEditor() {
    if (this._editor) {
      try { this._editor.destroy(); } catch { /* ignore */ }
      this._editor = null;
    }
    this._editorHost = null;
  }

  private _commit(html: string) {
    this.dispatchEvent(new CustomEvent('block-exit-edit', {
      detail: { blockId: this.block.id, content: html },
      bubbles: true,
      composed: true,
    }));
  }

  private _exit() {
    const html = this._editor ? this._editor.getHTML() : this.block.values.content;
    this._commit(html);
  }

  private _handleClick(e: Event) {
    e.stopPropagation();
    if (this.editing) return; // clicks inside the editor should not re-select
    this.dispatchEvent(new CustomEvent('block-select', {
      detail: { blockId: this.block.id },
      bubbles: true,
      composed: true,
    }));
  }

  private _handleDblClick(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (this.editing) return;
    this.dispatchEvent(new CustomEvent('block-enter-edit', {
      detail: { blockId: this.block.id },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-text-block': PigeonTextBlock;
  }
}
