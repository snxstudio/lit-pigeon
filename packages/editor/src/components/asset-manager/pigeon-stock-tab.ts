// packages/editor/src/components/asset-manager/pigeon-stock-tab.ts
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { StockConfig } from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';
import { createProviders, StockError } from './stock/index.js';
import type { StockPhoto, StockProvider } from './stock/index.js';

const SEARCH_DEBOUNCE_MS = 250;

@customElement('pigeon-stock-tab')
export class PigeonStockTab extends LitElement {
  @property({ attribute: false })
  config: StockConfig = {};

  @state() private _providers: StockProvider[] = [];
  @state() private _providerIndex = 0;
  @state() private _query = '';
  @state() private _photos: StockPhoto[] = [];
  @state() private _page = 1;
  @state() private _hasMore = false;
  @state() private _loading = false;
  @state() private _errorKey = '';

  private _token = 0;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  static styles = css`
    :host { display: block; }
    .controls { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
    input[type='search'] {
      flex: 1; height: 32px; box-sizing: border-box;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 10px; font-family: var(--pigeon-font); font-size: 13px;
      color: var(--pigeon-text, #1e293b); background: var(--pigeon-bg, #ffffff); outline: none;
    }
    input[type='search']:focus { border-color: var(--pigeon-border-focus, #3b82f6); }
    .provider-switch { display: flex; gap: 4px; }
    .provider-btn {
      height: 32px; padding: 0 10px; cursor: pointer; font-size: 12px; font-weight: 500;
      font-family: var(--pigeon-font); color: var(--pigeon-text-secondary, #64748b);
      background: var(--pigeon-surface, #f1f5f9);
      border: 1px solid var(--pigeon-border, #e2e8f0); border-radius: var(--pigeon-radius-sm, 4px);
    }
    .provider-btn.active {
      background: var(--pigeon-primary, #3b82f6); color: var(--pigeon-primary-foreground, #fff);
      border-color: var(--pigeon-primary, #3b82f6);
    }
    .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .asset-card {
      cursor: pointer; border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px); overflow: hidden; padding: 0;
      background: var(--pigeon-bg, #ffffff); display: flex; flex-direction: column;
      text-align: left; font-family: inherit;
    }
    .asset-card:hover, .asset-card:focus-visible {
      border-color: var(--pigeon-primary, #3b82f6); box-shadow: var(--pigeon-ring-shadow); outline: none;
    }
    .asset-thumb {
      width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block;
      background: var(--pigeon-surface, #f1f5f9);
    }
    .stock-credit {
      padding: 5px 8px; font-size: 11px; line-height: 1.3;
      color: var(--pigeon-text-secondary, #64748b);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .stock-credit a { color: inherit; text-decoration: underline; }
    .stock-idle, .empty-library, .library-spinner {
      padding: 32px 16px; text-align: center; font-size: 13px;
      color: var(--pigeon-text-secondary, #64748b);
    }
    .error { color: var(--pigeon-danger, #ef4444); font-size: 13px; margin: 8px 0; }
    .load-more {
      display: block; margin: 14px auto 0; height: 32px; padding: 0 16px; cursor: pointer;
      font-family: var(--pigeon-font); font-size: 13px; font-weight: 500;
      color: var(--pigeon-text, #1e293b); background: var(--pigeon-surface, #f1f5f9);
      border: 1px solid var(--pigeon-border, #e2e8f0); border-radius: var(--pigeon-radius-sm, 4px);
    }
  `;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('config')) {
      this._providers = createProviders(this.config);
      if (this._providerIndex >= this._providers.length) this._providerIndex = 0;
    }
  }

  private get _provider(): StockProvider | undefined {
    return this._providers[this._providerIndex];
  }

  render() {
    return html`
      <div class="controls">
        ${this._providers.length > 1
          ? html`<div class="provider-switch" role="group">
              ${this._providers.map(
                (p, i) => html`<button
                  class="provider-btn ${i === this._providerIndex ? 'active' : ''}"
                  @click=${() => this._switchProvider(i)}
                >${p.label}</button>`,
              )}
            </div>`
          : nothing}
        <input
          type="search"
          placeholder=${t('asset.stock.search')}
          aria-label=${t('asset.stock.search')}
          .value=${this._query}
          @input=${this._onInput}
        />
      </div>
      ${this._renderBody()}
    `;
  }

  private _renderBody() {
    if (this._errorKey) return html`<div class="error">${t(this._errorKey)}</div>`;
    if (this._loading && this._photos.length === 0)
      return html`<div class="library-spinner">${t('asset.loading')}</div>`;
    if (!this._query.trim()) return html`<div class="stock-idle">${t('asset.stock.idle')}</div>`;
    if (this._photos.length === 0) return html`<div class="empty-library">${t('asset.stock.empty')}</div>`;
    return html`
      <div class="asset-grid">${this._photos.map((p) => this._renderCard(p))}</div>
      ${this._hasMore
        ? html`<button class="load-more" @click=${this._loadMore}>${t('asset.stock.load-more')}</button>`
        : nothing}
    `;
  }

  private _renderCard(photo: StockPhoto) {
    const label = this._providers.find((p) => p.id === photo.provider)?.label ?? photo.provider;
    return html`<button class="asset-card" type="button" @click=${() => this._pick(photo)}>
      <img class="asset-thumb" src=${photo.thumbUrl} alt=${photo.alt} loading="lazy" />
      <div class="stock-credit">
        ${t('asset.stock.photo-by')}
        <a href=${photo.photographerUrl} target="_blank" rel="noopener"
          @click=${(e: Event) => e.stopPropagation()}>${photo.photographerName}</a>
        ${t('asset.stock.on')}
        <a href=${photo.providerUrl} target="_blank" rel="noopener"
          @click=${(e: Event) => e.stopPropagation()}>${label}</a>
      </div>
    </button>`;
  }

  private _onInput(e: Event) {
    this._query = (e.target as HTMLInputElement).value;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this._runSearch(1, false), SEARCH_DEBOUNCE_MS);
  }

  private async _runSearch(page: number, append: boolean) {
    const provider = this._provider;
    const q = this._query.trim();
    if (!provider || !q) {
      this._photos = [];
      this._hasMore = false;
      this._errorKey = '';
      return;
    }
    const token = ++this._token;
    this._loading = true;
    this._errorKey = '';
    try {
      const result = await provider.search(q, page);
      if (token !== this._token) return;
      this._photos = append ? [...this._photos, ...result.photos] : result.photos;
      this._page = result.page;
      this._hasMore = result.hasMore;
    } catch (err) {
      if (token !== this._token) return;
      const status = err instanceof StockError ? err.status : 0;
      this._errorKey = status === 429 || status === 403 ? 'asset.stock.rate-limited' : 'asset.stock.error';
      if (!append) this._photos = [];
    } finally {
      if (token === this._token) this._loading = false;
    }
  }

  private _loadMore() {
    this._runSearch(this._page + 1, true);
  }

  private _switchProvider(index: number) {
    if (index === this._providerIndex) return;
    this._providerIndex = index;
    this._photos = [];
    this._errorKey = '';
    this._runSearch(1, false);
  }

  private _pick(photo: StockPhoto) {
    void this._provider?.trackDownload(photo);
    this.dispatchEvent(
      new CustomEvent('stock-select', {
        detail: { url: photo.fullUrl },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-stock-tab': PigeonStockTab;
  }
}
