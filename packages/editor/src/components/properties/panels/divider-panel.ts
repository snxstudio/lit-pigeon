import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { BrandColor, DividerBlock, Spacing } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
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

  @property({ attribute: false })
  swatches: BrandColor[] = [];

  static styles = panelStyles;

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
        .swatches=${this.swatches}
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
