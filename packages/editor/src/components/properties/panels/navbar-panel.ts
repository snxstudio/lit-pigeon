import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { NavBarBlock, Spacing } from '@lit-pigeon/core';
import '../controls/alignment-picker.js';
import '../controls/spacing-input.js';
import '../controls/slider-input.js';
import '../controls/color-picker.js';

@customElement('pigeon-navbar-panel')
export class PigeonNavBarPanel extends LitElement {
  @property({ type: Object })
  block!: NavBarBlock;

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
    input[type='url'] {
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
    }

    .link-item {
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 8px;
      margin-bottom: 8px;
    }

    .link-header {
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
      <h3>Navbar Properties</h3>

      <h4>Links</h4>
      ${v.links.map((link, index) => html`
        <div class="link-item">
          <div class="link-header">
            <label>Link ${index + 1}</label>
            <button class="remove-btn" @click=${() => this._removeLink(index)}>Remove</button>
          </div>
          <div class="field">
            <label>Text</label>
            <input
              type="text"
              .value=${link.text}
              @change=${(e: Event) => this._onLinkTextChange(index, e)}
            />
          </div>
          <div class="field">
            <label>URL</label>
            <input
              type="url"
              .value=${link.href}
              @change=${(e: Event) => this._onLinkHrefChange(index, e)}
            />
          </div>
        </div>
      `)}

      <button class="add-btn" @click=${this._addLink}>+ Add Link</button>

      <pigeon-alignment-picker
        label="Alignment"
        .value=${v.alignment}
        @alignment-change=${this._onAlignChange}
      ></pigeon-alignment-picker>

      <div class="field">
        <label>Hamburger (mobile)</label>
        <select @change=${this._onHamburgerChange}>
          <option value="hamburger" ?selected=${v.hamburger === 'hamburger'}>Show</option>
          <option value="none" ?selected=${v.hamburger === 'none'}>Hide</option>
        </select>
      </div>

      <pigeon-color-picker
        label="Link Color"
        .value=${v.linkColor}
        @color-change=${this._onLinkColorChange}
      ></pigeon-color-picker>

      <pigeon-slider-input
        label="Link Font Size"
        .value=${v.linkFontSize}
        min=${10}
        max=${32}
        step=${1}
        unit="px"
        @slider-change=${this._onLinkFontSizeChange}
      ></pigeon-slider-input>

      <div class="field">
        <label>Link Padding</label>
        <input
          type="text"
          .value=${v.linkPadding}
          placeholder="10px 15px"
          @change=${this._onLinkPaddingChange}
        />
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

  private _addLink() {
    const links = [...this.block.values.links, { href: '#', text: 'New Link' }];
    this._emit({ links });
  }

  private _removeLink(index: number) {
    const links = this.block.values.links.filter((_, i) => i !== index);
    this._emit({ links });
  }

  private _onLinkTextChange(index: number, e: Event) {
    const links = this.block.values.links.map((link, i) =>
      i === index ? { ...link, text: (e.target as HTMLInputElement).value } : link
    );
    this._emit({ links });
  }

  private _onLinkHrefChange(index: number, e: Event) {
    const links = this.block.values.links.map((link, i) =>
      i === index ? { ...link, href: (e.target as HTMLInputElement).value } : link
    );
    this._emit({ links });
  }

  private _onAlignChange(e: CustomEvent<{ value: string }>) {
    this._emit({ alignment: e.detail.value });
  }

  private _onHamburgerChange(e: Event) {
    this._emit({ hamburger: (e.target as HTMLSelectElement).value });
  }

  private _onLinkColorChange(e: CustomEvent<{ value: string }>) {
    this._emit({ linkColor: e.detail.value });
  }

  private _onLinkFontSizeChange(e: CustomEvent<{ value: number }>) {
    this._emit({ linkFontSize: e.detail.value });
  }

  private _onLinkPaddingChange(e: Event) {
    this._emit({ linkPadding: (e.target as HTMLInputElement).value });
  }

  private _onPaddingChange(e: CustomEvent<{ value: Spacing }>) {
    this._emit({ padding: e.detail.value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-navbar-panel': PigeonNavBarPanel;
  }
}
