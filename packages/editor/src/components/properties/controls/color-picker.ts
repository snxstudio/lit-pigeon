import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('pigeon-color-picker')
export class PigeonColorPicker extends LitElement {
  @property({ type: String })
  label = 'Color';

  @property({ type: String })
  value = '#000000';

  static styles = css`
    :host {
      display: block;
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

    .color-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    input[type='color'] {
      -webkit-appearance: none;
      appearance: none;
      width: 32px;
      height: 32px;
      border: 2px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      cursor: pointer;
      padding: 0;
      background: none;
    }

    input[type='color']::-webkit-color-swatch-wrapper {
      padding: 2px;
    }

    input[type='color']::-webkit-color-swatch {
      border: none;
      border-radius: 2px;
    }

    input[type='text'] {
      flex: 1;
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font-mono);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      outline: none;
      box-sizing: border-box;
    }

    input[type='text']:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }
  `;

  render() {
    return html`
      <label>${this.label}</label>
      <div class="color-row">
        <input
          type="color"
          .value=${this.value}
          @input=${this._onColorInput}
        />
        <input
          type="text"
          .value=${this.value}
          @change=${this._onTextChange}
          maxlength="7"
        />
      </div>
    `;
  }

  private _onColorInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    this._emitChange();
  }

  private _onTextChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const val = input.value.trim();
    if (/^#[0-9a-fA-F]{3,6}$/.test(val)) {
      this.value = val;
      this._emitChange();
    }
  }

  private _emitChange() {
    this.dispatchEvent(new CustomEvent('color-change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-color-picker': PigeonColorPicker;
  }
}
