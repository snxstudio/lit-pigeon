import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SpacerBlock } from '@lit-pigeon/core';

@customElement('pigeon-spacer-block')
export class PigeonSpacerBlock extends LitElement {
  @property({ type: Object })
  block!: SpacerBlock;

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
      position: relative;
    }

    .label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 11px;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      opacity: 0;
      transition: opacity 0.15s ease;
      pointer-events: none;
      white-space: nowrap;
    }

    :host(:hover) .label,
    :host([selected]) .label {
      opacity: 1;
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <div
        class="wrapper"
        style="height: ${v.height}px;"
        @click=${this._handleClick}
      >
        <span class="label">${v.height}px</span>
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
    'pigeon-spacer-block': PigeonSpacerBlock;
  }
}
