import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  ImageBlock,
  Spacing,
  AssetManagerConfig,
  AssetStorage,
} from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';
import '../../asset-manager/pigeon-asset-manager.js';
import { t } from '../../../i18n/index.js';

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

  @property({ attribute: false })
  assetStorage?: AssetStorage;

  @state()
  private _assetManagerOpen = false;

  static styles = [
    panelStyles,
    css`
    .upload-btn {
      margin-top: 6px;
    }
  `,
  ];

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const widthVal = v.width === 'auto' ? 0 : v.width;

    const uploadEnabled = this.assetManagerConfig?.enabled !== false;

    return html`
      <h3>${t('panel.image.title')}</h3>

      <div class="field">
        <label>${t('panel.image.imageUrl')}</label>
        <input
          type="url"
          .value=${v.src}
          placeholder=${t('panel.image.urlPlaceholder')}
          @change=${this._onSrcChange}
        />
        ${uploadEnabled
          ? html`<button class="btn-secondary upload-btn" @click=${this._openAssetManager}>${t('panel.common.uploadImage')}</button>`
          : ''}
      </div>

      ${uploadEnabled
        ? html`<pigeon-asset-manager
            ?open=${this._assetManagerOpen}
            .config=${this.assetManagerConfig ?? {}}
            .storage=${this.assetStorage}
            @asset-selected=${this._onAssetSelected}
          ></pigeon-asset-manager>`
        : ''}

      <div class="field">
        <label>${t('panel.image.altText')}</label>
        <input
          type="text"
          .value=${v.alt}
          placeholder=${t('panel.image.altPlaceholder')}
          @change=${this._onAltChange}
        />
      </div>

      <pigeon-slider-input
        label=${t('panel.image.width')}
        .value=${widthVal as number}
        min=${0}
        max=${800}
        step=${1}
        unit="px"
        @slider-change=${this._onWidthChange}
      ></pigeon-slider-input>

      <pigeon-alignment-picker
        label=${t('panel.common.alignment')}
        .value=${v.alignment}
        @alignment-change=${this._onAlignChange}
      ></pigeon-alignment-picker>

      <pigeon-slider-input
        label=${t('panel.common.borderRadius')}
        .value=${v.borderRadius ?? 0}
        min=${0}
        max=${100}
        step=${1}
        @slider-change=${this._onBorderRadiusChange}
      ></pigeon-slider-input>

      <div class="field">
        <label>${t('panel.common.linkUrl')}</label>
        <input
          type="url"
          .value=${v.href ?? ''}
          placeholder=${t('panel.common.urlPlaceholder')}
          @change=${this._onHrefChange}
        />
      </div>

      <pigeon-spacing-input
        label=${t('panel.common.padding')}
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
