import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PigeonDocument, Renderer } from '@lit-pigeon/core';

type ViewMode = 'preview' | 'html' | 'mjml' | 'json';

@customElement('pigeon-preview')
export class PigeonPreview extends LitElement {
  @property({ type: Object })
  renderer?: Renderer;

  @property({ type: Object })
  doc?: PigeonDocument;

  @property({ type: Object })
  documentToMjml?: (doc: PigeonDocument) => string;

  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  private _viewMode: ViewMode = 'preview';

  @state()
  private _device: 'desktop' | 'mobile' = 'desktop';

  @state()
  private _htmlContent = '';

  @state()
  private _mjmlContent = '';

  @state()
  private _loading = false;

  static styles = css`
    :host {
      display: none;
    }

    :host([open]) {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 10000;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .modal {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      height: 85vh;
      max-width: 1200px;
      background: var(--pigeon-bg, #ffffff);
      border-radius: var(--pigeon-radius, 6px);
      box-shadow: var(--pigeon-shadow-md);
      display: flex;
      flex-direction: column;
      font-family: var(--pigeon-font);
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
      gap: 8px;
    }

    .header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--pigeon-text, #1e293b);
    }

    .tabs {
      display: flex;
      gap: 2px;
      margin-left: 16px;
      background: var(--pigeon-surface, #f8fafc);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 2px;
    }

    .tab {
      padding: 6px 12px;
      border: none;
      background: transparent;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 3px;
      transition: background 0.15s, color 0.15s;
    }

    .tab.active {
      background: white;
      color: var(--pigeon-text, #1e293b);
      box-shadow: var(--pigeon-shadow-sm);
    }

    .spacer { flex: 1; }

    .device-toggle {
      display: flex;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      overflow: hidden;
    }

    .device-toggle button {
      padding: 4px 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 14px;
    }

    .device-toggle button.active {
      background: var(--pigeon-primary, #3b82f6);
      color: white;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--pigeon-text-secondary, #64748b);
      padding: 4px 8px;
      font-size: 18px;
      line-height: 1;
      margin-left: 8px;
    }

    .content {
      flex: 1;
      overflow: auto;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      background: #e2e8f0;
      padding: 20px;
    }

    iframe {
      border: none;
      background: white;
      box-shadow: var(--pigeon-shadow);
      transition: width 0.3s ease;
    }

    .source-view {
      width: 100%;
      height: 100%;
      background: #1e293b;
      color: #e2e8f0;
      font-family: var(--pigeon-font-mono, monospace);
      font-size: 13px;
      line-height: 1.6;
      padding: 16px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-all;
      box-sizing: border-box;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 14px;
    }
  `;

  async updated(changed: Map<string, unknown>) {
    if (changed.has('open') && this.open) {
      await this._loadPreview();
    }
  }

  render() {
    return html`
      <div class="overlay" @click=${this._close}></div>
      <div class="modal">
        <div class="header">
          <h3>Preview</h3>
          <div class="tabs">
            <button class="tab ${this._viewMode === 'preview' ? 'active' : ''}" @click=${() => this._setView('preview')}>Preview</button>
            <button class="tab ${this._viewMode === 'html' ? 'active' : ''}" @click=${() => this._setView('html')}>HTML</button>
            <button class="tab ${this._viewMode === 'mjml' ? 'active' : ''}" @click=${() => this._setView('mjml')}>MJML</button>
            <button class="tab ${this._viewMode === 'json' ? 'active' : ''}" @click=${() => this._setView('json')}>JSON</button>
          </div>
          <div class="spacer"></div>
          ${this._viewMode === 'preview' ? html`
            <div class="device-toggle">
              <button class="${this._device === 'desktop' ? 'active' : ''}" @click=${() => this._device = 'desktop'} title="Desktop">&#128187;</button>
              <button class="${this._device === 'mobile' ? 'active' : ''}" @click=${() => this._device = 'mobile'} title="Mobile">&#128241;</button>
            </div>
          ` : ''}
          <button class="close-btn" @click=${this._close}>&times;</button>
        </div>
        <div class="content">
          ${this._loading ? html`<div class="loading">Rendering...</div>` : this._renderContent()}
        </div>
      </div>
    `;
  }

  private _renderContent() {
    switch (this._viewMode) {
      case 'preview':
        return html`
          <iframe
            style="width: ${this._device === 'mobile' ? '375px' : '100%'}; height: 100%;"
            srcdoc=${this._htmlContent}
          ></iframe>
        `;
      case 'html':
        return html`<div class="source-view">${this._htmlContent}</div>`;
      case 'mjml':
        return html`<div class="source-view">${this._mjmlContent}</div>`;
      case 'json':
        return html`<div class="source-view">${JSON.stringify(this.doc, null, 2)}</div>`;
    }
  }

  private async _loadPreview() {
    if (!this.doc) return;

    this._loading = true;

    // Generate MJML if converter available
    if (this.documentToMjml) {
      this._mjmlContent = this.documentToMjml(this.doc);
    }

    // Render HTML if renderer available
    if (this.renderer) {
      try {
        const result = await this.renderer.render(this.doc);
        this._htmlContent = result.html;
      } catch {
        this._htmlContent = '<p>Failed to render preview</p>';
      }
    }

    this._loading = false;
  }

  private _setView(mode: ViewMode) {
    this._viewMode = mode;
  }

  private _close() {
    this.open = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-preview': PigeonPreview;
  }
}
