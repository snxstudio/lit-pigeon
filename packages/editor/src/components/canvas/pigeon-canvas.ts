import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PigeonDocument, Selection, RowNode } from '@lit-pigeon/core';
import { getDragData, clearDragData } from '../../dnd/drag-manager.js';
import { calculateRowDropIndex } from '../../dnd/drop-zones.js';
import './pigeon-row.js';
import './pigeon-drop-indicator.js';

@customElement('pigeon-canvas')
export class PigeonCanvas extends LitElement {
  @property({ type: Object })
  doc!: PigeonDocument;

  @property({ type: Object })
  selection: Selection | null = null;

  @property({ type: Number, attribute: 'preview-width' })
  previewWidth = 0;

  @state()
  private _rowDropIndex = -1;

  @state()
  private _isDragOver = false;

  static styles = css`
    :host {
      display: block;
      flex: 1;
      height: 100%;
      overflow: auto;
      background: var(--pigeon-canvas-bg, #e2e8f0);
    }

    .canvas-scroll {
      display: flex;
      justify-content: center;
      padding: 24px;
      min-height: 100%;
      box-sizing: border-box;
    }

    .canvas-area {
      width: 100%;
      max-width: var(--canvas-width, 600px);
      background: white;
      box-shadow: var(--pigeon-shadow-md);
      border-radius: var(--pigeon-radius, 6px);
      min-height: 200px;
      position: relative;
    }

    .rows-container {
      min-height: 100px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      text-align: center;
      padding: 40px;
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.3;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--pigeon-text, #1e293b);
    }

    .empty-state p {
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
    }

    .empty-state.drag-over {
      background: rgba(59, 130, 246, 0.04);
      border: 2px dashed var(--pigeon-drop-color, #3b82f6);
      border-radius: var(--pigeon-radius, 6px);
    }
  `;

  render() {
    if (!this.doc) return html``;

    const bodyWidth = this.previewWidth || this.doc.body.attributes.width || 600;
    const bgColor = this.doc.body.attributes.backgroundColor;
    const rows = this.doc.body.rows;

    return html`
      <div
        class="canvas-scroll"
        style="background: ${bgColor};"
        @click=${this._onCanvasClick}
      >
        <div
          class="canvas-area"
          style="--canvas-width: ${bodyWidth}px; max-width: ${bodyWidth}px; font-family: ${this.doc.body.attributes.fontFamily};"
          @dragover=${this._onDragOver}
          @dragleave=${this._onDragLeave}
          @drop=${this._onDrop}
        >
          ${rows.length === 0
            ? html`
              <div class="empty-state ${this._isDragOver ? 'drag-over' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <h3>Start building your email</h3>
                <p>Drag a layout or content block from the left panel,<br>or drop one here to get started.</p>
              </div>
            `
            : html`
              <div class="rows-container">
                ${rows.map((row: RowNode, index: number) => html`
                  <pigeon-drop-indicator
                    ?visible=${this._isDragOver && this._rowDropIndex === index}
                  ></pigeon-drop-indicator>
                  <pigeon-row
                    .row=${row}
                    .index=${index}
                    .totalRows=${rows.length}
                    .selection=${this.selection}
                  ></pigeon-row>
                `)}
                <pigeon-drop-indicator
                  ?visible=${this._isDragOver && this._rowDropIndex === rows.length}
                ></pigeon-drop-indicator>
              </div>
            `}
        </div>
      </div>
    `;
  }

  private _onCanvasClick(e: Event) {
    // If clicking on the canvas background (not on a row/block), select body
    const path = e.composedPath();
    const isElementClick = path.some(
      (el) =>
        el instanceof HTMLElement &&
        (el.tagName.toLowerCase() === 'pigeon-row' ||
         el.tagName.toLowerCase().endsWith('-block'))
    );
    if (!isElementClick) {
      this.dispatchEvent(new CustomEvent('canvas-select-body', {
        bubbles: true,
        composed: true,
      }));
    }
  }

  private _onDragOver(e: DragEvent) {
    const dragData = getDragData();
    if (!dragData) return;

    // Accept row drops and block drops (blocks into empty canvas go as new row)
    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    this._isDragOver = true;

    // For row drops, calculate row drop position
    if (dragData.type === 'palette-row' || this.doc.body.rows.length === 0) {
      const rowElements = Array.from(
        this.renderRoot.querySelectorAll('pigeon-row')
      ) as HTMLElement[];
      this._rowDropIndex = calculateRowDropIndex(e.clientY, rowElements);
    }
  }

  private _onDragLeave(e: DragEvent) {
    const rect = this.renderRoot.querySelector('.canvas-area')?.getBoundingClientRect();
    if (rect &&
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      return;
    }
    this._isDragOver = false;
    this._rowDropIndex = -1;
  }

  private _onDrop(e: DragEvent) {
    e.preventDefault();

    const dragData = getDragData();
    if (!dragData) return;

    // Handle row drops
    if (dragData.type === 'palette-row') {
      const index = this._rowDropIndex >= 0 ? this._rowDropIndex : this.doc.body.rows.length;
      this.dispatchEvent(new CustomEvent('row-drop', {
        detail: {
          index,
          columnCount: dragData.columnCount ?? 1,
        },
        bubbles: true,
        composed: true,
      }));
    }

    // Handle block drop on empty canvas (auto-create row first)
    if (dragData.type === 'palette-block' && this.doc.body.rows.length === 0) {
      this.dispatchEvent(new CustomEvent('block-drop-new-row', {
        detail: {
          blockType: dragData.blockType,
          rowIndex: 0,
        },
        bubbles: true,
        composed: true,
      }));
    }

    this._isDragOver = false;
    this._rowDropIndex = -1;
    clearDragData();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-canvas': PigeonCanvas;
  }
}
