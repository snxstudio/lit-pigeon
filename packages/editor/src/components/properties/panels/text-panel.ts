import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { TextBlock, Spacing } from '@lit-pigeon/core';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';

@customElement('pigeon-text-panel')
export class PigeonTextPanel extends LitElement {
  @property({ type: Object })
  block!: TextBlock;

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

    textarea {
      width: 100%;
      min-height: 120px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 8px;
      font-family: var(--pigeon-font-mono);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      resize: vertical;
      outline: none;
      box-sizing: border-box;
    }

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
      cursor: pointer;
    }

    select:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>Text Properties</h3>

      <div class="field">
        <label>Content (HTML)</label>
        <textarea
          .value=${v.content}
          @change=${this._onContentChange}
        ></textarea>
      </div>

      <pigeon-alignment-picker
        label="Text Align"
        .value=${v.textAlign}
        @alignment-change=${this._onAlignChange}
      ></pigeon-alignment-picker>

      <div class="field">
        <label>Line Height</label>
        <select .value=${v.lineHeight} @change=${this._onLineHeightChange}>
          <option value="1">1.0</option>
          <option value="1.25">1.25</option>
          <option value="1.5">1.5</option>
          <option value="1.75">1.75</option>
          <option value="2">2.0</option>
        </select>
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

  private _onContentChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this._emit({ content: textarea.value });
  }

  private _onAlignChange(e: CustomEvent<{ value: string }>) {
    this._emit({ textAlign: e.detail.value });
  }

  private _onLineHeightChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._emit({ lineHeight: select.value });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-text-panel': PigeonTextPanel;
  }
}
