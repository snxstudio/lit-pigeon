import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('pigeon-alignment-picker')
export class PigeonAlignmentPicker extends LitElement {
  @property({ type: String })
  label = 'Alignment';

  @property({ type: String })
  value: 'left' | 'center' | 'right' = 'left';

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

    .buttons {
      display: flex;
      gap: 0;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      overflow: hidden;
      width: fit-content;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 32px;
      border: none;
      background: var(--pigeon-bg, #ffffff);
      cursor: pointer;
      color: var(--pigeon-text-secondary, #64748b);
      transition: background 0.15s ease, color 0.15s ease;
      padding: 0;
    }

    button:not(:last-child) {
      border-right: 1px solid var(--pigeon-border, #e2e8f0);
    }

    button:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
    }

    button.active {
      background: var(--pigeon-primary, #3b82f6);
      color: white;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  `;

  render() {
    return html`
      <span class="label">${this.label}</span>
      <div class="buttons">
        <button
          class="${this.value === 'left' ? 'active' : ''}"
          @click=${() => this._select('left')}
          title="Align left"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
        </button>
        <button
          class="${this.value === 'center' ? 'active' : ''}"
          @click=${() => this._select('center')}
          title="Align center"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="6" y1="12" x2="18" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
        <button
          class="${this.value === 'right' ? 'active' : ''}"
          @click=${() => this._select('right')}
          title="Align right"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="9" y1="12" x2="21" y2="12"/>
            <line x1="6" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }

  private _select(align: 'left' | 'center' | 'right') {
    this.value = align;
    this.dispatchEvent(new CustomEvent('alignment-change', {
      detail: { value: align },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-alignment-picker': PigeonAlignmentPicker;
  }
}
