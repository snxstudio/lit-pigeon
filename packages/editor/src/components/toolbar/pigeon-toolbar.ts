import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('pigeon-toolbar')
export class PigeonToolbar extends LitElement {
  @property({ type: Boolean, attribute: 'can-undo' })
  canUndo = false;

  @property({ type: Boolean, attribute: 'can-redo' })
  canRedo = false;

  @property({ type: String })
  device: 'desktop' | 'mobile' = 'desktop';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      height: var(--pigeon-toolbar-height, 48px);
      background: var(--pigeon-bg, #ffffff);
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
      padding: 0 12px;
      gap: 4px;
      box-sizing: border-box;
      font-family: var(--pigeon-font);
    }

    .separator {
      width: 1px;
      height: 24px;
      background: var(--pigeon-border, #e2e8f0);
      margin: 0 8px;
    }

    .spacer {
      flex: 1;
    }

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      padding: 0 10px;
      border: 1px solid transparent;
      border-radius: var(--pigeon-radius-sm, 4px);
      background: transparent;
      color: var(--pigeon-text, #1e293b);
      cursor: pointer;
      font-family: var(--pigeon-font);
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      gap: 6px;
      white-space: nowrap;
    }

    button:hover:not(:disabled) {
      background: var(--pigeon-surface-hover, #f1f5f9);
    }

    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    button.icon-btn {
      width: 32px;
      padding: 0;
    }

    button.active {
      background: var(--pigeon-primary, #3b82f6);
      color: white;
      border-color: var(--pigeon-primary, #3b82f6);
    }

    button.primary {
      background: var(--pigeon-primary, #3b82f6);
      color: white;
      border-color: var(--pigeon-primary, #3b82f6);
    }

    button.primary:hover:not(:disabled) {
      background: var(--pigeon-primary-hover, #2563eb);
    }

    svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .device-group {
      display: flex;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      overflow: hidden;
    }

    .device-group button {
      border: none;
      border-radius: 0;
      height: 30px;
    }

    .device-group button:not(:last-child) {
      border-right: 1px solid var(--pigeon-border, #e2e8f0);
    }
  `;

  render() {
    return html`
      <!-- Undo/Redo -->
      <button
        class="icon-btn"
        title="Undo"
        ?disabled=${!this.canUndo}
        @click=${this._onUndo}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
      </button>

      <button
        class="icon-btn"
        title="Redo"
        ?disabled=${!this.canRedo}
        @click=${this._onRedo}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
        </svg>
      </button>

      <div class="separator"></div>

      <!-- Device toggle -->
      <div class="device-group">
        <button
          class="${this.device === 'desktop' ? 'active' : ''}"
          title="Desktop view"
          @click=${() => this._onDeviceChange('desktop')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
        <button
          class="${this.device === 'mobile' ? 'active' : ''}"
          title="Mobile view"
          @click=${() => this._onDeviceChange('mobile')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="spacer"></div>

      <!-- Actions -->
      <button @click=${this._onPreview}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Preview
      </button>

      <button class="primary" @click=${this._onExport}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Export
      </button>
    `;
  }

  private _onUndo() {
    this.dispatchEvent(new CustomEvent('toolbar-undo', {
      bubbles: true,
      composed: true,
    }));
  }

  private _onRedo() {
    this.dispatchEvent(new CustomEvent('toolbar-redo', {
      bubbles: true,
      composed: true,
    }));
  }

  private _onDeviceChange(device: 'desktop' | 'mobile') {
    this.device = device;
    this.dispatchEvent(new CustomEvent('toolbar-device', {
      detail: { device },
      bubbles: true,
      composed: true,
    }));
  }

  private _onPreview() {
    this.dispatchEvent(new CustomEvent('pigeon:preview', {
      bubbles: true,
      composed: true,
    }));
  }

  private _onExport() {
    this.dispatchEvent(new CustomEvent('pigeon:export', {
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-toolbar': PigeonToolbar;
  }
}
