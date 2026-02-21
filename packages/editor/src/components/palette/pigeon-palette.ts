import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { getAllBlockDefinitions } from '@lit-pigeon/core';
import type { BlockDefinition, PigeonDocument, Selection } from '@lit-pigeon/core';
import './pigeon-palette-item.js';
import '../layers/pigeon-layers.js';

interface RowLayout {
  label: string;
  columns: number;
  icon: string;
}

const ROW_LAYOUTS: RowLayout[] = [
  { label: '1 Column', columns: 1, icon: '[=]' },
  { label: '2 Columns', columns: 2, icon: '[||]' },
  { label: '3 Columns', columns: 3, icon: '[|||]' },
  { label: '4 Columns', columns: 4, icon: '[||||]' },
];

type PaletteTab = 'content' | 'layers';

@customElement('pigeon-palette')
export class PigeonPalette extends LitElement {
  @property({ type: Object })
  doc?: PigeonDocument;

  @property({ type: Object })
  selection: Selection | null = null;

  @state()
  private _blockDefs: BlockDefinition[] = [];

  @state()
  private _activeTab: PaletteTab = 'content';

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

  render() {
    return html`
      <div class="tabs">
        <button class="tab ${this._activeTab === 'content' ? 'active' : ''}" @click=${() => this._activeTab = 'content'}>Content</button>
        <button class="tab ${this._activeTab === 'layers' ? 'active' : ''}" @click=${() => this._activeTab = 'layers'}>Layers</button>
      </div>
      <div class="tab-content">
        ${this._activeTab === 'content' ? this._renderContentTab() : this._renderLayersTab()}
      </div>
    `;
  }

  private _renderContentTab() {
    return html`
      <div class="section">
        <div class="section-header">Content</div>
        <div class="items">
          ${this._blockDefs.map(def => html`
            <pigeon-palette-item
              label="${def.label}"
              icon="${def.icon}"
              drag-type="palette-block"
              block-type="${def.type}"
            ></pigeon-palette-item>
          `)}
        </div>
      </div>

      <div class="section">
        <div class="section-header">Layout</div>
        <div class="items">
          ${ROW_LAYOUTS.map(layout => html`
            <pigeon-palette-item
              label="${layout.label}"
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
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-palette': PigeonPalette;
  }
}
