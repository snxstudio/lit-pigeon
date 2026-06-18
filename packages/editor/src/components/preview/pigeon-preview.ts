import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PigeonDocument, Renderer, FontDefinition } from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';

type ViewMode = 'preview' | 'html' | 'mjml' | 'json';

@customElement('pigeon-preview')
export class PigeonPreview extends LitElement {
  @property({ type: Object })
  renderer?: Renderer;

  @property({ type: Object })
  doc?: PigeonDocument;

  @property({ attribute: false })
  documentToMjml?: (doc: PigeonDocument, options?: { fonts?: FontDefinition[] }) => string;

  @property({ attribute: false })
  fonts: FontDefinition[] = [];

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
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(2px);
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
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-lg, 12px);
      box-shadow: var(--pigeon-shadow-lg);
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

    .tab:focus-visible {
      outline: none;
      box-shadow: var(--pigeon-ring-shadow);
    }

    .tab.active {
      background: var(--pigeon-bg, #ffffff);
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
      color: var(--pigeon-text-secondary, #64748b);
      cursor: pointer;
      font-size: 14px;
    }

    .device-toggle button:focus-visible {
      outline: none;
      box-shadow: inset var(--pigeon-ring-shadow);
    }

    .device-toggle button.active {
      background: var(--pigeon-accent, #eef2ff);
      color: var(--pigeon-accent-foreground, #4338ca);
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
      border-radius: var(--pigeon-radius-sm, 4px);
      transition: background 0.15s ease, color 0.15s ease;
    }

    .close-btn:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
      color: var(--pigeon-text, #1e293b);
    }

    .close-btn:focus-visible {
      outline: none;
      box-shadow: var(--pigeon-ring-shadow);
    }

    .content {
      flex: 1;
      overflow: auto;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      background: var(--pigeon-canvas-bg, #e2e8f0);
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

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeyDown);
  }

  /** Element focused before the dialog opened, restored on close. */
  private _previouslyFocused: HTMLElement | null = null;

  async updated(changed: Map<string, unknown>) {
    if (!changed.has('open')) return;
    if (this.open) {
      // Remember where focus was so we can return it on close.
      this._previouslyFocused = this._deepActiveElement();
      await this._loadPreview();
      // Move focus into the dialog so Escape/Tab work and SRs announce it.
      const modal = this.renderRoot.querySelector('.modal') as HTMLElement | null;
      modal?.focus();
    } else if (this._previouslyFocused) {
      // Restore focus to the trigger when the dialog closes.
      this._previouslyFocused.focus?.();
      this._previouslyFocused = null;
    }
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (!this.open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      this._close();
    } else if (e.key === 'Tab') {
      this._trapTab(e);
    }
  };

  /** The deepest focused element, descending through shadow roots. */
  private _deepActiveElement(): HTMLElement | null {
    let el = document.activeElement as HTMLElement | null;
    while (el?.shadowRoot?.activeElement) {
      el = el.shadowRoot.activeElement as HTMLElement;
    }
    return el;
  }

  /** Focusable controls inside the modal (the dialog's own chrome). */
  private _focusable(): HTMLElement[] {
    const modal = this.renderRoot.querySelector('.modal');
    if (!modal) return [];
    return Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));
  }

  /** Keep Tab focus within the dialog (WCAG modal pattern). */
  private _trapTab(e: KeyboardEvent) {
    const focusables = this._focusable();
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this._deepActiveElement();
    if (e.shiftKey && (active === first || active === null)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  render() {
    return html`
      <div class="overlay" @click=${this._close}></div>
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pigeon-preview-title"
        tabindex="-1"
      >
        <div class="header">
          <h3 id="pigeon-preview-title">${t('preview.heading')}</h3>
          <div class="tabs" role="tablist" aria-label=${t('preview.tab-group-label')}>
            <button role="tab" aria-selected=${this._viewMode === 'preview'} class="tab ${this._viewMode === 'preview' ? 'active' : ''}" @click=${() => this._setView('preview')}>${t('preview.tab.preview')}</button>
            <button role="tab" aria-selected=${this._viewMode === 'html'} class="tab ${this._viewMode === 'html' ? 'active' : ''}" @click=${() => this._setView('html')}>${t('preview.tab.html')}</button>
            <button role="tab" aria-selected=${this._viewMode === 'mjml'} class="tab ${this._viewMode === 'mjml' ? 'active' : ''}" @click=${() => this._setView('mjml')}>${t('preview.tab.mjml')}</button>
            <button role="tab" aria-selected=${this._viewMode === 'json'} class="tab ${this._viewMode === 'json' ? 'active' : ''}" @click=${() => this._setView('json')}>${t('preview.tab.json')}</button>
          </div>
          <div class="spacer"></div>
          ${this._viewMode === 'preview' ? html`
            <div class="device-toggle" role="group" aria-label=${t('toolbar.preview-device')}>
              <button class="${this._device === 'desktop' ? 'active' : ''}" aria-label=${t('preview.device.desktop')} aria-pressed=${this._device === 'desktop'} @click=${() => this._device = 'desktop'} title="Desktop">&#128187;</button>
              <button class="${this._device === 'mobile' ? 'active' : ''}" aria-label=${t('preview.device.mobile')} aria-pressed=${this._device === 'mobile'} @click=${() => this._device = 'mobile'} title="Mobile">&#128241;</button>
            </div>
          ` : ''}
          <button class="close-btn" aria-label=${t('preview.close')} @click=${this._close}>&times;</button>
        </div>
        <div class="content">
          ${this._loading ? html`<div class="loading">${t('preview.loading')}</div>` : this._renderContent()}
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
      this._mjmlContent = this.documentToMjml(this.doc, { fonts: this.fonts });
    }

    // Render HTML if renderer available
    if (this.renderer) {
      try {
        const result = await this.renderer.render(this.doc, { fonts: this.fonts });
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
