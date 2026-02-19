import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Spacing } from '@lit-pigeon/core';

@customElement('pigeon-spacing-input')
export class PigeonSpacingInput extends LitElement {
  @property({ type: String })
  label = 'Padding';

  @property({ type: Object })
  value: Spacing = { top: 0, right: 0, bottom: 0, left: 0 };

  static styles = css`
    :host {
      display: block;
      margin-bottom: 12px;
    }

    .label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
      margin-bottom: 6px;
      font-family: var(--pigeon-font);
    }

    .box-model {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: auto auto auto;
      gap: 4px;
      align-items: center;
      justify-items: center;
      max-width: 200px;
    }

    .top {
      grid-column: 2;
      grid-row: 1;
    }

    .left {
      grid-column: 1;
      grid-row: 2;
    }

    .center-label {
      grid-column: 2;
      grid-row: 2;
      font-size: 10px;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .right {
      grid-column: 3;
      grid-row: 2;
    }

    .bottom {
      grid-column: 2;
      grid-row: 3;
    }

    input[type='number'] {
      width: 52px;
      height: 28px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 4px;
      font-family: var(--pigeon-font-mono);
      font-size: 12px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      text-align: center;
      outline: none;
      box-sizing: border-box;
    }

    input[type='number']:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    /* Hide spinner arrows */
    input[type='number']::-webkit-inner-spin-button,
    input[type='number']::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type='number'] {
      -moz-appearance: textfield;
    }
  `;

  render() {
    return html`
      <span class="label">${this.label}</span>
      <div class="box-model">
        <input
          class="top"
          type="number"
          .value=${String(this.value.top)}
          min="0"
          @change=${(e: Event) => this._onChange('top', e)}
          title="Top"
        />
        <input
          class="left"
          type="number"
          .value=${String(this.value.left)}
          min="0"
          @change=${(e: Event) => this._onChange('left', e)}
          title="Left"
        />
        <span class="center-label">px</span>
        <input
          class="right"
          type="number"
          .value=${String(this.value.right)}
          min="0"
          @change=${(e: Event) => this._onChange('right', e)}
          title="Right"
        />
        <input
          class="bottom"
          type="number"
          .value=${String(this.value.bottom)}
          min="0"
          @change=${(e: Event) => this._onChange('bottom', e)}
          title="Bottom"
        />
      </div>
    `;
  }

  private _onChange(side: keyof Spacing, e: Event) {
    const input = e.target as HTMLInputElement;
    const num = Math.max(0, parseInt(input.value, 10) || 0);
    const newValue = { ...this.value, [side]: num };
    this.value = newValue;
    this.dispatchEvent(new CustomEvent('spacing-change', {
      detail: { value: newValue },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-spacing-input': PigeonSpacingInput;
  }
}
