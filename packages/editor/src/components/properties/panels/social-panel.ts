import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SocialBlock, SocialIcon, Spacing } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import { t } from '../../../i18n/index.js';
import '../controls/alignment-picker.js';
import '../controls/slider-input.js';
import '../controls/spacing-input.js';

const ICON_TYPES: SocialIcon['type'][] = [
  'facebook',
  'twitter',
  'instagram',
  'linkedin',
  'youtube',
  'tiktok',
  'custom',
];

@customElement('pigeon-social-panel')
export class PigeonSocialPanel extends LitElement {
  @property({ type: Object })
  block!: SocialBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  static styles = [
    panelStyles,
    css`
      h4 {
        margin: 0 0 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--pigeon-text, #1e293b);
        font-family: var(--pigeon-font);
      }

      .icon-item {
        border: 1px solid var(--pigeon-border, #e2e8f0);
        border-radius: var(--pigeon-radius-sm, 6px);
        padding: 8px;
        margin-bottom: 8px;
      }

      .icon-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .remove-btn {
        background: none;
        border: none;
        color: var(--pigeon-danger, #ef4444);
        cursor: pointer;
        font-size: 12px;
        font-family: var(--pigeon-font);
        padding: 2px 6px;
        border-radius: var(--pigeon-radius-sm, 6px);
      }

      .remove-btn:hover {
        background: color-mix(in srgb, var(--pigeon-danger) 10%, transparent);
      }

      .add-btn {
        width: 100%;
        height: 36px;
        border: 1px dashed var(--pigeon-border, #e2e8f0);
        border-radius: var(--pigeon-radius-sm, 6px);
        background: transparent;
        color: var(--pigeon-text-secondary, #64748b);
        cursor: pointer;
        font-family: var(--pigeon-font);
        font-size: 13px;
        margin-bottom: 14px;
        transition: border-color 0.15s ease, color 0.15s ease;
      }

      .add-btn:hover {
        border-color: var(--pigeon-primary, #4f46e5);
        color: var(--pigeon-primary, #4f46e5);
      }
    `,
  ];

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>${t('panel.social.title')}</h3>

      <h4>${t('panel.social.icons')}</h4>
      ${v.icons.map((icon, index) => html`
        <div class="icon-item">
          <div class="icon-header">
            <label>${t('panel.social.iconLabel')} ${index + 1}</label>
            <button class="remove-btn" @click=${() => this._removeIcon(index)}>${t('panel.social.removeIcon')}</button>
          </div>
          <div class="field">
            <label>${t('panel.social.network')}</label>
            <select @change=${(e: Event) => this._onIconTypeChange(index, e)}>
              ${ICON_TYPES.map(type => html`
                <option value=${type} ?selected=${icon.type === type}>${type}</option>
              `)}
            </select>
          </div>
          <div class="field">
            <label>${t('panel.social.url')}</label>
            <input
              type="url"
              .value=${icon.href}
              placeholder="https://..."
              @change=${(e: Event) => this._onIconHrefChange(index, e)}
            />
          </div>
          ${icon.type === 'custom' ? html`
            <div class="field">
              <label>${t('panel.social.iconUrl')}</label>
              <input
                type="url"
                .value=${icon.iconUrl ?? ''}
                placeholder="https://.../icon.png"
                @change=${(e: Event) => this._onIconIconUrlChange(index, e)}
              />
            </div>
          ` : ''}
          <div class="field">
            <label>${t('panel.social.altText')}</label>
            <input
              type="text"
              .value=${icon.label ?? ''}
              @change=${(e: Event) => this._onIconLabelChange(index, e)}
            />
          </div>
        </div>
      `)}

      <button class="add-btn" @click=${this._addIcon}>${t('panel.social.addIcon')}</button>

      <pigeon-slider-input
        label=${t('panel.social.iconSize')}
        .value=${v.iconSize}
        min=${16}
        max=${64}
        step=${1}
        unit="px"
        @slider-change=${this._onIconSizeChange}
      ></pigeon-slider-input>

      <pigeon-slider-input
        label=${t('panel.social.spacing')}
        .value=${v.spacing}
        min=${0}
        max=${48}
        step=${1}
        unit="px"
        @slider-change=${this._onSpacingChange}
      ></pigeon-slider-input>

      <pigeon-alignment-picker
        label=${t('panel.common.alignment')}
        .value=${v.alignment}
        @alignment-change=${this._onAlignChange}
      ></pigeon-alignment-picker>

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

  private _updateIcons(updater: (icons: SocialIcon[]) => SocialIcon[]) {
    this._emit({ icons: updater(this.block.values.icons) });
  }

  private _addIcon() {
    this._updateIcons(icons => [
      ...icons,
      { type: 'facebook', href: 'https://facebook.com/', label: 'Facebook' },
    ]);
  }

  private _removeIcon(index: number) {
    this._updateIcons(icons => icons.filter((_, i) => i !== index));
  }

  private _onIconTypeChange(index: number, e: Event) {
    const type = (e.target as HTMLSelectElement).value as SocialIcon['type'];
    this._updateIcons(icons => icons.map((icon, i) => i === index ? { ...icon, type } : icon));
  }

  private _onIconHrefChange(index: number, e: Event) {
    const href = (e.target as HTMLInputElement).value;
    this._updateIcons(icons => icons.map((icon, i) => i === index ? { ...icon, href } : icon));
  }

  private _onIconIconUrlChange(index: number, e: Event) {
    const iconUrl = (e.target as HTMLInputElement).value;
    this._updateIcons(icons => icons.map((icon, i) => i === index ? { ...icon, iconUrl } : icon));
  }

  private _onIconLabelChange(index: number, e: Event) {
    const label = (e.target as HTMLInputElement).value;
    this._updateIcons(icons => icons.map((icon, i) => i === index ? { ...icon, label } : icon));
  }

  private _onIconSizeChange(e: CustomEvent<{ value: number }>) {
    this._emit({ iconSize: e.detail.value });
  }

  private _onSpacingChange(e: CustomEvent<{ value: number }>) {
    this._emit({ spacing: e.detail.value });
  }

  private _onAlignChange(e: CustomEvent<{ value: string }>) {
    this._emit({ alignment: e.detail.value });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-social-panel': PigeonSocialPanel;
  }
}
