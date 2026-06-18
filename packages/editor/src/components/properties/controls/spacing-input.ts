import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Spacing } from '@lit-pigeon/core';
import { t } from '../../../i18n/index.js';

@customElement('pigeon-spacing-input')
export class PigeonSpacingInput extends LitElement {
  @property({ type: String })
  label = 'Padding';

  @property({ type: Object })
  value: Spacing = { top: 0, right: 0, bottom: 0, left: 0 };

  static styles = css`
    :host {
      display: block;
      margin-bottom: 14px;
    }

    .label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
      margin-bottom: 6px;
      font-family: var(--pigeon-font);
    }

    /* Four joined cells in one bordered group (Figma-style) instead of the
       old box-model diamond — half the height, and the group reads as a
       single control. The ring sits on the group via :focus-within. */
    .group {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 6px);
      background: var(--pigeon-bg, #ffffff);
      overflow: hidden;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .group:focus-within {
      border-color: var(--pigeon-ring);
      box-shadow: var(--pigeon-ring-shadow);
    }

    .group:hover:not(:focus-within) {
      border-color: color-mix(
        in srgb,
        var(--pigeon-input, #cbd5e1) 60%,
        var(--pigeon-text, #0f172a)
      );
    }

    input[type='number'] {
      width: 100%;
      height: 32px;
      border: none;
      outline: none;
      padding: 0 2px;
      font-family: var(--pigeon-font-mono);
      font-size: 12px;
      color: var(--pigeon-text, #1e293b);
      background: transparent;
      text-align: center;
      box-sizing: border-box;
    }

    input[type='number']:not(:first-child) {
      border-left: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .sides {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      margin-top: 3px;
    }

    .side {
      text-align: center;
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--pigeon-text-muted, #94a3b8);
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
      <span class="label" id="spacing-label">${this.label}</span>
      <div class="group" role="group" aria-labelledby="spacing-label">
        <input
          type="number"
          .value=${String(this.value.top)}
          min="0"
          @change=${(e: Event) => this._onChange('top', e)}
          title=${t('control.spacing.topTitle')}
          aria-label=${t('control.spacing.top')}
        />
        <input
          type="number"
          .value=${String(this.value.right)}
          min="0"
          @change=${(e: Event) => this._onChange('right', e)}
          title=${t('control.spacing.rightTitle')}
          aria-label=${t('control.spacing.right')}
        />
        <input
          type="number"
          .value=${String(this.value.bottom)}
          min="0"
          @change=${(e: Event) => this._onChange('bottom', e)}
          title=${t('control.spacing.bottomTitle')}
          aria-label=${t('control.spacing.bottom')}
        />
        <input
          type="number"
          .value=${String(this.value.left)}
          min="0"
          @change=${(e: Event) => this._onChange('left', e)}
          title=${t('control.spacing.leftTitle')}
          aria-label=${t('control.spacing.left')}
        />
      </div>
      <div class="sides" aria-hidden="true">
        <span class="side">${t('control.spacing.top')}</span>
        <span class="side">${t('control.spacing.right')}</span>
        <span class="side">${t('control.spacing.bottom')}</span>
        <span class="side">${t('control.spacing.left')}</span>
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
