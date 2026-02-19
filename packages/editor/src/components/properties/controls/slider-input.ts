import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('pigeon-slider-input')
export class PigeonSliderInput extends LitElement {
  @property({ type: String })
  label = '';

  @property({ type: Number })
  value = 0;

  @property({ type: Number })
  min = 0;

  @property({ type: Number })
  max = 100;

  @property({ type: Number })
  step = 1;

  @property({ type: String })
  unit = 'px';

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
      margin-bottom: 4px;
      font-family: var(--pigeon-font);
    }

    .row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    input[type='range'] {
      flex: 1;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--pigeon-border, #e2e8f0);
      border-radius: 2px;
      outline: none;
    }

    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--pigeon-primary, #3b82f6);
      cursor: pointer;
      border: 2px solid white;
      box-shadow: var(--pigeon-shadow-sm);
    }

    input[type='range']::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--pigeon-primary, #3b82f6);
      cursor: pointer;
      border: 2px solid white;
      box-shadow: var(--pigeon-shadow-sm);
    }

    .number-group {
      display: flex;
      align-items: center;
      gap: 2px;
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

    .unit {
      font-size: 11px;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
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
      ${this.label ? html`<span class="label">${this.label}</span>` : ''}
      <div class="row">
        <input
          type="range"
          .value=${String(this.value)}
          min=${this.min}
          max=${this.max}
          step=${this.step}
          @input=${this._onSlider}
        />
        <div class="number-group">
          <input
            type="number"
            .value=${String(this.value)}
            min=${this.min}
            max=${this.max}
            step=${this.step}
            @change=${this._onNumber}
          />
          <span class="unit">${this.unit}</span>
        </div>
      </div>
    `;
  }

  private _onSlider(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = parseFloat(input.value);
    this._emitChange();
  }

  private _onNumber(e: Event) {
    const input = e.target as HTMLInputElement;
    let val = parseFloat(input.value);
    val = Math.min(this.max, Math.max(this.min, isNaN(val) ? this.min : val));
    this.value = val;
    this._emitChange();
  }

  private _emitChange() {
    this.dispatchEvent(new CustomEvent('slider-change', {
      detail: { value: this.value },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-slider-input': PigeonSliderInput;
  }
}
