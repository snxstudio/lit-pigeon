import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { DividerBlock, Spacing } from '@lit-pigeon/core';
import '../controls/color-picker.js';
import '../controls/slider-input.js';
import '../controls/spacing-input.js';

@customElement('pigeon-divider-panel')
export class PigeonDividerPanel extends LitElement {
  @property({ type: Object })
  block!: DividerBlock;

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

    select,
    input[type='text'] {
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

    select:focus,
    input:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>Divider Properties</h3>

      <div class="field">
        <label>Style</label>
        <select @change=${this._onStyleChange}>
          <option value="solid" ?selected=${v.borderStyle === 'solid'}>Solid</option>
          <option value="dashed" ?selected=${v.borderStyle === 'dashed'}>Dashed</option>
          <option value="dotted" ?selected=${v.borderStyle === 'dotted'}>Dotted</option>
        </select>
      </div>

      <pigeon-color-picker
        label="Color"
        .value=${v.borderColor}
        @color-change=${this._onColorChange}
      ></pigeon-color-picker>

      <pigeon-slider-input
        label="Width"
        .value=${v.borderWidth}
        min=${1}
        max=${10}
        step=${1}
        unit="px"
        @slider-change=${this._onBorderWidthChange}
      ></pigeon-slider-input>

      <div class="field">
        <label>Line Width</label>
        <input
          type="text"
          .value=${v.width}
          placeholder="100% or 200px"
          @change=${this._onWidthChange}
        />
      </div>

      <pigeon-spacing-input
        label="Padding"
        .value=${v.padding}
        @spacing-change=${this._onPaddingChange}
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

  private _onStyleChange(e: Event) {
    this._emit({ borderStyle: (e.target as HTMLSelectElement).value });
  }

  private _onColorChange(e: CustomEvent<{ value: string }>) {
    this._emit({ borderColor: e.detail.value });
  }

  private _onBorderWidthChange(e: CustomEvent<{ value: number }>) {
    this._emit({ borderWidth: e.detail.value });
  }

  private _onWidthChange(e: Event) {
    this._emit({ width: (e.target as HTMLInputElement).value });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-divider-panel': PigeonDividerPanel;
  }
}
