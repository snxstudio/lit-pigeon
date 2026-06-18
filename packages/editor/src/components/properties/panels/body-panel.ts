import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref, type Ref } from 'lit/directives/ref.js';
import type { PigeonDocument, MergeTag, BrandColor, FontDefinition } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import '../controls/color-picker.js';
import '../controls/font-picker.js';
import '../controls/slider-input.js';
import '../../merge-tags/pigeon-merge-tag-picker.js';
import { t } from '../../../i18n/index.js';

@customElement('pigeon-body-panel')
export class PigeonBodyPanel extends LitElement {
  @property({ type: Object })
  doc!: PigeonDocument;

  @property({ type: Array })
  mergeTags: MergeTag[] = [];

  @property({ attribute: false })
  swatches: BrandColor[] = [];

  @property({ attribute: false })
  brandFonts: FontDefinition[] = [];

  @state() private _pickerOpen = false;
  @state() private _pickerX = 0;
  @state() private _pickerY = 0;

  private _previewInputRef: Ref<HTMLInputElement> = createRef();
  private _triggerRef: Ref<HTMLButtonElement> = createRef();

  static styles = [
    panelStyles,
    css`
      .alignment-buttons {
        display: flex;
        gap: 0;
        border: 1px solid var(--pigeon-border, #e2e8f0);
        border-radius: var(--pigeon-radius-sm, 6px);
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
        background: var(--pigeon-primary, #4f46e5);
        color: var(--pigeon-primary-foreground, #ffffff);
      }

      .label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
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
        border-radius: var(--pigeon-radius-sm, 6px);
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
        border-color: var(--pigeon-primary, #4f46e5);
      }
    `,
  ];

  render() {
    if (!this.doc) return html``;
    const a = this.doc.body.attributes;

    return html`
      <h3>${t('panel.body.title')}</h3>

      <pigeon-slider-input
        label=${t('panel.body.contentWidth')}
        .value=${a.width}
        min=${320}
        max=${960}
        step=${10}
        @slider-change=${this._onWidthChange}
      ></pigeon-slider-input>

      <pigeon-color-picker
        label=${t('panel.common.backgroundColor')}
        .value=${a.backgroundColor}
        .swatches=${this.swatches}
        @color-change=${this._onBgColorChange}
      ></pigeon-color-picker>

      <pigeon-font-picker
        label=${t('panel.body.fontFamily')}
        .value=${a.fontFamily}
        .brandFonts=${this.brandFonts}
        @font-change=${this._onFontFamilyChange}
      ></pigeon-font-picker>

      <div class="field">
        <label>${t('panel.body.contentAlignment')}</label>
        <div class="alignment-buttons">
          <button
            class="${a.contentAlignment === 'left' ? 'active' : ''}"
            @click=${() => this._onAlignChange('left')}
          >${t('panel.common.left')}</button>
          <button
            class="${a.contentAlignment === 'center' ? 'active' : ''}"
            @click=${() => this._onAlignChange('center')}
          >${t('panel.common.center')}</button>
        </div>
      </div>

      <div class="field">
        <label>${t('panel.body.emailName')}</label>
        <input
          type="text"
          .value=${this.doc.metadata.name}
          @change=${this._onNameChange}
        />
      </div>

      <div class="field">
        <div class="label-row">
          <label>${t('panel.body.previewText')}</label>
          ${this.mergeTags.length > 0 ? html`
            <button class="tag-btn" ${ref(this._triggerRef)} @click=${this._togglePicker} title=${t('panel.common.insertMergeTag')}>
              ${t('panel.common.tagBtn')}
            </button>
          ` : ''}
        </div>
        <input
          type="text"
          ${ref(this._previewInputRef)}
          .value=${this.doc.metadata.previewText ?? ''}
          placeholder=${t('panel.body.previewTextPlaceholder')}
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

  private _onFontFamilyChange(e: CustomEvent<{ value: string }>) {
    this._emit({ attribute: 'fontFamily', value: e.detail.value });
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
