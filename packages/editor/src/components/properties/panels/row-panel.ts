import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RowNode, Spacing } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import { t } from '../../../i18n/index.js';
import '../controls/color-picker.js';
import '../controls/spacing-input.js';

@customElement('pigeon-row-panel')
export class PigeonRowPanel extends LitElement {
  @property({ type: Object })
  row!: RowNode;

  static styles = [
    panelStyles,
    css`
      .hint {
        margin: 4px 0 0;
        font-size: 11px;
        line-height: 1.4;
        color: var(--pigeon-muted-foreground, #64748b);
        font-family: var(--pigeon-font);
      }

      .hint code {
        font-family: var(--pigeon-font-mono);
        font-size: 10px;
        background: var(--pigeon-muted, #f1f5f9);
        padding: 1px 4px;
        border-radius: 3px;
      }

      .section-label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: var(--pigeon-text-secondary, #64748b);
        margin-bottom: 8px;
        font-family: var(--pigeon-font);
      }

      .layout-presets {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 16px;
      }

      .layout-preset {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        height: 36px;
        border: 1px solid var(--pigeon-border, #e2e8f0);
        border-radius: var(--pigeon-radius-sm, 6px);
        cursor: pointer;
        background: var(--pigeon-bg, #ffffff);
        transition: border-color 0.15s ease, background 0.15s ease;
        padding: 4px;
      }

      .layout-preset:hover {
        border-color: var(--pigeon-primary, #4f46e5);
        background: var(--pigeon-surface, #f8fafc);
      }

      .layout-preset.active {
        border-color: var(--pigeon-primary, #4f46e5);
        background: color-mix(in srgb, var(--pigeon-primary) 8%, transparent);
      }

      .col-bar {
        background: var(--pigeon-primary, #4f46e5);
        height: 20px;
        border-radius: 2px;
        opacity: 0.6;
      }

      .layout-preset.active .col-bar {
        opacity: 1;
      }
    `,
  ];

  private get _layouts() {
    return [
      { label: t('panel.row.layout1col'), ratios: [12] },
      { label: t('panel.row.layout2col'), ratios: [6, 6] },
      { label: t('panel.row.layout3col'), ratios: [4, 4, 4] },
      { label: t('panel.row.layout4col'), ratios: [3, 3, 3, 3] },
    ];
  }

  render() {
    if (!this.row) return html``;
    const a = this.row.attributes;
    const currentRatiosStr = this.row.columnRatios.join(',');

    return html`
      <h3>${t('panel.row.title')}</h3>

      <span class="section-label">${t('panel.row.columnLayout')}</span>
      <div class="layout-presets">
        ${this._layouts.map(layout => {
          const active = layout.ratios.join(',') === currentRatiosStr;
          return html`
            <div
              class="layout-preset ${active ? 'active' : ''}"
              title="${layout.label}"
              @click=${() => this._onLayoutSelect(layout.ratios)}
            >
              ${layout.ratios.map(r => html`<div class="col-bar" style="flex: ${r};"></div>`)}
            </div>
          `;
        })}
      </div>

      <pigeon-color-picker
        label=${t('panel.common.backgroundColor')}
        .value=${a.backgroundColor ?? '#ffffff'}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <div class="field">
        <label>${t('panel.row.backgroundImageUrl')}</label>
        <input
          type="url"
          .value=${a.backgroundImage ?? ''}
          placeholder="https://example.com/bg.jpg"
          @change=${this._onBgImageChange}
        />
      </div>

      <div class="toggle-row">
        <span class="toggle-label">${t('panel.row.fullWidth')}</span>
        <label class="toggle">
          <input
            type="checkbox"
            .checked=${a.fullWidth}
            @change=${this._onFullWidthChange}
          />
          <span class="toggle-track"></span>
        </label>
      </div>

      <pigeon-spacing-input
        label=${t('panel.common.padding')}
        .value=${a.padding}
        @spacing-change=${this._onPaddingChange}
      ></pigeon-spacing-input>

      <div class="field">
        <label for="row-condition">${t('panel.row.displayCondition')}</label>
        <input
          id="row-condition"
          type="text"
          .value=${a.condition ?? ''}
          placeholder="e.g. user.premium"
          @change=${this._onConditionChange}
        />
        <p class="hint">
          Show this row only when the expression is truthy. Exported as
          <code>{{#if …}}</code> for your sending platform.
        </p>
      </div>
    `;
  }

  private _emitRowUpdate(attributes: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent('row-property-change', {
      detail: {
        rowId: this.row.id,
        attributes,
      },
      bubbles: true,
      composed: true,
    }));
  }

  private _onLayoutSelect(ratios: number[]) {
    this.dispatchEvent(new CustomEvent('row-layout-change', {
      detail: {
        rowId: this.row.id,
        ratios,
        columnCount: ratios.length,
      },
      bubbles: true,
      composed: true,
    }));
  }

  private _onBgColorChange(e: CustomEvent<{ value: string }>) {
    this._emitRowUpdate({ backgroundColor: e.detail.value });
  }

  private _onBgImageChange(e: Event) {
    this._emitRowUpdate({ backgroundImage: (e.target as HTMLInputElement).value });
  }

  private _onFullWidthChange(e: Event) {
    this._emitRowUpdate({ fullWidth: (e.target as HTMLInputElement).checked });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emitRowUpdate({ padding: e.detail.value });
  }

  private _onConditionChange(e: Event) {
    const value = (e.target as HTMLInputElement).value.trim();
    // Store undefined (not "") when cleared so the renderer skips the wrapper.
    this._emitRowUpdate({ condition: value || undefined });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-row-panel': PigeonRowPanel;
  }
}
