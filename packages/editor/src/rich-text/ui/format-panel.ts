import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { Editor } from '@tiptap/core';
import { richTextController } from '../controller.js';

const FONT_FAMILIES = [
  '', // default
  'Inter, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  '"Times New Roman", serif',
  '"Courier New", monospace',
];

const FONT_SIZES = ['', '10px', '12px', '14px', '16px', '18px', '24px', '32px', '48px'];

/**
 * Format controls (block format / lists / color / font family / font size)
 * rendered inside text/hero/button property panels. Auto-binds to the
 * controller-active rich-text editor and disables when none is active.
 */
@customElement('pigeon-rich-text-format')
export class PigeonRichTextFormat extends LitElement {
  @state() private _editor: Editor | null = null;
  @state() private _color = '#000000';
  @state() private _fontFamily = '';
  @state() private _fontSize = '';
  @state() private _heading = '';
  @state() private _activeBullet = false;
  @state() private _activeNumber = false;

  private _unsubscribe: (() => void) | null = null;
  private _onSelectionUpdate = () => this._syncFromEditor();

  static styles = css`
    :host {
      display: block;
    }

    .section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .section[hidden] {
      display: none;
    }

    h4 {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 600;
      color: var(--pigeon-text, #1e293b);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-family: var(--pigeon-font);
    }

    .row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .row select,
    .row input[type='color'] {
      flex: 1;
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      background: var(--pigeon-bg, #ffffff);
      outline: none;
      box-sizing: border-box;
      cursor: pointer;
    }

    .row input[type='color'] {
      padding: 2px;
    }

    .toggle-row {
      display: flex;
      gap: 6px;
    }

    .toggle-btn {
      flex: 1;
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      background: var(--pigeon-bg, #ffffff);
      color: var(--pigeon-text, #1e293b);
      border-radius: var(--pigeon-radius-sm, 4px);
      font-family: var(--pigeon-font);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }

    .toggle-btn[data-active] {
      background: var(--pigeon-primary, #3b82f6);
      color: var(--pigeon-primary-foreground, #ffffff);
      border-color: var(--pigeon-primary, #3b82f6);
    }

    label {
      display: block;
      font-size: 11px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
      margin-bottom: 4px;
      font-family: var(--pigeon-font);
    }

    .field {
      margin-bottom: 8px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = richTextController.subscribe((editor) => this._bind(editor));
    this._bind(richTextController.getActive());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = null;
    this._bind(null);
  }

  render() {
    const enabled = this._editor !== null;
    return html`
      <div class="section" ?hidden=${!enabled}>
        <h4>Format</h4>

        <div class="field">
          <label>Block</label>
          <div class="row">
            <select .value=${this._heading} @change=${this._onHeadingChange}>
              <option value="">Paragraph</option>
              <option value="1">Heading 1</option>
              <option value="2">Heading 2</option>
              <option value="3">Heading 3</option>
              <option value="blockquote">Blockquote</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>List</label>
          <div class="toggle-row">
            <button class="toggle-btn" ?data-active=${this._activeBullet} @click=${this._onToggleBullet}>• Bullet</button>
            <button class="toggle-btn" ?data-active=${this._activeNumber} @click=${this._onToggleNumber}>1. Numbered</button>
          </div>
        </div>

        <div class="field">
          <label>Text color</label>
          <div class="row">
            <input type="color" .value=${this._color} @input=${this._onColorChange} />
          </div>
        </div>

        <div class="field">
          <label>Font family</label>
          <div class="row">
            <select .value=${this._fontFamily} @change=${this._onFontFamilyChange}>
              ${FONT_FAMILIES.map((f) => html`<option value=${f}>${f || 'Default'}</option>`)}
            </select>
          </div>
        </div>

        <div class="field">
          <label>Font size</label>
          <div class="row">
            <select .value=${this._fontSize} @change=${this._onFontSizeChange}>
              ${FONT_SIZES.map((s) => html`<option value=${s}>${s || 'Default'}</option>`)}
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private _bind(next: Editor | null) {
    if (this._editor === next) return;
    if (this._editor) this._editor.off('selectionUpdate', this._onSelectionUpdate);
    this._editor = next;
    if (next) {
      next.on('selectionUpdate', this._onSelectionUpdate);
      this._syncFromEditor();
    }
  }

  private _syncFromEditor() {
    const ed = this._editor;
    if (!ed || ed.isDestroyed) return;
    const heading = ed.getAttributes('heading');
    if (heading && heading.level) {
      this._heading = String(heading.level);
    } else if (ed.isActive('blockquote')) {
      this._heading = 'blockquote';
    } else {
      this._heading = '';
    }
    this._activeBullet = ed.isActive('bulletList');
    this._activeNumber = ed.isActive('orderedList');

    const ts = ed.getAttributes('textStyle');
    this._color = (ts.color as string) || '#000000';
    this._fontFamily = (ts.fontFamily as string) || '';
    this._fontSize = (ts.fontSize as string) || '';
  }

  private _onHeadingChange = (e: Event) => {
    const ed = this._editor;
    if (!ed) return;
    const v = (e.target as HTMLSelectElement).value;
    if (v === '') {
      ed.chain().focus().setParagraph().run();
    } else if (v === 'blockquote') {
      ed.chain().focus().toggleBlockquote().run();
    } else {
      const level = Number(v) as 1 | 2 | 3;
      ed.chain().focus().toggleHeading({ level }).run();
    }
    this._syncFromEditor();
  };

  private _onToggleBullet = () => {
    this._editor?.chain().focus().toggleBulletList().run();
    this._syncFromEditor();
  };

  private _onToggleNumber = () => {
    this._editor?.chain().focus().toggleOrderedList().run();
    this._syncFromEditor();
  };

  private _onColorChange = (e: Event) => {
    const color = (e.target as HTMLInputElement).value;
    this._editor?.chain().focus().setColor(color).run();
    this._color = color;
  };

  private _onFontFamilyChange = (e: Event) => {
    const family = (e.target as HTMLSelectElement).value;
    if (family) this._editor?.chain().focus().setFontFamily(family).run();
    else this._editor?.chain().focus().unsetFontFamily().run();
    this._fontFamily = family;
  };

  private _onFontSizeChange = (e: Event) => {
    const size = (e.target as HTMLSelectElement).value;
    if (size) this._editor?.chain().focus().setFontSize(size).run();
    else this._editor?.chain().focus().unsetFontSize().run();
    this._fontSize = size;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-rich-text-format': PigeonRichTextFormat;
  }
}
