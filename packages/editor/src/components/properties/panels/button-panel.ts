import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ButtonBlock, Spacing } from '@lit-pigeon/core';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';
import '../controls/color-picker.js';

@customElement('pigeon-button-panel')
export class PigeonButtonPanel extends LitElement {
  @property({ type: Object })
  block!: ButtonBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  static styles = css`
    :host {
      display: block;
    }

    h3 {
      margin: 0 0 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--pigeon-text, #1e293b);
      font-family: var(--pigeon-font);
    }

    .field {
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

    input[type='text'],
    input[type='url'] {
      width: 100%;
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      outline: none;
      box-sizing: border-box;
    }

    input:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    select {
      width: 100%;
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      outline: none;
      box-sizing: border-box;
      cursor: pointer;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .toggle-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
    }

    .toggle {
      position: relative;
      width: 40px;
      height: 22px;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-track {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--pigeon-border, #e2e8f0);
      border-radius: 11px;
      transition: background 0.2s ease;
    }

    .toggle-track::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      left: 2px;
      top: 2px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s ease;
      box-shadow: var(--pigeon-shadow-sm);
    }

    .toggle input:checked + .toggle-track {
      background: var(--pigeon-primary, #3b82f6);
    }

    .toggle input:checked + .toggle-track::after {
      transform: translateX(18px);
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>Button Properties</h3>

      <div class="field">
        <label>Button Text</label>
        <input
          type="text"
          .value=${v.text}
          @change=${this._onTextChange}
        />
      </div>

      <div class="field">
        <label>Link URL</label>
        <input
          type="url"
          .value=${v.href}
          placeholder="https://example.com"
          @change=${this._onHrefChange}
        />
      </div>

      <pigeon-color-picker
        label="Background Color"
        .value=${v.backgroundColor}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <pigeon-color-picker
        label="Text Color"
        .value=${v.textColor}
        @color-change=${this._onTextColorChange}
      ></pigeon-color-picker>

      <pigeon-slider-input
        label="Border Radius"
        .value=${v.borderRadius}
        min=${0}
        max=${50}
        step=${1}
        @slider-change=${this._onBorderRadiusChange}
      ></pigeon-slider-input>

      <pigeon-slider-input
        label="Font Size"
        .value=${v.fontSize}
        min=${10}
        max=${36}
        step=${1}
        @slider-change=${this._onFontSizeChange}
      ></pigeon-slider-input>

      <div class="field">
        <label>Font Weight</label>
        <select .value=${v.fontWeight} @change=${this._onFontWeightChange}>
          <option value="400">Normal (400)</option>
          <option value="500">Medium (500)</option>
          <option value="600">Semibold (600)</option>
          <option value="700">Bold (700)</option>
        </select>
      </div>

      <pigeon-alignment-picker
        label="Alignment"
        .value=${v.alignment}
        @alignment-change=${this._onAlignChange}
      ></pigeon-alignment-picker>

      <div class="toggle-row">
        <span class="toggle-label">Full Width</span>
        <label class="toggle">
          <input
            type="checkbox"
            .checked=${v.fullWidth}
            @change=${this._onFullWidthChange}
          />
          <span class="toggle-track"></span>
        </label>
      </div>

      <pigeon-spacing-input
        label="Outer Padding"
        .value=${v.padding}
        @spacing-change=${this._onPaddingChange}
      ></pigeon-spacing-input>

      <pigeon-spacing-input
        label="Inner Padding"
        .value=${v.innerPadding}
        @spacing-change=${this._onInnerPaddingChange}
      ></pigeon-spacing-input>
    `;
  }

  private _emit(values: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent('property-change', {
      detail: {
        rowId: this.rowId,
        columnId: this.columnId,
        blockId: this.block.id,
        values,
      },
      bubbles: true,
      composed: true,
    }));
  }

  private _onTextChange(e: Event) {
    this._emit({ text: (e.target as HTMLInputElement).value });
  }

  private _onHrefChange(e: Event) {
    this._emit({ href: (e.target as HTMLInputElement).value });
  }

  private _onBgColorChange(e: CustomEvent<{ value: string }>) {
    this._emit({ backgroundColor: e.detail.value });
  }

  private _onTextColorChange(e: CustomEvent<{ value: string }>) {
    this._emit({ textColor: e.detail.value });
  }

  private _onBorderRadiusChange(e: CustomEvent<{ value: number }>) {
    this._emit({ borderRadius: e.detail.value });
  }

  private _onFontSizeChange(e: CustomEvent<{ value: number }>) {
    this._emit({ fontSize: e.detail.value });
  }

  private _onFontWeightChange(e: Event) {
    this._emit({ fontWeight: (e.target as HTMLSelectElement).value });
  }

  private _onAlignChange(e: CustomEvent<{ value: string }>) {
    this._emit({ alignment: e.detail.value });
  }

  private _onFullWidthChange(e: Event) {
    this._emit({ fullWidth: (e.target as HTMLInputElement).checked });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
  }

  private _onInnerPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ innerPadding: e.detail.value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-button-panel': PigeonButtonPanel;
  }
}
