import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HtmlBlock } from '@lit-pigeon/core';

@customElement('pigeon-html-block')
export class PigeonHtmlBlock extends LitElement {
  @property({ type: Object })
  block!: HtmlBlock;

  @property({ type: Boolean, reflect: true })
  selected = false;

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

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60px;
      background: var(--pigeon-surface, #f8fafc);
      border: 2px dashed var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font-mono);
      font-size: 13px;
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const padStyle = `padding: ${v.padding.top}px ${v.padding.right}px ${v.padding.bottom}px ${v.padding.left}px;`;

    return html`
      <div
        class="wrapper"
        style="${padStyle}"
        @click=${this._handleClick}
      >
        ${v.content
          ? html`<div class="content" .innerHTML=${v.content}></div>`
          : html`<div class="empty-state">&lt;/&gt; Custom HTML</div>`}
      </div>
    `;
  }

  private _handleClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('block-select', {
      detail: { blockId: this.block.id },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-html-block': PigeonHtmlBlock;
  }
}
