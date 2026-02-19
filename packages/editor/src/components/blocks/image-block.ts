import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ImageBlock } from '@lit-pigeon/core';

@customElement('pigeon-image-block')
export class PigeonImageBlock extends LitElement {
  @property({ type: Object })
  block!: ImageBlock;

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

    img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
      background: var(--pigeon-surface, #f8fafc);
      border: 2px dashed var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 14px;
    }

    .placeholder svg {
      width: 32px;
      height: 32px;
      margin-right: 8px;
      opacity: 0.5;
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const padStyle = `padding: ${v.padding.top}px ${v.padding.right}px ${v.padding.bottom}px ${v.padding.left}px;`;
    const alignStyle = `text-align: ${v.alignment};`;
    const imgWidth = v.width === 'auto' ? '100%' : `${v.width}px`;
    const borderRadius = v.borderRadius ? `border-radius: ${v.borderRadius}px;` : '';

    return html`
      <div
        class="wrapper"
        style="${padStyle} ${alignStyle}"
        @click=${this._handleClick}
      >
        ${v.src
          ? html`<img
              src="${v.src}"
              alt="${v.alt}"
              style="width: ${imgWidth}; ${borderRadius}"
            />`
          : html`
            <div class="placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              Drop an image or enter URL
            </div>
          `}
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
    'pigeon-image-block': PigeonImageBlock;
  }
}
