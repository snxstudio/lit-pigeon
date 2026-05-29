import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('pigeon-toolbar')
export class PigeonToolbar extends LitElement {
  @property({ type: Boolean, attribute: 'can-undo' })
  canUndo = false;

  @property({ type: Boolean, attribute: 'can-redo' })
  canRedo = false;

  @property({ type: String })
  device: 'desktop' | 'tablet' | 'mobile' = 'desktop';

  @property({ type: Boolean })
  fullscreen = false;

  @state()
  private _exportMenuOpen = false;

  connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'toolbar');
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', 'Editor toolbar');
    }
  }

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

    button:focus-visible {
      outline: none;
      box-shadow: var(--pigeon-ring-shadow);
      z-index: 1;
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
      background: var(--pigeon-accent, #eef2ff);
      color: var(--pigeon-accent-foreground, #4338ca);
    }

    button.primary {
      background: var(--pigeon-primary, #3b82f6);
      color: var(--pigeon-primary-foreground, #ffffff);
      border-color: var(--pigeon-primary, #3b82f6);
    }

    button.primary:hover:not(:disabled) {
      background: var(--pigeon-primary-hover, #2563eb);
      border-color: var(--pigeon-primary-hover, #2563eb);
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
      margin-top: 6px;
      background: var(--pigeon-bg, #ffffff);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-lg, 12px);
      box-shadow: var(--pigeon-shadow-lg);
      min-width: 168px;
      padding: 4px;
      z-index: 100;
    }

    .export-menu button {
      width: 100%;
      justify-content: flex-start;
      border: none;
      border-radius: var(--pigeon-radius-sm, 6px);
      height: 34px;
      padding: 0 10px;
      font-weight: 400;
    }
  `;

  render() {
    return html`
      <!-- Undo/Redo -->
      <button
        class="icon-btn"
        part="toolbar-button toolbar-button-undo"
        title="Undo"
        aria-label="Undo"
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
        part="toolbar-button toolbar-button-redo"
        title="Redo"
        aria-label="Redo"
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
      <div class="device-group" role="group" aria-label="Preview device">

        <button
          part="toolbar-device toolbar-device-desktop"
          class="${this.device === 'desktop' ? 'active' : ''}"
          title="Desktop view"
          aria-label="Desktop view"
          aria-pressed=${this.device === 'desktop'}
          @click=${() => this._onDeviceChange('desktop')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </button>
        <button
          part="toolbar-device toolbar-device-tablet"
          class="${this.device === 'tablet' ? 'active' : ''}"
          title="Tablet view (768px)"
          aria-label="Tablet view"
          aria-pressed=${this.device === 'tablet'}
          @click=${() => this._onDeviceChange('tablet')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        </button>
        <button
          part="toolbar-device toolbar-device-mobile"
          class="${this.device === 'mobile' ? 'active' : ''}"
          title="Mobile view (375px)"
          aria-label="Mobile view"
          aria-pressed=${this.device === 'mobile'}
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
        part="toolbar-button toolbar-button-fullscreen"
        title="${this.fullscreen ? 'Exit fullscreen' : 'Fullscreen'}"
        aria-label="${this.fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}"
        aria-pressed=${this.fullscreen}
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
      <button
        data-action="templates"
        part="toolbar-button toolbar-button-templates"
        title="Templates"
        @click=${this._onTemplates}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        Templates
      </button>

      <button part="toolbar-button toolbar-button-preview" @click=${this._onPreview}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Preview
      </button>

      <div class="export-wrapper">
        <button
          class="primary"
          part="toolbar-button toolbar-button-export"
          aria-haspopup="menu"
          aria-expanded=${this._exportMenuOpen}
          @click=${this._toggleExportMenu}
        >
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
          <div class="export-menu" role="menu" aria-label="Export format">
            <button role="menuitem" @click=${this._onExportHtml}>Export HTML</button>
            <button role="menuitem" @click=${this._onExportMjml}>Export MJML</button>
            <button role="menuitem" @click=${this._onExportJson}>Export JSON</button>
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

  private _onDeviceChange(device: 'desktop' | 'tablet' | 'mobile') {
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

  private _onTemplates() {
    this.dispatchEvent(new CustomEvent('toolbar-templates', {
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
