import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { LinkType } from '@lit-pigeon/core';
import { t } from '../../../i18n/index.js';

/**
 * `<pigeon-link-type-picker>` — a compact dropdown of "special link" types
 * (built-in system links + host customs). On select it resolves an href —
 * prompting for email/phone values — and emits `link-type-select { href }`.
 * Shared by the rich-text link popover and the button panel.
 */
@customElement('pigeon-link-type-picker')
export class PigeonLinkTypePicker extends LitElement {
  @property({ attribute: false })
  linkTypes: LinkType[] = [];

  static styles = css`
    :host { display: inline-block; }
    select {
      height: 32px;
      border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 6px;
      font-family: var(--pigeon-font);
      font-size: 12px;
      color: var(--pigeon-text-secondary, #64748b);
      background: var(--pigeon-bg, #ffffff);
      cursor: pointer;
      max-width: 160px;
    }
  `;

  render() {
    if (this.linkTypes.length === 0) return html``;
    return html`
      <select aria-label=${t('control.linkType.ariaLabel')} @change=${this._onChange}>
        <option value="">${t('control.linkType.placeholder')}</option>
        ${this.linkTypes.map((lt) => html`<option value=${lt.id}>${lt.label}</option>`)}
      </select>
    `;
  }

  private _onChange(e: Event) {
    const sel = e.target as HTMLSelectElement;
    const id = sel.value;
    sel.value = ''; // reset so the same type can be picked again
    if (!id) return;
    const type = this.linkTypes.find((lt) => lt.id === id);
    if (!type) return;

    let href: string | undefined;
    if (type.prompt) {
      const value = window.prompt(type.prompt === 'email' ? t('control.linkType.emailPrompt') : t('control.linkType.telPrompt'));
      if (!value || !value.trim()) return;
      href = (type.prompt === 'email' ? 'mailto:' : 'tel:') + value.trim();
    } else if (type.href) {
      href = type.href;
    }
    if (!href) return;

    this.dispatchEvent(new CustomEvent('link-type-select', {
      detail: { href },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-link-type-picker': PigeonLinkTypePicker;
  }
}
