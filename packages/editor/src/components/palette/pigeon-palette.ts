import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { getAllBlockDefinitions } from '@lit-pigeon/core';
import type { BrandKit, BlockDefinition, PigeonDocument, Selection, RowLibraryStorage } from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';
import './pigeon-palette-item.js';
import '../layers/pigeon-layers.js';

/**
 * Lazily loads the brand-tab component the first time the user activates the
 * Brand tab. This keeps pigeon-brand-tab (and pigeon-font-picker) out of the
 * editor's base bundle so the 43 kB size budget is not exceeded.
 * The resolved promise is memoised so subsequent activations do not re-import.
 */
let _brandTabPromise: Promise<unknown> | null = null;
function loadBrandTab(): Promise<unknown> {
  if (!_brandTabPromise) {
    _brandTabPromise = import('./pigeon-brand-tab.js');
  }
  return _brandTabPromise;
}

let _savedTabPromise: Promise<unknown> | null = null;
function loadSavedTab(): Promise<unknown> {
  if (!_savedTabPromise) _savedTabPromise = import('./pigeon-saved-tab.js');
  return _savedTabPromise;
}

interface RowLayout {
  labelKey: string;
  columns: number;
  icon: string;
}

const ROW_LAYOUTS: RowLayout[] = [
  { labelKey: 'palette.layout.1-col', columns: 1, icon: '[=]' },
  { labelKey: 'palette.layout.2-col', columns: 2, icon: '[||]' },
  { labelKey: 'palette.layout.3-col', columns: 3, icon: '[|||]' },
  { labelKey: 'palette.layout.4-col', columns: 4, icon: '[||||]' },
];

type PaletteTab = 'content' | 'layers' | 'brand' | 'saved';

@customElement('pigeon-palette')
export class PigeonPalette extends LitElement {
  @property({ type: Object })
  doc?: PigeonDocument;

  @property({ type: Object })
  selection: Selection | null = null;

  @property({ attribute: false })
  brandKit: BrandKit | null = null;

  @property({ attribute: false })
  rowLibrary: RowLibraryStorage | null = null;

  @state()
  private _blockDefs: BlockDefinition[] = [];

  @state()
  private _activeTab: PaletteTab = 'content';

  @state()
  private _brandTabLoaded = false;

  @state()
  private _savedTabLoaded = false;

