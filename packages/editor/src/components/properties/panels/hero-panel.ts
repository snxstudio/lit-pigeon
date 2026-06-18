import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  BrandColor,
  HeroBlock,
  Spacing,
  AssetManagerConfig,
  AssetStorage,
} from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';
import '../controls/color-picker.js';
import '../../asset-manager/pigeon-asset-manager.js';
import { t } from '../../../i18n/index.js';

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

  @property({ attribute: false })
  assetStorage?: AssetStorage;

  @property({ attribute: false })
  swatches: BrandColor[] = [];

  @state()
  private _assetManagerOpen = false;

  static styles = [panelStyles];

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>${t('panel.hero.title')}</h3>

      <div class="field">
        <label>${t('panel.hero.backgroundUrl')}</label>
        <input
          type="url"
          .value=${v.backgroundUrl}
          placeholder=${t('panel.hero.backgroundUrlPlaceholder')}
          @change=${this._onBackgroundUrlChange}
        />
        <button
          style="margin-top:4px;height:28px;padding:0 12px;border:1px solid var(--pigeon-border,#e2e8f0);border-radius:4px;background:var(--pigeon-surface,#f8fafc);cursor:pointer;font-family:var(--pigeon-font);font-size:12px;font-weight:500;"
          @click=${() => this._assetManagerOpen = true}
        >${t('panel.common.uploadImage')}</button>
      </div>

      <pigeon-asset-manager
        ?open=${this._assetManagerOpen}
        .config=${this.assetManagerConfig ?? {}}
        .storage=${this.assetStorage}
        @asset-selected=${this._onBgAssetSelected}
      ></pigeon-asset-manager>

      <div class="field">
        <label>${t('panel.hero.backgroundPosition')}</label>
        <select @change=${this._onBackgroundPositionChange}>
          ${(['center center', 'top center', 'bottom center', 'left center', 'right center'] as const).map(
            pos => html`<option value=${pos} ?selected=${v.backgroundPosition === pos}>${pos}</option>`
          )}
        </select>
      </div>

      <div class="field">
        <label>${t('panel.hero.mode')}</label>
        <select @change=${this._onModeChange}>
          <option value="fluid-height" ?selected=${v.mode === 'fluid-height'}>${t('panel.hero.modeFluidHeight')}</option>
          <option value="fixed-height" ?selected=${v.mode === 'fixed-height'}>${t('panel.hero.modeFixedHeight')}</option>
        </select>
      </div>

      <pigeon-slider-input
        label=${t('panel.hero.height')}
        .value=${v.height}
        min=${100}
        max=${800}
        step=${10}
        unit="px"
        @slider-change=${this._onHeightChange}
      ></pigeon-slider-input>

      <pigeon-slider-input
        label=${t('panel.hero.width')}
        .value=${v.width}
        min=${200}
        max=${800}
        step=${10}
        unit="px"
        @slider-change=${this._onWidthChange}
      ></pigeon-slider-input>

      <div class="field">
        <label>${t('panel.hero.verticalAlign')}</label>
        <select @change=${this._onVerticalAlignChange}>
          <option value="top" ?selected=${v.verticalAlign === 'top'}>${t('panel.hero.verticalAlignTop')}</option>
          <option value="middle" ?selected=${v.verticalAlign === 'middle'}>${t('panel.hero.verticalAlignMiddle')}</option>
          <option value="bottom" ?selected=${v.verticalAlign === 'bottom'}>${t('panel.hero.verticalAlignBottom')}</option>
        </select>
      </div>

      <pigeon-color-picker
        label=${t('panel.common.backgroundColor')}
        .value=${v.backgroundColor}
        .swatches=${this.swatches}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <div class="field">
        <label>${t('panel.common.contentHtml')}</label>
        <textarea
          .value=${v.content}
          @change=${this._onContentChange}
        ></textarea>
      </div>

      <pigeon-spacing-input
        label=${t('panel.common.padding')}
        .value=${v.padding}
        @spacing-change=${this._onPaddingChange}
      ></pigeon-spacing-input>

      <pigeon-spacing-input
        label=${t('panel.common.innerPadding')}
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
