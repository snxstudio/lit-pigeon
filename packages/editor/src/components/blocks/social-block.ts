import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SocialBlock, SocialIcon } from '@lit-pigeon/core';

const SOCIAL_ICONS: Record<string, string> = {
  facebook: 'f',
  twitter: '𝕏',
  instagram: 'ig',
  linkedin: 'in',
  youtube: '▶',
  tiktok: '♪',
  custom: '★',
};

const SOCIAL_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  twitter: '#000000',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  tiktok: '#000000',
  custom: '#6b7280',
};

@customElement('pigeon-social-block')
export class PigeonSocialBlock extends LitElement {
  @property({ type: Object })
  block!: SocialBlock;

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

    .icons-container {
      display: flex;
      flex-wrap: wrap;
    }

    .social-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: white;
      font-weight: bold;
      text-decoration: none;
      font-family: var(--pigeon-font);
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50px;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 13px;
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const padStyle = `padding: ${v.padding.top}px ${v.padding.right}px ${v.padding.bottom}px ${v.padding.left}px;`;
    const justifyMap: Record<string, string> = {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end',
    };

    return html`
      <div
        class="wrapper"
        style="${padStyle}"
        @click=${this._handleClick}
      >
        ${v.icons.length === 0
          ? html`<div class="empty-state">Add social icons in properties</div>`
          : html`
            <div class="icons-container" style="justify-content: ${justifyMap[v.alignment]}; gap: ${v.spacing}px;">
              ${v.icons.map((icon: SocialIcon) => {
                const bg = SOCIAL_COLORS[icon.type] ?? '#6b7280';
                const label = SOCIAL_ICONS[icon.type] ?? '?';
                return html`
                  <a
                    class="social-icon"
                    href="${icon.href}"
                    title="${icon.label ?? icon.type}"
                    style="width: ${v.iconSize}px; height: ${v.iconSize}px; background: ${bg}; font-size: ${v.iconSize * 0.4}px;"
                    @click=${this._preventNav}
                  >${icon.iconUrl ? html`<img src="${icon.iconUrl}" alt="${icon.label ?? icon.type}" style="width: ${v.iconSize * 0.6}px; height: ${v.iconSize * 0.6}px;" />` : label}</a>
                `;
              })}
            </div>
          `}
      </div>
    `;
  }

  private _preventNav(e: Event) {
    e.preventDefault();
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
    'pigeon-social-block': PigeonSocialBlock;
  }
}
