import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createRef, ref, type Ref } from 'lit/directives/ref.js';
import type { HtmlBlock, Spacing, MergeTag } from '@lit-pigeon/core';
import '../controls/spacing-input.js';
import '../../merge-tags/pigeon-merge-tag-picker.js';

@customElement('pigeon-html-panel')
export class PigeonHtmlPanel extends LitElement {
  @property({ type: Object })
  block!: HtmlBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  @property({ type: Array })
  mergeTags: MergeTag[] = [];

  @state() private _pickerOpen = false;
  @state() private _pickerX = 0;
  @state() private _pickerY = 0;

  private _textareaRef: Ref<HTMLTextAreaElement> = createRef();
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

    .label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
    }

    .label-row label {
      margin-bottom: 0;
    }

    textarea {
      width: 100%;
      min-height: 160px;
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

  render() {
    if (!this.block) return html``;
    const v = this.block.values;
    const hasTags = this.mergeTags.length > 0;

    return html`
      <h3>HTML Properties</h3>

      <div class="field">
        <div class="label-row">
          <label>Raw HTML</label>
          ${hasTags ? html`
            <button class="tag-btn" ${ref(this._triggerRef)} @click=${this._togglePicker} title="Insert merge tag">
              { } Tag
            </button>
          ` : ''}
        </div>
        <textarea
          ${ref(this._textareaRef)}
          .value=${v.content}
          @change=${this._onContentChange}
        ></textarea>
      </div>

      <pigeon-spacing-input
        label="Padding"
        .value=${v.padding}
        @spacing-change=${this._onPaddingChange}
      ></pigeon-spacing-input>

      ${hasTags ? html`
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
    this._emit({ content: (e.target as HTMLTextAreaElement).value });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
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
    const textarea = this._textareaRef.value;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const insertion = e.detail.tag.name;
    const newValue = value.substring(0, start) + insertion + value.substring(end);
    textarea.value = newValue;
    const newCursor = start + insertion.length;
    textarea.setSelectionRange(newCursor, newCursor);
    textarea.focus();
    this._emit({ content: newValue });
    this._pickerOpen = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-html-panel': PigeonHtmlPanel;
  }
}
