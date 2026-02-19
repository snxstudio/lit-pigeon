import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TextBlock } from '@lit-pigeon/core';

@customElement('pigeon-text-block')
export class PigeonTextBlock extends LitElement {
  @property({ type: Object })
  block!: TextBlock;

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

    .content p {
      margin: 0;
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
      >
        <div class="content" style="${textStyle}" .innerHTML=${v.content}></div>
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
    'pigeon-text-block': PigeonTextBlock;
  }
}
