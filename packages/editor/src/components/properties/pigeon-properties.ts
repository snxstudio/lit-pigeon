import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type {
  PigeonDocument,
  RowNode,
  ContentBlock,
  Selection,
  MergeTag,
  AssetManagerConfig,
  AssetStorage,
  BrandKit,
  BrandColor,
  BrandFont,
} from '@lit-pigeon/core';
import { getBlockDefinition } from '@lit-pigeon/core';
import './panels/text-panel.js';
import './panels/image-panel.js';
import './panels/button-panel.js';
import './panels/row-panel.js';
import './panels/body-panel.js';
import './panels/hero-panel.js';
import './panels/navbar-panel.js';
import './panels/divider-panel.js';
import './panels/spacer-panel.js';
import './panels/social-panel.js';
import './panels/html-panel.js';
import './panels/custom-panel.js';

@customElement('pigeon-properties')
export class PigeonProperties extends LitElement {
  @property({ type: Object })
  doc!: PigeonDocument;

  @property({ type: Object })
  selection: Selection | null = null;

  @property({ type: Array })
  mergeTags: MergeTag[] = [];

  @property({ attribute: false })
  assetManagerConfig?: AssetManagerConfig;

  @property({ attribute: false })
  assetStorage?: AssetStorage;

  @property({ attribute: false })
  brandKit: BrandKit | null = null;

  private get _swatches(): BrandColor[] {
    return this.brandKit?.colors ?? [];
  }

  private get _brandFonts(): BrandFont[] {
    return this.brandKit?.fonts ?? [];
  }

  static styles = css`
    :host {
      display: block;
      width: var(--pigeon-properties-width, 300px);
      height: 100%;
      background: var(--pigeon-bg, #ffffff);
      border-left: 1px solid var(--pigeon-border, #e2e8f0);
      overflow-y: auto;
      box-sizing: border-box;
    }

    .panel-wrapper {
      padding: 16px;
    }

    /* Parent-selection breadcrumb shown above block/column panels so the
       row (and column) that contain the selected block are always reachable
       in one click — clicking a block on the canvas selects the block, and
       this trail is how you step back out to its parent. */
    .breadcrumb {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
      margin-bottom: 12px;
      font-family: var(--pigeon-font);
      font-size: 11px;
    }

    .breadcrumb .crumb {
      background: none;
      border: none;
      padding: 2px 6px;
      border-radius: var(--pigeon-radius-sm, 4px);
      color: var(--pigeon-primary, #4f46e5);
      cursor: pointer;
      font: inherit;
      font-weight: 500;
    }

    .breadcrumb .crumb:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
    }

    .breadcrumb .crumb.current {
      color: var(--pigeon-text-secondary, #64748b);
      cursor: default;
    }

    .breadcrumb .crumb.current:hover {
      background: none;
    }

    .breadcrumb .sep {
      color: var(--pigeon-text-muted, #94a3b8);
      font-size: 10px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      text-align: center;
      padding: 24px;
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.4;
    }

    .empty-state p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
    }
  `;

  render() {
    if (!this.doc) return html``;

    // If no selection or body selection, show body panel
    if (!this.selection || this.selection.type === 'body') {
      return html`
        <div class="panel-wrapper" part="panel">
          <pigeon-body-panel
            .doc=${this.doc}
            .mergeTags=${this.mergeTags}
            .swatches=${this._swatches}
            .brandFonts=${this._brandFonts}
          ></pigeon-body-panel>
        </div>
      `;
    }

    if (this.selection.type === 'row' && this.selection.rowId) {
      const row = this._findRow(this.selection.rowId);
      if (row) {
        return html`
          <div class="panel-wrapper" part="panel">
            <pigeon-row-panel .row=${row}></pigeon-row-panel>
          </div>
        `;
      }
    }

    if (this.selection.type === 'block' && this.selection.rowId && this.selection.columnId && this.selection.blockId) {
      const block = this._findBlock(this.selection.rowId, this.selection.columnId, this.selection.blockId);
      if (block) {
        return html`
          <div class="panel-wrapper" part="panel">
            ${this._renderBreadcrumb(this.selection.rowId, this.selection.columnId, this._blockLabel(block))}
            ${this._renderBlockPanel(block, this.selection.rowId, this.selection.columnId)}
          </div>
        `;
      }
    }

    if (this.selection.type === 'column') {
      return html`
        <div class="panel-wrapper" part="panel">
          ${this.selection.rowId && this.selection.columnId
            ? this._renderBreadcrumb(this.selection.rowId, this.selection.columnId)
            : ''}
          <div class="empty-state">
            <p>Column selected. Select a block within the column to edit its properties.</p>
          </div>
        </div>
      `;
    }

    return html`
      <div class="panel-wrapper" part="panel">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
          </svg>
          <p>Select an element on the canvas to edit its properties</p>
        </div>
      </div>
    `;
  }

