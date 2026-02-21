import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { NavBarBlock, NavLink } from '@lit-pigeon/core';

@customElement('pigeon-navbar-block')
export class PigeonNavBarBlock extends LitElement {
  @property({ type: Object })
  block!: NavBarBlock;

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

    .nav-links {
      display: flex;
      flex-wrap: wrap;
    }

    .nav-link {
      display: inline-block;
      text-decoration: none;
      font-family: var(--pigeon-font);
      cursor: pointer;
    }

    .nav-link:hover {
      opacity: 0.8;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 40px;
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
        ${v.links.length === 0
          ? html`<div class="empty-state">Add navigation links in properties</div>`
          : html`
            <div class="nav-links" style="justify-content: ${justifyMap[v.alignment]};">
              ${v.links.map((link: NavLink) => html`
                <a
                  class="nav-link"
                  href="${link.href}"
                  style="color: ${link.color ?? v.linkColor}; font-size: ${v.linkFontSize}px; padding: ${link.padding ?? v.linkPadding}; font-weight: ${link.fontWeight ?? 'normal'}; text-decoration: ${link.textDecoration ?? 'none'};"
                  @click=${this._preventNav}
                >${link.text}</a>
              `)}
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
    'pigeon-navbar-block': PigeonNavBarBlock;
  }
}
