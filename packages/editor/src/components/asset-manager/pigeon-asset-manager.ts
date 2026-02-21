import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { AssetManagerConfig } from '@lit-pigeon/core';

@customElement('pigeon-asset-manager')
export class PigeonAssetManager extends LitElement {
  @property({ type: Object })
  config: AssetManagerConfig = {};

  @property({ type: Boolean, reflect: true })
  open = false;

  @state()
  private _dragOver = false;

  @state()
  private _uploading = false;

  @state()
  private _progress = 0;

  @state()
  private _error = '';

  @state()
  private _urlInput = '';

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
      width: 480px;
      max-width: 90vw;
      max-height: 80vh;
      background: var(--pigeon-bg, #ffffff);
      border-radius: var(--pigeon-radius, 6px);
      box-shadow: var(--pigeon-shadow-md);
      display: flex;
      flex-direction: column;
      font-family: var(--pigeon-font);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--pigeon-text, #1e293b);
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--pigeon-text-secondary, #64748b);
      padding: 4px;
      font-size: 18px;
      line-height: 1;
    }

    .body {
      padding: 16px;
      overflow-y: auto;
    }

    .drop-zone {
      border: 2px dashed var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      padding: 32px;
      text-align: center;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 14px;
      transition: border-color 0.15s, background 0.15s;
      cursor: pointer;
    }

    .drop-zone.drag-over {
      border-color: var(--pigeon-primary, #3b82f6);
      background: rgba(59, 130, 246, 0.06);
    }

    .drop-zone svg {
      width: 40px;
      height: 40px;
      margin-bottom: 8px;
      opacity: 0.5;
    }

    .drop-zone p {
      margin: 0 0 4px;
    }

    .drop-zone small {
      font-size: 12px;
      opacity: 0.7;
    }

    input[type='file'] {
      display: none;
    }

    .separator {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 16px 0;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 12px;
    }

    .separator::before,
    .separator::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--pigeon-border, #e2e8f0);
    }

    .url-input-group {
      display: flex;
      gap: 8px;
    }

    .url-input-group input {
      flex: 1;
      height: 36px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 10px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
    }

    .url-input-group input:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
    }

    .url-input-group button {
      height: 36px;
      padding: 0 16px;
      background: var(--pigeon-primary, #3b82f6);
      color: white;
      border: none;
      border-radius: var(--pigeon-radius-sm, 4px);
      font-family: var(--pigeon-font);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .url-input-group button:hover {
      background: var(--pigeon-primary-hover, #2563eb);
    }

    .progress-bar {
      height: 4px;
      background: var(--pigeon-border, #e2e8f0);
      border-radius: 2px;
      margin-top: 12px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--pigeon-primary, #3b82f6);
      transition: width 0.3s ease;
    }

    .error {
      color: var(--pigeon-danger, #ef4444);
      font-size: 13px;
      margin-top: 8px;
    }
  `;

  render() {
    return html`
      <div class="overlay" @click=${this._close}></div>
      <div class="modal">
        <div class="header">
          <h3>Select Image</h3>
          <button class="close-btn" @click=${this._close}>&times;</button>
        </div>
        <div class="body">
          <div
            class="drop-zone ${this._dragOver ? 'drag-over' : ''}"
            @dragover=${this._onDragOver}
            @dragleave=${this._onDragLeave}
            @drop=${this._onDrop}
            @click=${this._openFilePicker}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Drag & drop an image here</p>
            <small>or click to browse</small>
          </div>
          <input
            type="file"
            id="file-input"
            accept="${this._acceptedTypes}"
            @change=${this._onFileSelected}
          />

          ${this._uploading ? html`
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this._progress}%"></div>
            </div>
          ` : ''}

          ${this._error ? html`<div class="error">${this._error}</div>` : ''}

          <div class="separator">or enter URL</div>

          <div class="url-input-group">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              .value=${this._urlInput}
              @input=${(e: Event) => this._urlInput = (e.target as HTMLInputElement).value}
              @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this._useUrl()}
            />
            <button @click=${this._useUrl}>Use URL</button>
          </div>
        </div>
      </div>
    `;
  }

  private get _acceptedTypes(): string {
    return (this.config.acceptedTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']).join(',');
  }

  private _close() {
    this.open = false;
    this._error = '';
    this._urlInput = '';
  }

  private _openFilePicker() {
    const input = this.renderRoot.querySelector('#file-input') as HTMLInputElement;
    input?.click();
  }

  private _onDragOver(e: DragEvent) {
    e.preventDefault();
    this._dragOver = true;
  }

  private _onDragLeave() {
    this._dragOver = false;
  }

  private _onDrop(e: DragEvent) {
    e.preventDefault();
    this._dragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this._handleFile(file);
  }

  private _onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this._handleFile(file);
  }

  private async _handleFile(file: File) {
    this._error = '';

    // Validate file size
    const maxSize = this.config.maxFileSize ?? 5 * 1024 * 1024; // 5MB default
    if (file.size > maxSize) {
      this._error = `File too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
      return;
    }

    // Validate type
    const accepted = this.config.acceptedTypes ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!accepted.includes(file.type)) {
      this._error = `File type not accepted: ${file.type}`;
      return;
    }

    // Use custom handler if provided
    if (this.config.uploadHandler) {
      try {
        this._uploading = true;
        this._progress = 50;
        const url = await this.config.uploadHandler(file);
        this._selectAsset(url);
      } catch (err) {
        this._error = err instanceof Error ? err.message : 'Upload failed';
      } finally {
        this._uploading = false;
        this._progress = 0;
      }
      return;
    }

    // Use upload URL if configured
    if (this.config.uploadUrl) {
      try {
        this._uploading = true;
        this._progress = 30;

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(this.config.uploadUrl, {
          method: 'POST',
          headers: this.config.uploadHeaders ?? {},
          body: formData,
        });

        this._progress = 80;

        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

        const data = await res.json();
        const url = data.url || data.src || data.location;
        if (!url) throw new Error('No URL in upload response');

        this._progress = 100;
        this._selectAsset(url);
      } catch (err) {
        this._error = err instanceof Error ? err.message : 'Upload failed';
      } finally {
        this._uploading = false;
        this._progress = 0;
      }
      return;
    }

    // Fallback: convert to data URL
    const reader = new FileReader();
    reader.onload = () => {
      this._selectAsset(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  private _useUrl() {
    if (this._urlInput.trim()) {
      this._selectAsset(this._urlInput.trim());
    }
  }

  private _selectAsset(url: string) {
    this.dispatchEvent(new CustomEvent('asset-selected', {
      detail: { url },
      bubbles: true,
      composed: true,
    }));
    this._close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-asset-manager': PigeonAssetManager;
  }
}
