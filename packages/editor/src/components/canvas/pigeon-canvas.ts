import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { PigeonDocument, Selection, RowNode } from '@lit-pigeon/core';
import { getDragData, clearDragData } from '../../dnd/drag-manager.js';
import { calculateRowDropIndex, resolveReorderTarget } from '../../dnd/drop-zones.js';
import './pigeon-row.js';
import './pigeon-drop-indicator.js';

@customElement('pigeon-canvas')
export class PigeonCanvas extends LitElement {
  @property({ type: Object })
  doc!: PigeonDocument;

  @property({ type: Object })
  selection: Selection | null = null;

  @property({ type: String, attribute: 'editing-block-id' })
  editingBlockId: string | null = null;

  @property({ type: Number, attribute: 'preview-width' })
  previewWidth = 0;

  /**
   * Active device preset. Drives the device-frame chrome around the canvas;
   * `desktop` shows no frame, `tablet`/`mobile` wrap the sheet in a bezel.
   */
  @property({ type: String })
  device: 'desktop' | 'tablet' | 'mobile' = 'desktop';

  @state()
  private _rowDropIndex = -1;

  @state()
  private _isDragOver = false;

  /** Row currently under the pointer, or null. Drives which single row shows
   *  its action bar so adjacent rows' bars never overlap. */
  @state()
  private _hoveredRowId: string | null = null;

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
      flex-direction: column;
      align-items: center;
      padding: 24px;
      min-height: 100%;
      box-sizing: border-box;
    }

    /* Device-preview chrome (tablet / mobile) */
    .device-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 4px 12px;
      border-radius: var(--pigeon-radius-lg, 12px);
      background: var(--pigeon-bg, #ffffff);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      box-shadow: var(--pigeon-shadow-sm);
      font-family: var(--pigeon-font);
      font-size: 12px;
      font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
    }

    .device-frame {
      background: #0f172a;
      box-shadow: var(--pigeon-shadow-lg);
      display: inline-block;
      position: relative;
    }

    .device-frame--mobile {
      padding: 14px 12px;
      border-radius: 40px;
    }

    .device-frame--tablet {
      padding: 18px;
      border-radius: 28px;
    }

    /* Speaker / camera notch */
    .device-frame::before {
      content: '';
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 46px;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.18);
    }

    .device-frame .canvas-area {
      border-radius: 20px;
      overflow: hidden;
      box-shadow: none;
      margin-top: 6px;
    }

    .device-frame--tablet .canvas-area {
      border-radius: 8px;
      margin-top: 4px;
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
      background: color-mix(in srgb, var(--pigeon-drop-color, #3b82f6) 6%, transparent);
      border: 2px dashed var(--pigeon-drop-color, #3b82f6);
      border-radius: var(--pigeon-radius, 6px);
    }
  `;

  render() {
    if (!this.doc) return html``;

    const bodyWidth = this.previewWidth || this.doc.body.attributes.width || 600;
    const bgColor = this.doc.body.attributes.backgroundColor;
    const framed = this.device !== 'desktop';
    const area = this._renderCanvasArea(bodyWidth, framed ? bgColor : undefined);

    return html`
      <div
        class="canvas-scroll"
        style=${framed ? '' : `background: ${bgColor};`}
        @click=${this._onCanvasClick}
        @mouseover=${this._onPointerOverRow}
      >
        ${framed
          ? html`
              <div class="device-bar">
                <span>${this.device === 'mobile' ? 'Mobile' : 'Tablet'}</span>
                <span aria-hidden="true">·</span>
                <span>${bodyWidth}px</span>
              </div>
              <div
                class="device-frame device-frame--${this.device}"
                role="img"
                aria-label="${this.device} preview frame"
              >
                ${area}
              </div>
            `
          : area}
      </div>
    `;
  }

  /**
   * The email "sheet" — the canvas-area and its rows. Rendered standalone on
   * desktop, or nested inside a device frame for tablet/mobile. When framed,
   * `bg` paints the document background onto the sheet itself (the area behind
   * the frame stays neutral).
   */
  private _renderCanvasArea(bodyWidth: number, bg?: string) {
    const rows = this.doc.body.rows;
    const bgStyle = bg ? `background: ${bg};` : '';
    // Only one row shows its action bar at a time: the hovered row, or the
    // selected row when nothing is hovered. Prevents adjacent bars overlapping.
    const selectedRowId = this.selection?.type === 'row' ? this.selection.rowId : null;
    return html`
      <div
        class="canvas-area"
        part="canvas-area"
        style="--canvas-width: ${bodyWidth}px; max-width: ${bodyWidth}px; font-family: ${this.doc.body.attributes.fontFamily}; ${bgStyle}"
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        ${rows.length === 0
          ? html`
              <div class="empty-state ${this._isDragOver ? 'drag-over' : ''}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <h3>Start building your email</h3>
                <p>Drag a layout or content block from the left panel,<br />or drop one here to get started.</p>
              </div>
            `
          : html`
              <div class="rows-container">
                ${rows.map(
                  (row: RowNode, index: number) => html`
                    <pigeon-drop-indicator
                      ?visible=${this._isDragOver && this._rowDropIndex === index}
                    ></pigeon-drop-indicator>
                    <pigeon-row
                      .row=${row}
                      .index=${index}
                      .totalRows=${rows.length}
                      .selection=${this.selection}
                      .editingBlockId=${this.editingBlockId}
                      ?show-actions=${this._hoveredRowId === row.id ||
                      (this._hoveredRowId === null && selectedRowId === row.id)}
                    ></pigeon-row>
                  `,
                )}
                <pigeon-drop-indicator
                  ?visible=${this._isDragOver && this._rowDropIndex === rows.length}
                ></pigeon-drop-indicator>
              </div>
            `}
      </div>
    `;
  }

  /**
   * Tracks the row under the pointer by walking the composed path for the
   * nearest `<pigeon-row>`. Because the action bar is a DOM child of the row
   * (even though it sits in the outer margin), hovering the bar still resolves
   * to that row, so it stays visible. Over empty canvas it resolves to null,
   * falling back to the selected row.
   */
  private _onPointerOverRow = (e: Event) => {
    const rowEl = e.composedPath().find(
      (el) => el instanceof HTMLElement && el.tagName.toLowerCase() === 'pigeon-row'
    ) as (HTMLElement & { row?: RowNode }) | undefined;
    const id = rowEl?.row?.id ?? null;
    if (id !== this._hoveredRowId) this._hoveredRowId = id;
  };

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

    e.preventDefault();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = dragData.type === 'existing-row' ? 'move' : 'copy';
    }

    this._isDragOver = true;

    if (
      dragData.type === 'palette-row' ||
      dragData.type === 'existing-row' ||
      dragData.type === 'library-row' ||
      this.doc.body.rows.length === 0
    ) {
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
    if (!dragData) {
      this._resetDragState();
      return;
    }

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
    } else if (dragData.type === 'library-row' && dragData.node) {
      const index = this._rowDropIndex >= 0 ? this._rowDropIndex : this.doc.body.rows.length;
      this.dispatchEvent(new CustomEvent('row-insert-saved', {
        detail: { index, node: dragData.node },
        bubbles: true,
        composed: true,
      }));
    } else if (dragData.type === 'existing-row' && dragData.rowId) {
      const sourceIndex = this.doc.body.rows.findIndex(r => r.id === dragData.rowId);
      const dropIndex = this._rowDropIndex >= 0 ? this._rowDropIndex : this.doc.body.rows.length;
      const targetIndex = resolveReorderTarget(sourceIndex, dropIndex);
      if (targetIndex !== null) {
        this.dispatchEvent(new CustomEvent('row-move', {
          detail: { rowId: dragData.rowId, toIndex: targetIndex },
          bubbles: true,
          composed: true,
        }));
      }
    } else if (dragData.type === 'palette-block' && this.doc.body.rows.length === 0) {
      this.dispatchEvent(new CustomEvent('block-drop-new-row', {
        detail: {
          blockType: dragData.blockType,
          rowIndex: 0,
        },
        bubbles: true,
        composed: true,
      }));
    }

    this._resetDragState();
  }

  private _resetDragState() {
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
