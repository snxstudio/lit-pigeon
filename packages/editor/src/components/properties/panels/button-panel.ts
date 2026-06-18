import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { BrandColor, ButtonBlock, LinkType, Spacing } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';
import '../controls/color-picker.js';
import '../controls/pigeon-link-type-picker.js';

@customElement('pigeon-button-panel')
export class PigeonButtonPanel extends LitElement {
  @property({ type: Object })
  block!: ButtonBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  @property({ attribute: false })
  swatches: BrandColor[] = [];

  @property({ attribute: false })
  linkTypes: LinkType[] = [];

  static styles = panelStyles;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>Button Properties</h3>

      <div class="field">
        <label>Button Text</label>
        <input
          type="text"
          .value=${this._contentToText(v.content)}
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

      <pigeon-link-type-picker
        .linkTypes=${this.linkTypes}
        @link-type-select=${this._onLinkTypeSelect}
      ></pigeon-link-type-picker>

      <pigeon-color-picker
        label="Background Color"
        .value=${v.backgroundColor}
        .swatches=${this.swatches}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <pigeon-color-picker
        label="Text Color"
        .value=${v.textColor}
        .swatches=${this.swatches}
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

      <pigeon-rich-text-format></pigeon-rich-text-format>
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
    const raw = (e.target as HTMLInputElement).value;
    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    this._emit({ content: `<p>${escaped}</p>` });
  }

  private _contentToText(content: string): string {
    // Strip a single wrapping <p> and any other HTML tags, then unescape
    // the common entities we ourselves emit. Good enough until inline
    // rich-text editing lands and this panel grows real format controls.
    return content
      .replace(/^\s*<p>([\s\S]*?)<\/p>\s*$/i, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  private _onHrefChange(e: Event) {
    this._emit({ href: (e.target as HTMLInputElement).value });
  }

  private _onLinkTypeSelect(e: CustomEvent<{ href: string }>) {
    this._emit({ href: e.detail.href });
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
