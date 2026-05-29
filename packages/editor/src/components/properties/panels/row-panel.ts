import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { RowNode, Spacing } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
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

        .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .toggle-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--pigeon-text-secondary, #64748b);
        font-family: var(--pigeon-font);
      }

      .toggle {
        position: relative;
        width: 40px;
        height: 22px;
      }

      .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .toggle-track {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--pigeon-border, #e2e8f0);
        border-radius: 11px;
        transition: background 0.2s ease;
      }

      .toggle-track::after {
        content: '';
        position: absolute;
        width: 18px;
        height: 18px;
        left: 2px;
        top: 2px;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s ease;
        box-shadow: var(--pigeon-shadow-sm);
      }

      .toggle input:checked + .toggle-track {
        background: var(--pigeon-primary, #4f46e5);
      }

      .toggle input:checked + .toggle-track::after {
        transform: translateX(18px);
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

  private _layouts = [
    { label: '1 Column', ratios: [12] },
    { label: '2 Equal', ratios: [6, 6] },
    { label: '3 Equal', ratios: [4, 4, 4] },
    { label: '4 Equal', ratios: [3, 3, 3, 3] },
  ];

  render() {
    if (!this.row) return html``;
    const a = this.row.attributes;
    const currentRatiosStr = this.row.columnRatios.join(',');

    return html`
      <h3>Row Properties</h3>

      <span class="section-label">Column Layout</span>
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
        label="Background Color"
        .value=${a.backgroundColor ?? '#ffffff'}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <div class="field">
        <label>Background Image URL</label>
        <input
          type="url"
          .value=${a.backgroundImage ?? ''}
          placeholder="https://example.com/bg.jpg"
          @change=${this._onBgImageChange}
        />
      </div>

      <div class="toggle-row">
        <span class="toggle-label">Full Width</span>
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
        label="Padding"
        .value=${a.padding}
        @spacing-change=${this._onPaddingChange}
      ></pigeon-spacing-input>

      <div class="field">
        <label for="row-condition">Display condition</label>
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
