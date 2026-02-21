import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('pigeon-toolbar')
export class PigeonToolbar extends LitElement {
  @property({ type: Boolean, attribute: 'can-undo' })
  canUndo = false;

  @property({ type: Boolean, attribute: 'can-redo' })
  canRedo = false;

  @property({ type: String })
  device: 'desktop' | 'mobile' = 'desktop';

  @property({ type: Boolean })
  fullscreen = false;

  @state()
  private _exportMenuOpen = false;

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

    .export-wrapper {
      position: relative;
    }

    .export-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--pigeon-bg, #ffffff);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      box-shadow: var(--pigeon-shadow-md);
      min-width: 160px;
      z-index: 100;
      overflow: hidden;
    }

    .export-menu button {
      width: 100%;
      justify-content: flex-start;
      border: none;
      border-radius: 0;
      height: 36px;
      padding: 0 12px;
      font-weight: 400;
    }

    .export-menu button:not(:last-child) {
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
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

      <!-- Fullscreen toggle -->
      <button
        class="icon-btn"
        title="${this.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}"
        @click=${this._onFullscreen}
      >
        ${this.fullscreen
          ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 14 10 14 10 20"/>
              <polyline points="20 10 14 10 14 4"/>
              <line x1="14" y1="10" x2="21" y2="3"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>`
          : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>`}
      </button>

      <div class="separator"></div>

      <!-- Actions -->
      <button @click=${this._onPreview}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Preview
      </button>

      <div class="export-wrapper">
        <button class="primary" @click=${this._toggleExportMenu}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        ${this._exportMenuOpen ? html`
          <div class="export-menu">
            <button @click=${this._onExportHtml}>Export HTML</button>
            <button @click=${this._onExportMjml}>Export MJML</button>
            <button @click=${this._onExportJson}>Export JSON</button>
          </div>
        ` : ''}
      </div>
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

  private _onFullscreen() {
    this.dispatchEvent(new CustomEvent('toolbar-fullscreen', {
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

  private _toggleExportMenu() {
    this._exportMenuOpen = !this._exportMenuOpen;
  }

  private _onExportHtml() {
    this._exportMenuOpen = false;
    this.dispatchEvent(new CustomEvent('pigeon:export-html', {
      bubbles: true,
      composed: true,
    }));
  }

  private _onExportMjml() {
    this._exportMenuOpen = false;
    this.dispatchEvent(new CustomEvent('pigeon:export-mjml', {
      bubbles: true,
      composed: true,
    }));
  }

  private _onExportJson() {
    this._exportMenuOpen = false;
    this.dispatchEvent(new CustomEvent('pigeon:export-json', {
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
