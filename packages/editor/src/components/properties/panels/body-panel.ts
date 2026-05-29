import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref, type Ref } from 'lit/directives/ref.js';
import type { PigeonDocument, MergeTag } from '@lit-pigeon/core';
import '../controls/color-picker.js';
import '../controls/slider-input.js';
import '../../merge-tags/pigeon-merge-tag-picker.js';

@customElement('pigeon-body-panel')
export class PigeonBodyPanel extends LitElement {
  @property({ type: Object })
  doc!: PigeonDocument;

  @property({ type: Array })
  mergeTags: MergeTag[] = [];

  @state() private _pickerOpen = false;
  @state() private _pickerX = 0;
  @state() private _pickerY = 0;

  private _previewInputRef: Ref<HTMLInputElement> = createRef();
  private _triggerRef: Ref<HTMLButtonElement> = createRef();

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
      box-shadow: var(--pigeon-ring-shadow);
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
      color: var(--pigeon-primary-foreground, #ffffff);
    }

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .label-row label {
      margin-bottom: 0;
    }

    .tag-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 22px;
      padding: 0 8px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      background: var(--pigeon-surface, #f8fafc);
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.1s, color 0.1s, border-color 0.1s;
    }

    .tag-btn:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
      color: var(--pigeon-text, #1e293b);
      border-color: var(--pigeon-primary, #3b82f6);
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
        <div class="label-row">
          <label>Preview Text</label>
          ${this.mergeTags.length > 0 ? html`
            <button class="tag-btn" ${ref(this._triggerRef)} @click=${this._togglePicker} title="Insert merge tag">
              { } Tag
            </button>
          ` : ''}
        </div>
        <input
          type="text"
          ${ref(this._previewInputRef)}
          .value=${this.doc.metadata.previewText ?? ''}
          placeholder="Email preview text..."
          @change=${this._onPreviewTextChange}
        />
      </div>

      ${this.mergeTags.length > 0 ? html`
        <pigeon-merge-tag-picker
          ?open=${this._pickerOpen}
          .tags=${this.mergeTags}
          .x=${this._pickerX}
          .y=${this._pickerY}
          @merge-tag-insert=${this._onMergeTagInsert}
        ></pigeon-merge-tag-picker>
      ` : ''}
    `;
  }

  private _togglePicker() {
    const trigger = this._triggerRef.value;
    if (!trigger) return;
    if (!this._pickerOpen) {
      const rect = trigger.getBoundingClientRect();
      this._pickerX = Math.max(0, rect.right - 260);
      this._pickerY = rect.bottom + 4;
    }
    this._pickerOpen = !this._pickerOpen;
  }

  private _onMergeTagInsert(e: CustomEvent<{ tag: MergeTag }>) {
    const input = this._previewInputRef.value;
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const insertion = e.detail.tag.name;
    const newValue = input.value.substring(0, start) + insertion + input.value.substring(end);
    input.value = newValue;
    const newCursor = start + insertion.length;
    input.setSelectionRange(newCursor, newCursor);
    input.focus();
    this._emit({ metaField: 'previewText', value: newValue });
    this._pickerOpen = false;
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
