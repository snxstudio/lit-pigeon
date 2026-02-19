import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('pigeon-drop-indicator')
export class PigeonDropIndicator extends LitElement {
  @property({ type: Boolean, reflect: true })
  visible = false;

  static styles = css`
    :host {
      display: block;
      height: 4px;
      position: relative;
      pointer-events: none;
      transition: opacity 0.15s ease;
      opacity: 0;
    }

    :host([visible]) {
      opacity: 1;
    }

    .line {
      position: absolute;
      left: 8px;
      right: 8px;
      top: 0;
      height: 4px;
      background: var(--pigeon-drop-color, #3b82f6);
      border-radius: 2px;
      box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
    }

    .dot-left,
    .dot-right {
      position: absolute;
      top: -2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--pigeon-drop-color, #3b82f6);
    }

    .dot-left {
      left: 4px;
    }

    .dot-right {
      right: 4px;
    }
  `;

  render() {
    return html`
      <div class="line">
        <div class="dot-left"></div>
        <div class="dot-right"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-drop-indicator': PigeonDropIndicator;
  }
}
