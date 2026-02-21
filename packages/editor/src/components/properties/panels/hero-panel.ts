import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HeroBlock, Spacing, AssetManagerConfig } from '@lit-pigeon/core';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';
import '../controls/color-picker.js';
import '../../asset-manager/pigeon-asset-manager.js';

@customElement('pigeon-hero-panel')
export class PigeonHeroPanel extends LitElement {
  @property({ type: Object })
  block!: HeroBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  @property({ type: Object })
  assetManagerConfig?: AssetManagerConfig;

  @state()
  private _assetManagerOpen = false;

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
    input[type='url'],
    textarea {
      width: 100%;
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

    input[type='text'],
    input[type='url'] {
      height: 32px;
    }

    textarea {
      padding: 8px;
      min-height: 80px;
      resize: vertical;
    }

    input:focus,
    textarea:focus {
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
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>Hero Properties</h3>

      <div class="field">
        <label>Background URL</label>
        <input
          type="url"
          .value=${v.backgroundUrl}
          placeholder="https://example.com/hero.jpg"
          @change=${this._onBackgroundUrlChange}
        />
        <button
          style="margin-top:4px;height:28px;padding:0 12px;border:1px solid var(--pigeon-border,#e2e8f0);border-radius:4px;background:var(--pigeon-surface,#f8fafc);cursor:pointer;font-family:var(--pigeon-font);font-size:12px;font-weight:500;"
          @click=${() => this._assetManagerOpen = true}
        >Upload Image</button>
      </div>

      <pigeon-asset-manager
        ?open=${this._assetManagerOpen}
        .config=${this.assetManagerConfig ?? {}}
        @asset-selected=${this._onBgAssetSelected}
      ></pigeon-asset-manager>

      <div class="field">
        <label>Background Position</label>
        <select @change=${this._onBackgroundPositionChange}>
          ${(['center center', 'top center', 'bottom center', 'left center', 'right center'] as const).map(
            pos => html`<option value=${pos} ?selected=${v.backgroundPosition === pos}>${pos}</option>`
          )}
        </select>
      </div>

      <div class="field">
        <label>Mode</label>
        <select @change=${this._onModeChange}>
          <option value="fluid-height" ?selected=${v.mode === 'fluid-height'}>Fluid Height</option>
          <option value="fixed-height" ?selected=${v.mode === 'fixed-height'}>Fixed Height</option>
        </select>
      </div>

      <pigeon-slider-input
        label="Height"
        .value=${v.height}
        min=${100}
        max=${800}
        step=${10}
        unit="px"
        @slider-change=${this._onHeightChange}
      ></pigeon-slider-input>

      <pigeon-slider-input
        label="Width"
        .value=${v.width}
        min=${200}
        max=${800}
        step=${10}
        unit="px"
        @slider-change=${this._onWidthChange}
      ></pigeon-slider-input>

      <div class="field">
        <label>Vertical Align</label>
        <select @change=${this._onVerticalAlignChange}>
          <option value="top" ?selected=${v.verticalAlign === 'top'}>Top</option>
          <option value="middle" ?selected=${v.verticalAlign === 'middle'}>Middle</option>
          <option value="bottom" ?selected=${v.verticalAlign === 'bottom'}>Bottom</option>
        </select>
      </div>

      <pigeon-color-picker
        label="Background Color"
        .value=${v.backgroundColor}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <div class="field">
        <label>Content (HTML)</label>
        <textarea
          .value=${v.content}
          @change=${this._onContentChange}
        ></textarea>
      </div>

      <pigeon-spacing-input
        label="Padding"
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

  private _onBackgroundUrlChange(e: Event) {
    this._emit({ backgroundUrl: (e.target as HTMLInputElement).value });
  }

  private _onBackgroundPositionChange(e: Event) {
    this._emit({ backgroundPosition: (e.target as HTMLSelectElement).value });
  }

  private _onModeChange(e: Event) {
    this._emit({ mode: (e.target as HTMLSelectElement).value });
  }

  private _onHeightChange(e: CustomEvent<{ value: number }>) {
    this._emit({ height: e.detail.value });
  }

  private _onWidthChange(e: CustomEvent<{ value: number }>) {
    this._emit({ width: e.detail.value });
  }

  private _onVerticalAlignChange(e: Event) {
    this._emit({ verticalAlign: (e.target as HTMLSelectElement).value });
  }

  private _onBgColorChange(e: CustomEvent<{ value: string }>) {
    this._emit({ backgroundColor: e.detail.value });
  }

  private _onContentChange(e: Event) {
    this._emit({ content: (e.target as HTMLTextAreaElement).value });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
  }

  private _onInnerPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ innerPadding: e.detail.value });
  }

  private _onBgAssetSelected(e: CustomEvent<{ url: string }>) {
    this._emit({ backgroundUrl: e.detail.url });
    this._assetManagerOpen = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-hero-panel': PigeonHeroPanel;
  }
}
