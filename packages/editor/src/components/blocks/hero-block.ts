import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { HeroBlock } from '@lit-pigeon/core';

@customElement('pigeon-hero-block')
export class PigeonHeroBlock extends LitElement {
  @property({ type: Object })
  block!: HeroBlock;

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

    return html`
      <div
        class="wrapper"
        style="${padStyle} ${bgStyle} ${heightStyle} align-items: ${alignMap[v.verticalAlign]};"
        @click=${this._handleClick}
      >
        ${v.backgroundUrl || v.content
          ? html`<div class="content" style="${innerPadStyle}">${this._renderContent(v.content)}</div>`
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

  private _renderContent(content: string) {
    const div = document.createElement('div');
    div.innerHTML = content;
    return html`${this._unsafeHtml(content)}`;
  }

  private _unsafeHtml(htmlStr: string) {
    const template = document.createElement('template');
    template.innerHTML = htmlStr;
    const fragment = template.content.cloneNode(true);
    const container = document.createElement('div');
    container.appendChild(fragment);
    return html`<div .innerHTML=${htmlStr}></div>`;
  }

  private _handleClick(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(new CustomEvent('block-select', {
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
