import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { ButtonBlock } from '@lit-pigeon/core';
import type { Editor } from '@tiptap/core';
import { loadRichTextEditor } from '../../rich-text/loader.js';

@customElement('pigeon-button-block')
export class PigeonButtonBlock extends LitElement {
  @property({ type: Object })
  block!: ButtonBlock;

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean, reflect: true })
  editing = false;

  private _editor: Editor | null = null;
  private _editorHost: HTMLElement | null = null;

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

    .button {
      display: inline-block;
      text-decoration: none;
      cursor: pointer;
      border: none;
      font-family: inherit;
      box-sizing: border-box;
    }

    .button.full-width {
      display: block;
      width: 100%;
      text-align: center;
    }

    :host([editing]) .wrapper {
      outline: 2px solid var(--pigeon-primary, #3b82f6);
      outline-offset: 0px;
    }

    .button .pigeon-rich-text {
      outline: none;
    }

    .button .pigeon-rich-text p {
      margin: 0;
      display: inline;
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const padStyle = `padding: ${v.padding.top}px ${v.padding.right}px ${v.padding.bottom}px ${v.padding.left}px;`;
    const alignStyle = `text-align: ${v.alignment};`;
    const innerPad = `${v.innerPadding.top}px ${v.innerPadding.right}px ${v.innerPadding.bottom}px ${v.innerPadding.left}px`;
    const btnStyle = `
      background-color: ${v.backgroundColor};
      color: ${v.textColor};
      border-radius: ${v.borderRadius}px;
      font-size: ${v.fontSize}px;
      font-weight: ${v.fontWeight};
      padding: ${innerPad};
    `;

    // Stored content is HTML (e.g. <p>Click me</p>); strip the wrapping
    // <p> so the button renders inline when NOT editing.
    const inner = v.content.replace(/^\s*<p>([\s\S]*?)<\/p>\s*$/i, '$1');

    return html`
      <div
        class="wrapper"
        style="${padStyle} ${alignStyle}"
        @click=${this._handleClick}
        @dblclick=${this._handleDblClick}
      >
        <a
          class="button ${v.fullWidth ? 'full-width' : ''}"
          href="${v.href}"
          style="${btnStyle}"
          @click=${this._preventNav}
        >${this.editing ? html`` : unsafeHTML(inner)}</a>
      </div>
    `;
  }

  updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('editing')) {
      if (this.editing) void this._mountEditor();
      else this._teardownEditor();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._teardownEditor();
  }

  private async _mountEditor() {
    const host = this.renderRoot.querySelector('.button') as HTMLElement | null;
    if (!host) return;
    this._editorHost = host;
    const mod = await loadRichTextEditor();
    if (!this.editing || !this._editorHost) return;
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

  private _preventNav(e: Event) {
    e.preventDefault();
  }

  private _handleClick(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (this.editing) return;
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
    'pigeon-button-block': PigeonButtonBlock;
  }
}
