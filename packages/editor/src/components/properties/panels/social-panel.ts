import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SocialBlock, SocialIcon, Spacing } from '@lit-pigeon/core';
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

    h4 {
      margin: 0 0 8px;
      font-size: 12px;
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

    input:focus,
    select:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    .icon-item {
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
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
      border-radius: var(--pigeon-radius-sm, 4px);
    }

    .remove-btn:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .add-btn {
      width: 100%;
      height: 32px;
      border: 1px dashed var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      background: transparent;
      color: var(--pigeon-text-secondary, #64748b);
      cursor: pointer;
      font-family: var(--pigeon-font);
      font-size: 13px;
      margin-bottom: 12px;
    }

    .add-btn:hover {
      border-color: var(--pigeon-primary, #3b82f6);
      color: var(--pigeon-primary, #3b82f6);
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>Social Properties</h3>

      <h4>Icons</h4>
      ${v.icons.map((icon, index) => html`
        <div class="icon-item">
          <div class="icon-header">
            <label>Icon ${index + 1}</label>
            <button class="remove-btn" @click=${() => this._removeIcon(index)}>Remove</button>
          </div>
          <div class="field">
            <label>Network</label>
            <select @change=${(e: Event) => this._onIconTypeChange(index, e)}>
              ${ICON_TYPES.map(type => html`
                <option value=${type} ?selected=${icon.type === type}>${type}</option>
              `)}
            </select>
          </div>
          <div class="field">
            <label>URL</label>
            <input
              type="url"
              .value=${icon.href}
              placeholder="https://..."
              @change=${(e: Event) => this._onIconHrefChange(index, e)}
            />
          </div>
          ${icon.type === 'custom' ? html`
            <div class="field">
              <label>Icon URL</label>
              <input
                type="url"
                .value=${icon.iconUrl ?? ''}
                placeholder="https://.../icon.png"
                @change=${(e: Event) => this._onIconIconUrlChange(index, e)}
              />
            </div>
          ` : ''}
          <div class="field">
            <label>Label (alt text)</label>
            <input
              type="text"
              .value=${icon.label ?? ''}
              @change=${(e: Event) => this._onIconLabelChange(index, e)}
            />
          </div>
        </div>
      `)}

      <button class="add-btn" @click=${this._addIcon}>+ Add Icon</button>

      <pigeon-slider-input
        label="Icon Size"
        .value=${v.iconSize}
        min=${16}
        max=${64}
        step=${1}
        unit="px"
        @slider-change=${this._onIconSizeChange}
      ></pigeon-slider-input>

      <pigeon-slider-input
        label="Spacing"
        .value=${v.spacing}
        min=${0}
        max=${48}
        step=${1}
        unit="px"
        @slider-change=${this._onSpacingChange}
      ></pigeon-slider-input>

      <pigeon-alignment-picker
        label="Alignment"
        .value=${v.alignment}
        @alignment-change=${this._onAlignChange}
      ></pigeon-alignment-picker>

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
