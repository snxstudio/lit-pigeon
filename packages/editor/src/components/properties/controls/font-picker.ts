import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { BrandFont } from '@lit-pigeon/core';

export interface FontOption {
  label: string;
  value: string;
}

/** Built-in, email-safe font stacks. Kept here so every font selector shares one list. */
export const DEFAULT_FONT_OPTIONS: FontOption[] = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, Times, serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
];

/**
 * `<pigeon-font-picker>` — a font-family `<select>` that merges the built-in
 * email-safe stacks with brand fonts (and, later, host `fontConfig` fonts via
 * #23). Emits `font-change` with `{ value }` (the CSS font-family string).
 */
@customElement('pigeon-font-picker')
export class PigeonFontPicker extends LitElement {
  @property({ type: String })
  label = 'Font Family';

  @property({ type: String })
  value = '';

  /** Brand fonts to append after the defaults (de-duplicated by family). */
  @property({ attribute: false })
  brandFonts: BrandFont[] = [];

  static styles = css`
    :host {
      display: block;
      margin-bottom: 12px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
      margin-bottom: 4px;
      font-family: var(--pigeon-font);
    }
    select {
      width: 100%;
      height: 32px;
      border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      box-sizing: border-box;
    }
  `;

  private get _options(): FontOption[] {
    const seen = new Set(DEFAULT_FONT_OPTIONS.map((o) => o.value));
    const brand = this.brandFonts
      .filter((f) => !seen.has(f.family))
      .map((f) => ({ label: f.name, value: f.family }));
    return [...DEFAULT_FONT_OPTIONS, ...brand];
  }

  render() {
    return html`
      <label>${this.label}</label>
      <select @change=${this._onChange}>
        ${this._options.map(
          (o) => html`<option value=${o.value} ?selected=${this.value === o.value}>${o.label}</option>`,
        )}
      </select>
    `;
  }

  private _onChange(e: Event) {
    this.value = (e.target as HTMLSelectElement).value;
    this.dispatchEvent(
      new CustomEvent('font-change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-font-picker': PigeonFontPicker;
  }
}
