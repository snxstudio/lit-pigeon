import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { PigeonDocument, RowNode, ColumnNode, ContentBlock, Selection } from '@lit-pigeon/core';

const BLOCK_ICONS: Record<string, string> = {
  text: 'T',
  image: 'Img',
  button: 'Btn',
  divider: '---',
  spacer: '[ ]',
  social: '@',
  html: '</>',
  hero: 'H',
  navbar: 'Nav',
};

@customElement('pigeon-layers')
export class PigeonLayers extends LitElement {
  @property({ type: Object })
  doc?: PigeonDocument;

  @property({ type: Object })
  selection: Selection | null = null;

  static styles = css`
    :host {
      display: block;
      font-family: var(--pigeon-font);
      font-size: 13px;
    }

    .tree {
      padding: 8px 0;
    }

    .tree-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      cursor: pointer;
      border-radius: var(--pigeon-radius-sm, 4px);
      transition: background 0.1s;
      color: var(--pigeon-text, #1e293b);
    }

    .tree-item:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
    }

    .tree-item.selected {
      background: rgba(59, 130, 246, 0.1);
      color: var(--pigeon-primary, #3b82f6);
    }

    .tree-item .icon {
      width: 24px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      background: var(--pigeon-surface, #f8fafc);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: 3px;
      flex-shrink: 0;
    }

    .tree-item .label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .indent-1 { padding-left: 20px; }
    .indent-2 { padding-left: 36px; }
    .indent-3 { padding-left: 52px; }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--pigeon-text-secondary, #64748b);
      padding: 8px 8px 4px;
    }
  `;

  render() {
    if (!this.doc) return html``;

    return html`
      <div class="tree">
        <div class="section-label">Document Structure</div>
        ${this.doc.body.rows.map((row, ri) => this._renderRow(row, ri))}
      </div>
    `;
  }

  private _renderRow(row: RowNode, rowIndex: number) {
    const isSelected = this.selection?.type === 'row' && this.selection.rowId === row.id;

    return html`
      <div
        class="tree-item indent-1 ${isSelected ? 'selected' : ''}"
        @click=${() => this._selectRow(row.id)}
      >
        <span class="icon">R</span>
        <span class="label">Row ${rowIndex + 1}</span>
      </div>
      ${row.columns.map((col, ci) => this._renderColumn(col, row.id, ci))}
    `;
  }

  private _renderColumn(col: ColumnNode, rowId: string, _colIndex: number) {
    return html`
      ${col.blocks.map((block) => this._renderBlock(block, rowId, col.id))}
    `;
  }

  private _renderBlock(block: ContentBlock, rowId: string, columnId: string) {
    const isSelected = this.selection?.type === 'block' && this.selection.blockId === block.id;
    const icon = BLOCK_ICONS[block.type] ?? '?';
    const label = block.type.charAt(0).toUpperCase() + block.type.slice(1);

    return html`
      <div
        class="tree-item indent-3 ${isSelected ? 'selected' : ''}"
        @click=${() => this._selectBlock(rowId, columnId, block.id)}
      >
        <span class="icon">${icon}</span>
        <span class="label">${label}</span>
      </div>
    `;
  }

  private _selectRow(rowId: string) {
    this.dispatchEvent(new CustomEvent('row-select', {
      detail: { rowId },
      bubbles: true,
      composed: true,
    }));
  }

  private _selectBlock(_rowId: string, _columnId: string, blockId: string) {
    this.dispatchEvent(new CustomEvent('block-select', {
      detail: { blockId },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-layers': PigeonLayers;
  }
}