  /**
   * Renders the parent-selection trail. `Row` is always a clickable jump to
   * the parent row. When a block is selected (`current` set), `Column` is also
   * clickable and the block label is the trailing, non-interactive crumb. For
   * a column selection (`current` omitted) `Column` is the trailing crumb.
   */
  private _renderBreadcrumb(rowId: string, columnId?: string, current?: string) {
    return html`
      <nav class="breadcrumb" aria-label="Selection path">
        <button class="crumb" title="Select row" @click=${() => this._select('row-select', { rowId })}>
          Row
        </button>
        ${columnId
          ? html`
              <span class="sep" aria-hidden="true">▸</span>
              ${current
                ? html`<button
                    class="crumb"
                    title="Select column"
                    @click=${() => this._select('column-select', { rowId, columnId })}
                  >
                    Column
                  </button>`
                : html`<span class="crumb current">Column</span>`}
            `
          : ''}
        ${current
          ? html`<span class="sep" aria-hidden="true">▸</span>
              <span class="crumb current">${current}</span>`
          : ''}
      </nav>
    `;
  }

  private _select(type: 'row-select' | 'column-select', detail: Record<string, string>) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private _blockLabel(block: ContentBlock): string {
    const labels: Record<string, string> = {
      text: 'Text', image: 'Image', button: 'Button', divider: 'Divider',
      spacer: 'Spacer', social: 'Social', html: 'HTML', hero: 'Hero', navbar: 'Navbar',
    };
    const type = (block as { type: string }).type;
    return labels[type] ?? getBlockDefinition(type)?.label ?? type;
  }

  private _renderBlockPanel(block: ContentBlock, rowId: string, columnId: string) {
    switch (block.type) {
      case 'text':
        return html`<pigeon-text-panel .block=${block} .rowId=${rowId} .columnId=${columnId} .mergeTags=${this.mergeTags}></pigeon-text-panel>`;
      case 'image':
        return html`<pigeon-image-panel
          .block=${block}
          .rowId=${rowId}
          .columnId=${columnId}
          .assetManagerConfig=${this.assetManagerConfig}
          .assetStorage=${this.assetStorage}
        ></pigeon-image-panel>`;
      case 'button':
        return html`<pigeon-button-panel .block=${block} .rowId=${rowId} .columnId=${columnId} .swatches=${this._swatches}></pigeon-button-panel>`;
      case 'hero':
        return html`<pigeon-hero-panel
          .block=${block}
          .rowId=${rowId}
          .columnId=${columnId}
          .assetManagerConfig=${this.assetManagerConfig}
          .assetStorage=${this.assetStorage}
          .swatches=${this._swatches}
        ></pigeon-hero-panel>`;
      case 'navbar':
        return html`<pigeon-navbar-panel .block=${block} .rowId=${rowId} .columnId=${columnId} .swatches=${this._swatches}></pigeon-navbar-panel>`;
      case 'divider':
        return html`<pigeon-divider-panel .block=${block} .rowId=${rowId} .columnId=${columnId} .swatches=${this._swatches}></pigeon-divider-panel>`;
      case 'spacer':
        return html`<pigeon-spacer-panel .block=${block} .rowId=${rowId} .columnId=${columnId}></pigeon-spacer-panel>`;
      case 'social':
        return html`<pigeon-social-panel .block=${block} .rowId=${rowId} .columnId=${columnId}></pigeon-social-panel>`;
      case 'html':
        return html`<pigeon-html-panel .block=${block} .rowId=${rowId} .columnId=${columnId} .mergeTags=${this.mergeTags}></pigeon-html-panel>`;
      default: {
        const unknownType = (block as { type?: string }).type ?? 'unknown';
        const def = getBlockDefinition(unknownType);
        // Registry blocks that declare a property schema get a generic form.
        if (def?.propertySchema && def.propertySchema.length > 0) {
          return html`<pigeon-custom-panel
            .block=${block}
            .rowId=${rowId}
            .columnId=${columnId}
            .label=${def.label}
            .schema=${def.propertySchema}
          ></pigeon-custom-panel>`;
        }
        return html`
          <div class="empty-state">
            <p>
              No property editor available for
              "${def?.label ?? unknownType}" blocks yet.
            </p>
          </div>
        `;
      }
    }
  }

  private _findRow(rowId: string): RowNode | undefined {
    return this.doc.body.rows.find(r => r.id === rowId);
  }

  private _findBlock(rowId: string, columnId: string, blockId: string): ContentBlock | undefined {
    const row = this._findRow(rowId);
    if (!row) return undefined;
    const col = row.columns.find(c => c.id === columnId);
    if (!col) return undefined;
    return col.blocks.find(b => b.id === blockId);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-properties': PigeonProperties;
  }
}
