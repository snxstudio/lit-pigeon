import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PigeonDocument, RowNode, ContentBlock, Selection } from '@lit-pigeon/core';
import './panels/text-panel.js';
import './panels/image-panel.js';
import './panels/button-panel.js';
import './panels/row-panel.js';
import './panels/body-panel.js';

@customElement('pigeon-properties')
export class PigeonProperties extends LitElement {
  @property({ type: Object })
  doc!: PigeonDocument;

  @property({ type: Object })
  selection: Selection | null = null;

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
        <div class="panel-wrapper">
          <pigeon-body-panel .doc=${this.doc}></pigeon-body-panel>
        </div>
      `;
    }

    if (this.selection.type === 'row' && this.selection.rowId) {
      const row = this._findRow(this.selection.rowId);
      if (row) {
        return html`
          <div class="panel-wrapper">
            <pigeon-row-panel .row=${row}></pigeon-row-panel>
          </div>
        `;
      }
    }

    if (this.selection.type === 'block' && this.selection.rowId && this.selection.columnId && this.selection.blockId) {
      const block = this._findBlock(this.selection.rowId, this.selection.columnId, this.selection.blockId);
      if (block) {
        return html`
          <div class="panel-wrapper">
            ${this._renderBlockPanel(block, this.selection.rowId, this.selection.columnId)}
          </div>
        `;
      }
    }

    if (this.selection.type === 'column') {
      return html`
        <div class="panel-wrapper">
          <div class="empty-state">
            <p>Column selected. Select a block within the column to edit its properties.</p>
          </div>
        </div>
      `;
    }

    return html`
      <div class="panel-wrapper">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/>
          </svg>
          <p>Select an element on the canvas to edit its properties</p>
        </div>
      </div>
    `;
  }

  private _renderBlockPanel(block: ContentBlock, rowId: string, columnId: string) {
    switch (block.type) {
      case 'text':
        return html`<pigeon-text-panel .block=${block} .rowId=${rowId} .columnId=${columnId}></pigeon-text-panel>`;
      case 'image':
        return html`<pigeon-image-panel .block=${block} .rowId=${rowId} .columnId=${columnId}></pigeon-image-panel>`;
      case 'button':
        return html`<pigeon-button-panel .block=${block} .rowId=${rowId} .columnId=${columnId}></pigeon-button-panel>`;
      default:
        return html`
          <div class="empty-state">
            <p>No property editor available for "${block.type}" blocks yet.</p>
          </div>
        `;
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
