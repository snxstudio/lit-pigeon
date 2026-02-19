import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PigeonDocument } from '@lit-pigeon/core';
import '../controls/color-picker.js';
import '../controls/slider-input.js';

@customElement('pigeon-body-panel')
export class PigeonBodyPanel extends LitElement {
  @property({ type: Object })
  doc!: PigeonDocument;

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

    input[type='text'] {
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
      cursor: pointer;
    }

    .alignment-buttons {
      display: flex;
      gap: 0;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      overflow: hidden;
      width: fit-content;
    }

    .alignment-buttons button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px 16px;
      border: none;
      background: var(--pigeon-bg, #ffffff);
      cursor: pointer;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 12px;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .alignment-buttons button:not(:last-child) {
      border-right: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .alignment-buttons button:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
    }

    .alignment-buttons button.active {
      background: var(--pigeon-primary, #3b82f6);
      color: white;
    }
  `;

  private _fontFamilies = [
    'Arial, Helvetica, sans-serif',
    'Georgia, Times, serif',
    "'Courier New', Courier, monospace",
    'Verdana, Geneva, sans-serif',
    'Tahoma, Geneva, sans-serif',
    "'Trebuchet MS', sans-serif",
    "'Times New Roman', Times, serif",
  ];

  render() {
    if (!this.doc) return html``;
    const a = this.doc.body.attributes;

    return html`
      <h3>Email Body</h3>

      <pigeon-slider-input
        label="Content Width"
        .value=${a.width}
        min=${320}
        max=${960}
        step=${10}
        @slider-change=${this._onWidthChange}
      ></pigeon-slider-input>

      <pigeon-color-picker
        label="Background Color"
        .value=${a.backgroundColor}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <div class="field">
        <label>Font Family</label>
        <select @change=${this._onFontFamilyChange}>
          ${this._fontFamilies.map(font => html`
            <option value="${font}" ?selected=${a.fontFamily === font}>${font.split(',')[0].replace(/'/g, '')}</option>
          `)}
        </select>
      </div>

      <div class="field">
        <label>Content Alignment</label>
        <div class="alignment-buttons">
          <button
            class="${a.contentAlignment === 'left' ? 'active' : ''}"
            @click=${() => this._onAlignChange('left')}
          >Left</button>
          <button
            class="${a.contentAlignment === 'center' ? 'active' : ''}"
            @click=${() => this._onAlignChange('center')}
          >Center</button>
        </div>
      </div>

      <div class="field">
        <label>Email Name</label>
        <input
          type="text"
          .value=${this.doc.metadata.name}
          @change=${this._onNameChange}
        />
      </div>

      <div class="field">
        <label>Preview Text</label>
        <input
          type="text"
          .value=${this.doc.metadata.previewText ?? ''}
          placeholder="Email preview text..."
          @change=${this._onPreviewTextChange}
        />
      </div>
    `;
  }

  private _emit(detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent('body-property-change', {
      detail,
      bubbles: true,
      composed: true,
    }));
  }

  private _onWidthChange(e: CustomEvent<{ value: number }>) {
    this._emit({ attribute: 'width', value: e.detail.value });
  }

  private _onBgColorChange(e: CustomEvent<{ value: string }>) {
    this._emit({ attribute: 'backgroundColor', value: e.detail.value });
  }

  private _onFontFamilyChange(e: Event) {
    this._emit({ attribute: 'fontFamily', value: (e.target as HTMLSelectElement).value });
  }

  private _onAlignChange(align: 'left' | 'center') {
    this._emit({ attribute: 'contentAlignment', value: align });
  }

  private _onNameChange(e: Event) {
    this._emit({ metaField: 'name', value: (e.target as HTMLInputElement).value });
  }

  private _onPreviewTextChange(e: Event) {
    this._emit({ metaField: 'previewText', value: (e.target as HTMLInputElement).value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-body-panel': PigeonBodyPanel;
  }
}
