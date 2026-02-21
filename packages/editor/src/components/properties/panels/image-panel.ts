import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ImageBlock, Spacing, AssetManagerConfig } from '@lit-pigeon/core';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';
import '../../asset-manager/pigeon-asset-manager.js';

@customElement('pigeon-image-panel')
export class PigeonImagePanel extends LitElement {
  @property({ type: Object })
  block!: ImageBlock;

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

    .upload-btn {
      height: 28px;
      padding: 0 12px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      background: var(--pigeon-surface, #f8fafc);
      color: var(--pigeon-text, #1e293b);
      cursor: pointer;
      font-family: var(--pigeon-font);
      font-size: 12px;
      font-weight: 500;
      margin-top: 4px;
    }

    .upload-btn:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
      border-color: var(--pigeon-primary, #3b82f6);
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const widthVal = v.width === 'auto' ? 0 : v.width;

    return html`
      <h3>Image Properties</h3>

      <div class="field">
        <label>Image URL</label>
        <input
          type="url"
          .value=${v.src}
          placeholder="https://example.com/image.jpg"
          @change=${this._onSrcChange}
        />
        <button class="upload-btn" @click=${this._openAssetManager}>Upload Image</button>
      </div>

      <pigeon-asset-manager
        ?open=${this._assetManagerOpen}
        .config=${this.assetManagerConfig ?? {}}
        @asset-selected=${this._onAssetSelected}
      ></pigeon-asset-manager>

      <div class="field">
        <label>Alt Text</label>
        <input
          type="text"
          .value=${v.alt}
          placeholder="Image description"
          @change=${this._onAltChange}
        />
      </div>

      <pigeon-slider-input
        label="Width"
        .value=${widthVal as number}
        min=${0}
        max=${800}
        step=${1}
        unit="px (0 = auto)"
        @slider-change=${this._onWidthChange}
      ></pigeon-slider-input>

      <pigeon-alignment-picker
        label="Alignment"
        .value=${v.alignment}
        @alignment-change=${this._onAlignChange}
      ></pigeon-alignment-picker>

      <pigeon-slider-input
        label="Border Radius"
        .value=${v.borderRadius ?? 0}
        min=${0}
        max=${100}
        step=${1}
        @slider-change=${this._onBorderRadiusChange}
      ></pigeon-slider-input>

      <div class="field">
        <label>Link URL</label>
        <input
          type="url"
          .value=${v.href ?? ''}
          placeholder="https://example.com"
          @change=${this._onHrefChange}
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

  private _onSrcChange(e: Event) {
    this._emit({ src: (e.target as HTMLInputElement).value });
  }

  private _onAltChange(e: Event) {
    this._emit({ alt: (e.target as HTMLInputElement).value });
  }

  private _onWidthChange(e: CustomEvent<{ value: number }>) {
    this._emit({ width: e.detail.value === 0 ? 'auto' : e.detail.value });
  }

  private _onAlignChange(e: CustomEvent<{ value: string }>) {
    this._emit({ alignment: e.detail.value });
  }

  private _onBorderRadiusChange(e: CustomEvent<{ value: number }>) {
    this._emit({ borderRadius: e.detail.value });
  }

  private _onHrefChange(e: Event) {
    this._emit({ href: (e.target as HTMLInputElement).value });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
  }

  private _openAssetManager() {
    this._assetManagerOpen = true;
  }

  private _onAssetSelected(e: CustomEvent<{ url: string }>) {
    this._emit({ src: e.detail.url });
    this._assetManagerOpen = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-image-panel': PigeonImagePanel;
  }
}
