import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { BrandColor } from '@lit-pigeon/core';
import { t } from '../../../i18n/index.js';

@customElement('pigeon-color-picker')
export class PigeonColorPicker extends LitElement {
  @property({ type: String })
  label = t('control.color.label');

  @property({ type: String })
  value = '#000000';

  /** Optional brand-kit swatches rendered as quick-pick buttons. */
  @property({ attribute: false })
  swatches: BrandColor[] = [];

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

    .color-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    input[type='color'] {
      -webkit-appearance: none;
      appearance: none;
      width: 32px;
      height: 32px;
      border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px);
      cursor: pointer;
      padding: 0;
      background: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    input[type='color']:focus-visible {
      outline: none;
      border-color: var(--pigeon-ring);
      box-shadow: var(--pigeon-ring-shadow);
    }

    input[type='color']::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    input[type='color']::-webkit-color-swatch {
      border: none;
      border-radius: 2px;
    }

    input[type='text'] {
      flex: 1;
      height: 32px;
      border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font-mono);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    input[type='text']:focus-visible {
      border-color: var(--pigeon-ring);
      box-shadow: var(--pigeon-ring-shadow);
    }

    .swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }

    .swatch {
      width: 18px;
      height: 18px;
      border-radius: var(--pigeon-radius-sm, 4px);
      border: 1px solid var(--pigeon-input, #cbd5e1);
      padding: 0;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .swatch:hover {
      border-color: var(--pigeon-ring);
    }

    .swatch:focus-visible {
      outline: none;
      box-shadow: var(--pigeon-ring-shadow);
    }
  `;

  render() {
    return html`
      <label>${this.label}</label>
      <div class="color-row">
        <input type="color" .value=${this.value} @input=${this._onColorInput} />
        <input type="text" .value=${this.value} @change=${this._onTextChange} maxlength="7" />
      </div>
      ${this.swatches.length
        ? html`<div class="swatches">
            ${/* BrandColor.value is trusted brand-kit config */
            this.swatches.map(
              (s) => html`<button
                class="swatch"
                type="button"
                title=${`${s.name} (${s.value})`}
                aria-label=${s.name}
                style=${styleMap({ background: s.value })}
                @click=${() => this._applySwatch(s.value)}
              ></button>`,
            )}
          </div>`
        : ''}
    `;
  }

  private _applySwatch(value: string) {
    this.value = value;
    this._emitChange();
  }

  private _onColorInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this._emitChange();
  }

  private _onTextChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const val = input.value.trim();
    if (/^#[0-9a-fA-F]{3,6}$/.test(val)) {
      this.value = val;
      this._emitChange();
    }
  }

  private _emitChange() {
    this.dispatchEvent(new CustomEvent('color-change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-color-picker': PigeonColorPicker;
  }
}
