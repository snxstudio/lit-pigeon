import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HeroBlock } from '@lit-pigeon/core';
import type { Editor } from '@tiptap/core';
import { loadRichTextEditor } from '../../rich-text/loader.js';

@customElement('pigeon-hero-block')
export class PigeonHeroBlock extends LitElement {
  @property({ type: Object })
  block!: HeroBlock;

  @property({ type: Boolean, reflect: true })
  selected = false;

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
      background-size: cover;
      background-repeat: no-repeat;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content {
      width: 100%;
      text-align: center;
      font-family: var(--pigeon-font);
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 13px;
      flex-direction: column;
      gap: 8px;
    }

    .empty-state svg {
      width: 32px;
      height: 32px;
      opacity: 0.4;
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
    const innerPadStyle = `padding: ${v.innerPadding.top}px ${v.innerPadding.right}px ${v.innerPadding.bottom}px ${v.innerPadding.left}px;`;

    const alignMap: Record<string, string> = {
      top: 'flex-start',
      middle: 'center',
      bottom: 'flex-end',
    };

    const bgStyle = v.backgroundUrl
      ? `background-image: url(${v.backgroundUrl}); background-position: ${v.backgroundPosition};`
      : `background-color: ${v.backgroundColor};`;

    const heightStyle = v.mode === 'fixed-height' ? `height: ${v.height}px;` : `min-height: ${v.height}px;`;

    const hasContent = v.backgroundUrl || v.content;
    const editingHere = this.editing;

    return html`
      <div
        class="wrapper"
        style="${padStyle} ${bgStyle} ${heightStyle} align-items: ${alignMap[v.verticalAlign]};"
        @click=${this._handleClick}
        @dblclick=${this._handleDblClick}
      >
        ${editingHere
          ? html`<div class="content" style="${innerPadStyle}"></div>`
          : hasContent
            ? html`<div class="content" style="${innerPadStyle}" .innerHTML=${v.content}></div>`
            : html`
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="2"/>
                  <circle cx="8" cy="8" r="2"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                Set a background image in properties
              </div>
            `}
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
    const host = this.renderRoot.querySelector('.content') as HTMLDivElement | null;
    if (!host) return;
    this._editorHost = host;
    const mod = await loadRichTextEditor();
    if (!this.editing || !this._editorHost) return;
    this._editor = mod.createEditor({
      element: this._editorHost,
      initialHTML: this.block.values.content || '<p></p>',
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
    'pigeon-hero-block': PigeonHeroBlock;
  }
}
