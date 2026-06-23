import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  Asset,
  AssetManagerConfig,
  AssetStorage,
} from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';

type Tab = 'library' | 'upload' | 'stock';

let _stockTabPromise: Promise<unknown> | null = null;
function loadStockTab(): Promise<unknown> {
  if (!_stockTabPromise) _stockTabPromise = import('./pigeon-stock-tab.js');
  return _stockTabPromise;
}

const SEARCH_DEBOUNCE_MS = 250;
const ALL_FOLDERS = '__all__';

@customElement('pigeon-asset-manager')
export class PigeonAssetManager extends LitElement {
  @property({ type: Object })
  config: AssetManagerConfig = {};

  /**
   * Optional asset library. When set, the modal shows a "Library" tab where
   * users browse and pick previously-saved assets; folders, search, and tag
   * filters all run through `AssetStorage.list()`.
   */
  @property({ attribute: false })
  storage?: AssetStorage;

  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Explicit tab selection — `null` means "use the default for the current
   * storage state" (library when a storage is attached, upload otherwise).
   * Updating only when the user explicitly clicks a tab keeps Lit's update
   * cycle out of an update→state→update loop on initial property arrival.
   */
  @state()
  private _tab: Tab | null = null;

  @state()
  private _stockTabLoaded = false;

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

  /** Library state. */
  @state()
  private _folder: string = ALL_FOLDERS;

  @state()
  private _search = '';

  @state()
  private _selectedTags: string[] = [];

  @state()
  private _folders: string[] = [];

  @state()
  private _assets: Asset[] = [];

  @state()
  private _libraryLoading = false;

  @state()
  private _libraryError = '';

  private _searchTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Monotonic token for in-flight library queries. The latest token wins so
   * a slow folder switch can't overwrite a faster subsequent search.
   */
  private _libraryToken = 0;

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
      width: 640px;
      max-width: 92vw;
      max-height: 82vh;
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
      padding: 14px 16px;
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

