import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DividerBlock } from '@lit-pigeon/core';

@customElement('pigeon-divider-block')
export class PigeonDividerBlock extends LitElement {
  @property({ type: Object })
  block!: DividerBlock;

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

    hr {
      border: none;
      margin: 0;
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const padStyle = `padding: ${v.padding.top}px ${v.padding.right}px ${v.padding.bottom}px ${v.padding.left}px;`;
    const hrStyle = `
      border-top: ${v.borderWidth}px ${v.borderStyle} ${v.borderColor};
      width: ${v.width};
    `;

    return html`
      <div
        class="wrapper"
        style="${padStyle}"
        @click=${this._handleClick}
      >
        <hr style="${hrStyle}" />
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
    'pigeon-divider-block': PigeonDividerBlock;
  }
}