  static styles = css`
    :host {
      display: block;
      width: var(--pigeon-palette-width, 240px);
      height: 100%;
      background: var(--pigeon-bg, #ffffff);
      border-right: 1px solid var(--pigeon-border, #e2e8f0);
      overflow-y: auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
      flex-shrink: 0;
    }

    .tab {
      flex: 1;
      padding: 10px 0;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--pigeon-text-secondary, #64748b);
      cursor: pointer;
      border: none;
      background: transparent;
      font-family: var(--pigeon-font);
      transition: color 0.15s, border-color 0.15s;
      border-bottom: 2px solid transparent;
    }

    .tab:hover {
      color: var(--pigeon-text, #1e293b);
    }

    .tab:focus-visible {
      outline: none;
      box-shadow: inset var(--pigeon-ring-shadow);
    }

    .tab.active {
      color: var(--pigeon-primary, #3b82f6);
      border-bottom-color: var(--pigeon-primary, #3b82f6);
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
    }

    .section {
      padding: 12px;
    }

    .section:not(:last-child) {
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .section-header {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--pigeon-text-secondary, #64748b);
      margin-bottom: 8px;
      font-family: var(--pigeon-font);
    }

    .items {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._blockDefs = getAllBlockDefinitions();
  }

  override updated(changed: PropertyValues) {
    if (changed.has('brandKit') && !this.brandKit && this._activeTab === 'brand') {
      this._activeTab = 'content';
    }
  }

  render() {
    return html`
      <div class="tabs" role="tablist" aria-label=${t('palette.label')}>
        <button
          part="palette-tab"
          role="tab"
          id="pigeon-tab-content"
          aria-selected=${this._activeTab === 'content'}
          aria-controls="pigeon-tabpanel"
          class="tab ${this._activeTab === 'content' ? 'active' : ''}"
          @click=${() => (this._activeTab = 'content')}
        >${t('palette.tab.content')}</button>
        <button
          part="palette-tab"
          role="tab"
          id="pigeon-tab-layers"
          aria-selected=${this._activeTab === 'layers'}
          aria-controls="pigeon-tabpanel"
          class="tab ${this._activeTab === 'layers' ? 'active' : ''}"
          @click=${() => (this._activeTab = 'layers')}
        >${t('palette.tab.layers')}</button>
        ${this.brandKit
          ? html`<button
              part="palette-tab"
              role="tab"
              id="pigeon-tab-brand"
              aria-selected=${this._activeTab === 'brand'}
              aria-controls="pigeon-tabpanel"
              class="tab ${this._activeTab === 'brand' ? 'active' : ''}"
              @click=${this._handleBrandTabClick}
            >${t('palette.tab.brand')}</button>`
          : ''}
        <button
          part="palette-tab"
          role="tab"
          id="pigeon-tab-saved"
          aria-selected=${this._activeTab === 'saved'}
          aria-controls="pigeon-tabpanel"
          class="tab ${this._activeTab === 'saved' ? 'active' : ''}"
          @click=${this._handleSavedTabClick}
        >${t('palette.tab.saved')}</button>
      </div>
      <div
        class="tab-content"
        role="tabpanel"
        id="pigeon-tabpanel"
        aria-labelledby=${this._activeTab === 'content'
          ? 'pigeon-tab-content'
          : this._activeTab === 'layers'
            ? 'pigeon-tab-layers'
            : this._activeTab === 'brand'
              ? 'pigeon-tab-brand'
              : 'pigeon-tab-saved'}
      >
        ${this._activeTab === 'content'
          ? this._renderContentTab()
          : this._activeTab === 'layers'
            ? this._renderLayersTab()
            : this._activeTab === 'brand'
              ? this._renderBrandTab()
              : this._renderSavedTab()}
      </div>
    `;
  }

  private _renderContentTab() {
    return html`
      <div class="section">
        <div class="section-header">${t('palette.layout.section-content')}</div>
        <div class="items">
          ${this._blockDefs.map(def => html`
            <pigeon-palette-item part="palette-item"
              label="${def.label}"
              icon="${def.icon}"
              drag-type="palette-block"
              block-type="${def.type}"
            ></pigeon-palette-item>
          `)}
        </div>
      </div>

      <div class="section">
        <div class="section-header">${t('palette.layout.section-layout')}</div>
        <div class="items">
          ${ROW_LAYOUTS.map(layout => html`
            <pigeon-palette-item part="palette-item"
              label="${t(layout.labelKey)}"
              icon="${layout.icon}"
              drag-type="palette-row"
              column-count="${layout.columns}"
            ></pigeon-palette-item>
          `)}
        </div>
      </div>
    `;
  }

  private _renderLayersTab() {
    return html`
      <pigeon-layers
        .doc=${this.doc}
        .selection=${this.selection}
      ></pigeon-layers>
    `;
  }

  private _handleBrandTabClick = async () => {
    this._activeTab = 'brand';
    if (!this._brandTabLoaded) {
      await loadBrandTab();
      this._brandTabLoaded = true;
    }
  };

  private _renderBrandTab() {
    if (!this._brandTabLoaded) return html``;
    return html`<pigeon-brand-tab .brandKit=${this.brandKit}></pigeon-brand-tab>`;
  }

  private _handleSavedTabClick = async () => {
    this._activeTab = 'saved';
    if (!this._savedTabLoaded) {
      await loadSavedTab();
      this._savedTabLoaded = true;
    }
  };

  private _renderSavedTab() {
    if (!this._savedTabLoaded) return html``;
    return html`<pigeon-saved-tab .storage=${this.rowLibrary}></pigeon-saved-tab>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-palette': PigeonPalette;
  }
}