    .tabs {
      display: flex;
      gap: 4px;
      padding: 0 16px;
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .tab {
      background: none;
      border: none;
      padding: 10px 12px;
      cursor: pointer;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 13px;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .tab:hover {
      color: var(--pigeon-text, #1e293b);
    }

    .tab.active {
      color: var(--pigeon-primary, #3b82f6);
      border-bottom-color: var(--pigeon-primary, #3b82f6);
    }

    .body {
      padding: 16px;
      overflow-y: auto;
    }

    /* ---- Library tab ---- */

    .library-controls {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }

    .library-controls select,
    .library-controls input[type='search'] {
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 10px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #ffffff);
      outline: none;
      box-sizing: border-box;
    }

    .library-controls select {
      min-width: 140px;
    }

    .library-controls input[type='search'] {
      flex: 1;
    }

    .library-controls input[type='search']:focus,
    .library-controls select:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
    }

    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .tag-chip {
      background: var(--pigeon-surface, #f1f5f9);
      color: var(--pigeon-text-secondary, #64748b);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 11px;
      font-family: var(--pigeon-font);
      cursor: pointer;
      line-height: 1.4;
    }

    .tag-chip:hover {
      border-color: var(--pigeon-primary, #3b82f6);
      color: var(--pigeon-text, #1e293b);
    }

    .tag-chip.active {
      background: var(--pigeon-primary, #3b82f6);
      color: var(--pigeon-primary-foreground, #ffffff);
      border-color: var(--pigeon-primary, #3b82f6);
    }

    .asset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px;
    }

    .asset-card {
      cursor: pointer;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      overflow: hidden;
      background: var(--pigeon-bg, #ffffff);
      display: flex;
      flex-direction: column;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      text-align: left;
      padding: 0;
      font-family: inherit;
    }

    .asset-card:hover,
    .asset-card:focus-visible {
      border-color: var(--pigeon-primary, #3b82f6);
      box-shadow: var(--pigeon-ring-shadow);
      outline: none;
    }

    .asset-thumb {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      background: var(--pigeon-surface, #f1f5f9);
      display: block;
    }

    .asset-meta {
      padding: 6px 8px;
      font-size: 12px;
      color: var(--pigeon-text, #1e293b);
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .empty-library {
      padding: 32px 16px;
      text-align: center;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 13px;
    }

    .library-spinner {
      padding: 32px 16px;
      text-align: center;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 13px;
    }

    /* ---- Upload tab ---- */

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
      background: color-mix(in srgb, var(--pigeon-primary) 6%, transparent);
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
      color: var(--pigeon-primary-foreground, #ffffff);
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

  /* ----------------------------------------------------------------- */
  /*  Lifecycle                                                        */
  /* ----------------------------------------------------------------- */

  updated(changed: Map<string, unknown>) {
    if ((changed.has('storage') || changed.has('open')) && this.open && this.storage) {
      // Re-fetch on every (re-)open or storage swap so a new save elsewhere
      // shows up. `_loadAssets` schedules its own state writes; the getter
      // for the active tab keeps render in sync without mutating `_tab` here.
      this._loadFolders();
      this._loadAssets();
    }
  }

  private get _activeTab(): Tab {
    return this._tab ?? (this.storage ? 'library' : 'upload');
  }

  private get _hasStock(): boolean {
    const s = this.config.stock;
    return !!(s?.unsplash?.accessKey || s?.pexels?.apiKey);
  }

  /* ----------------------------------------------------------------- */
  /*  Render                                                           */
  /* ----------------------------------------------------------------- */

  render() {
    if (this.config.enabled === false) return html``;
    const hasLibrary = !!this.storage;
    const showTabs = hasLibrary || this._hasStock;
    return html`
      <div class="overlay" @click=${this._close}></div>
      <div class="modal" role="dialog" aria-label=${t('asset.title')}>
        <div class="header">
          <h3>${hasLibrary ? t('asset.title') : t('asset.title-upload')}</h3>
          <button class="close-btn" @click=${this._close} aria-label=${t('asset.close')}>&times;</button>
        </div>
        ${showTabs ? this._renderTabs(hasLibrary) : nothing}
        <div class="body">
          ${this._activeTab === 'stock' && this._hasStock
            ? this._renderStock()
            : hasLibrary && this._activeTab === 'library'
              ? this._renderLibrary()
              : this._renderUpload()}
        </div>
      </div>
    `;
  }

  private _renderTabs(hasLibrary: boolean) {
    const active = this._activeTab;
    return html`
      <div class="tabs" role="tablist">
        ${hasLibrary
          ? html`<button
              class="tab ${active === 'library' ? 'active' : ''}"
              role="tab"
              aria-selected=${active === 'library'}
              @click=${() => (this._tab = 'library')}
            >${t('asset.tab.library')}</button>`
          : nothing}
        <button
          class="tab ${active === 'upload' ? 'active' : ''}"
          role="tab"
          aria-selected=${active === 'upload'}
          @click=${() => (this._tab = 'upload')}
        >
          ${t('asset.tab.upload')}
        </button>
        ${this._hasStock
          ? html`<button
              class="tab ${active === 'stock' ? 'active' : ''}"
              role="tab"
              aria-selected=${active === 'stock'}
              @click=${this._handleStockTabClick}
            >${t('asset.tab.stock')}</button>`
          : nothing}
      </div>
    `;
  }

  private _handleStockTabClick = async () => {
    this._tab = 'stock';
    if (!this._stockTabLoaded) {
      await loadStockTab();
      this._stockTabLoaded = true;
    }
  };

  private _renderStock() {
    if (!this._stockTabLoaded) return html`<div class="library-spinner">${t('asset.loading')}</div>`;
    return html`<pigeon-stock-tab
      .config=${this.config.stock ?? {}}
      @stock-select=${(e: CustomEvent<{ url: string }>) => this._selectAsset(e.detail.url)}
    ></pigeon-stock-tab>`;
  }

  private _renderLibrary() {
    return html`
      <div class="library-controls">
        <select
          aria-label="Folder"
          .value=${this._folder}
          @change=${this._onFolderChange}
        >
          <option value=${ALL_FOLDERS}>${t('asset.folder.all')}</option>
          ${this._folders.map(
            (f) => html`<option value=${f} ?selected=${this._folder === f}>${f}</option>`,
          )}
        </select>
        <input
          type="search"
          placeholder=${t('asset.search')}
          .value=${this._search}
          aria-label=${t('asset.search')}
          @input=${this._onSearchInput}
        />
      </div>
      ${this._availableTags.length > 0
        ? html`<div class="tag-row" role="group" aria-label=${t('asset.tag-filter-label')}>
            ${this._availableTags.map(
              (tag) => html`<button
                class="tag-chip ${this._selectedTags.includes(tag) ? 'active' : ''}"
                aria-pressed=${this._selectedTags.includes(tag)}
                @click=${() => this._toggleTag(tag)}
              >${tag}</button>`,
            )}
          </div>`
        : nothing}
      ${this._libraryError
        ? html`<div class="error">${this._libraryError}</div>`
        : nothing}
      ${this._libraryLoading
        ? html`<div class="library-spinner">${t('asset.loading')}</div>`
        : this._assets.length === 0
          ? html`<div class="empty-library">
              ${this._search || this._selectedTags.length > 0 || this._folder !== ALL_FOLDERS
                ? t('asset.empty.filtered')
                : t('asset.empty.no-assets')}
            </div>`
          : html`<div class="asset-grid">
              ${this._assets.map((asset) => this._renderAssetCard(asset))}
            </div>`}
    `;
  }

  private _renderAssetCard(asset: Asset) {
    return html`<button
      class="asset-card"
      type="button"
      title=${asset.name}
      @click=${() => this._selectAsset(asset.src, asset)}
    >
      <img class="asset-thumb" src=${asset.src} alt=${asset.alt ?? ''} loading="lazy" />
      <div class="asset-meta">${asset.name}</div>
    </button>`;
  }

  private _renderUpload() {
    return html`
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
        <p>${t('asset.drop-zone.label')}</p>
        <small>${t('asset.drop-zone.hint')}</small>
      </div>
      <input
        type="file"
        id="file-input"
        accept="${this._acceptedTypes}"
        @change=${this._onFileSelected}
      />

      ${this._uploading
        ? html`<div class="progress-bar">
            <div class="progress-fill" style="width: ${this._progress}%"></div>
          </div>`
        : nothing}

      ${this._error ? html`<div class="error">${this._error}</div>` : nothing}

      <div class="separator">${t('asset.url.separator')}</div>

      <div class="url-input-group">
        <input
          type="url"
          placeholder=${t('asset.url.placeholder')}
          .value=${this._urlInput}
          @input=${(e: Event) =>
            (this._urlInput = (e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this._useUrl()}
        />
        <button @click=${this._useUrl}>${t('asset.url.use')}</button>
      </div>
    `;
  }

  /* ----------------------------------------------------------------- */
  /*  Library data                                                     */
  /* ----------------------------------------------------------------- */

  private async _loadFolders() {
    if (!this.storage) return;
    try {
      this._folders = await this.storage.listFolders();
    } catch (err) {
      // Folder load failure is non-fatal — the user can still search globally.
      this._folders = [];
      this._libraryError = err instanceof Error ? err.message : 'Failed to load folders';
    }
  }

  private async _loadAssets() {
    if (!this.storage) return;
    const token = ++this._libraryToken;
    this._libraryLoading = true;
    this._libraryError = '';
    try {
      const result = await this.storage.list({
        folder: this._folder === ALL_FOLDERS ? undefined : this._folder,
        search: this._search.trim() || undefined,
        tags: this._selectedTags.length > 0 ? this._selectedTags : undefined,
      });
      if (token !== this._libraryToken) return; // stale response
      this._assets = result;
    } catch (err) {
      if (token !== this._libraryToken) return;
      this._libraryError = err instanceof Error ? err.message : 'Failed to load assets';
      this._assets = [];
    } finally {
      if (token === this._libraryToken) {
        this._libraryLoading = false;
      }
    }
  }

  /** Distinct tags surfaced by the *current* result set. */
  private get _availableTags(): string[] {
    const tagSet = new Set<string>();
    for (const a of this._assets) {
      for (const tag of a.tags ?? []) tagSet.add(tag);
    }
    // Selected tags should always render even if the filter collapsed the
    // result set so the user can still deselect them.
    for (const tag of this._selectedTags) tagSet.add(tag);
    return Array.from(tagSet).sort();
  }

  private _onFolderChange(e: Event) {
    this._folder = (e.target as HTMLSelectElement).value;
    this._loadAssets();
  }

  private _onSearchInput(e: Event) {
    this._search = (e.target as HTMLInputElement).value;
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this._loadAssets(), SEARCH_DEBOUNCE_MS);
  }

  private _toggleTag(tag: string) {
    this._selectedTags = this._selectedTags.includes(tag)
      ? this._selectedTags.filter((t) => t !== tag)
      : [...this._selectedTags, tag];
    this._loadAssets();
  }

  /* ----------------------------------------------------------------- */
  /*  Upload (unchanged)                                                */
  /* ----------------------------------------------------------------- */

  private get _acceptedTypes(): string {
    return (
      this.config.acceptedTypes ?? [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ]
    ).join(',');
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

    const maxSize = this.config.maxFileSize ?? 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this._error = `File too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`;
      return;
    }

    const accepted = this.config.acceptedTypes ?? [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    if (!accepted.includes(file.type)) {
      this._error = `File type not accepted: ${file.type}`;
      return;
    }

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

    if (this.config.presignedUpload) {
      try {
        this._uploading = true;
        this._progress = 20;
        const params = await this.config.presignedUpload.getUploadParams(file);
        this._progress = 40;

        const method = params.method ?? 'PUT';
        const headers: Record<string, string> = { ...(params.headers ?? {}) };
        let body: BodyInit;

        if (method === 'POST') {
          const form = new FormData();
          for (const [k, v] of Object.entries(params.fields ?? {})) form.append(k, v);
          form.append('file', file);
          body = form;
        } else {
          body = file;
          const hasCT = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');
          if (!hasCT) headers['Content-Type'] = file.type;
        }

        const res = await fetch(params.uploadUrl, { method, headers, body });
        this._progress = 90;
        if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
        this._progress = 100;
        this._selectAsset(params.publicUrl);
      } catch (err) {
        this._error = err instanceof Error ? err.message : 'Upload failed';
      } finally {
        this._uploading = false;
        this._progress = 0;
      }
      return;
    }

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

  private _selectAsset(url: string, asset?: Asset) {
    this.dispatchEvent(
      new CustomEvent('asset-selected', {
        detail: { url, asset },
        bubbles: true,
        composed: true,
      }),
    );
    this._close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-asset-manager': PigeonAssetManager;
  }
}
