import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { RowNode, Selection } from '@lit-pigeon/core';
import { writeDragTransfer, clearDragData } from '../../dnd/drag-manager.js';
import './pigeon-column.js';

@customElement('pigeon-row')
export class PigeonRow extends LitElement {
  @property({ type: Object })
  row!: RowNode;

  @property({ type: Number })
  index = 0;

  @property({ type: Number, attribute: 'total-rows' })
  totalRows = 0;

  @property({ type: Object })
  selection: Selection | null = null;

  @property({ type: String, attribute: 'editing-block-id' })
  editingBlockId: string | null = null;

  @state()
  private _dragging = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    .row-wrapper {
      position: relative;
      transition: outline 0.15s ease, opacity 0.15s ease;
      outline: 2px solid transparent;
      outline-offset: -2px;
    }

    .row-wrapper.dragging {
      opacity: 0.4;
    }

    .drag-handle {
      cursor: grab;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .row-wrapper.selected {
      outline: 2px solid var(--pigeon-selected-outline, #3b82f6);
    }

    .row-wrapper:hover:not(.selected) {
      outline: 1px dashed var(--pigeon-border, #e2e8f0);
    }

    .columns {
      display: flex;
      width: 100%;
    }

    .column-wrapper {
      box-sizing: border-box;
    }

    .column-wrapper:not(:last-child) {
      border-right: 1px dashed
        color-mix(in srgb, var(--pigeon-border, #e2e8f0) 70%, transparent);
    }

    /* Row action buttons */
    .actions {
      position: absolute;
      top: -1px;
      right: -40px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      z-index: 10;
    }

    :host(:hover) .actions,
    .row-wrapper.selected .actions {
      opacity: 1;
      pointer-events: auto;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      background: var(--pigeon-bg, #ffffff);
      cursor: pointer;
      color: var(--pigeon-text-secondary, #64748b);
      transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
      padding: 0;
      box-shadow: var(--pigeon-shadow-sm);
    }

    .action-btn:hover {
      color: var(--pigeon-text, #1e293b);
      border-color: var(--pigeon-text-secondary, #64748b);
      background: var(--pigeon-surface, #f8fafc);
    }

    .action-btn:focus-visible {
      outline: none;
      box-shadow: var(--pigeon-ring-shadow);
      z-index: 1;
    }

    .action-btn.danger:hover {
      color: var(--pigeon-danger, #ef4444);
      border-color: var(--pigeon-danger, #ef4444);
      background: color-mix(in srgb, var(--pigeon-danger, #ef4444) 8%, transparent);
    }

    .action-btn svg {
      width: 14px;
      height: 14px;
    }

    .row-label {
      position: absolute;
      top: -1px;
      left: -40px;
      font-size: 10px;
      font-weight: 600;
      color: var(--pigeon-primary-foreground, #ffffff);
      background: var(--pigeon-primary, #3b82f6);
      padding: 2px 6px;
      border-radius: 3px 0 0 3px;
      font-family: var(--pigeon-font);
      opacity: 0;
      transition: opacity 0.15s ease;
      white-space: nowrap;
    }

    :host(:hover) .row-label,
    .row-wrapper.selected .row-label {
      opacity: 1;
    }
  `;

  render() {
    if (!this.row) return html``;

    const isSelected = this.selection?.type === 'row' && this.selection.rowId === this.row.id;
    const a = this.row.attributes;
    const bgStyle = a.backgroundColor ? `background-color: ${a.backgroundColor};` : '';
    const bgImgStyle = a.backgroundImage ? `background-image: url(${a.backgroundImage}); background-size: cover; background-position: center;` : '';
    const padStyle = `padding: ${a.padding.top}px ${a.padding.right}px ${a.padding.bottom}px ${a.padding.left}px;`;

    return html`
      <div
        class="row-wrapper ${isSelected ? 'selected' : ''} ${this._dragging ? 'dragging' : ''}"
        style="${bgStyle} ${bgImgStyle} ${padStyle}"
        @click=${this._onRowClick}
      >
        <div class="row-label">Row</div>

        <div class="columns">
          ${this.row.columns.map((col, i) => {
            const ratio = this.row.columnRatios[i] ?? 1;
            const widthPercent = (ratio / 12) * 100;
            return html`
              <div class="column-wrapper" style="width: ${widthPercent}%;">
                <pigeon-column
                  .column=${col}
                  row-id="${this.row.id}"
                  .selection=${this.selection}
                  .editingBlockId=${this.editingBlockId}
                ></pigeon-column>
              </div>
            `;
          })}
        </div>

        <div class="actions">
          <button
            class="action-btn drag-handle"
            title="Drag to reorder"
            draggable="true"
            @dragstart=${this._onDragStart}
            @dragend=${this._onDragEnd}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="6" r="1"/>
              <circle cx="9" cy="12" r="1"/>
              <circle cx="9" cy="18" r="1"/>
              <circle cx="15" cy="6" r="1"/>
              <circle cx="15" cy="12" r="1"/>
              <circle cx="15" cy="18" r="1"/>
            </svg>
          </button>
          <button
            class="action-btn"
            title="Move up"
            ?disabled=${this.index === 0}
            @click=${this._onMoveUp}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button
            class="action-btn"
            title="Move down"
            ?disabled=${this.index === this.totalRows - 1}
            @click=${this._onMoveDown}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button
            class="action-btn"
            title="Duplicate"
            @click=${this._onDuplicate}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button
            class="action-btn danger"
            title="Delete"
            @click=${this._onDelete}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private _onRowClick(e: Event) {
    // Don't override block clicks
    const path = e.composedPath();
    const isBlockClick = path.some(
      (el) => el instanceof HTMLElement && el.tagName.toLowerCase().startsWith('pigeon-') && el.tagName.toLowerCase().endsWith('-block')
    );
    if (isBlockClick) return;

    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('row-select', {
      detail: { rowId: this.row.id },
      bubbles: true,
      composed: true,
    }));
  }

  private _onMoveUp(e: Event) {
    e.stopPropagation();
    if (this.index > 0) {
      this.dispatchEvent(new CustomEvent('row-move', {
        detail: { rowId: this.row.id, toIndex: this.index - 1 },
        bubbles: true,
        composed: true,
      }));
    }
  }

  private _onMoveDown(e: Event) {
    e.stopPropagation();
    if (this.index < this.totalRows - 1) {
      this.dispatchEvent(new CustomEvent('row-move', {
        detail: { rowId: this.row.id, toIndex: this.index + 1 },
        bubbles: true,
        composed: true,
      }));
    }
  }

  private _onDuplicate(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('row-duplicate', {
      detail: { rowId: this.row.id },
      bubbles: true,
      composed: true,
    }));
  }

  private _onDelete(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('row-delete', {
      detail: { rowId: this.row.id },
      bubbles: true,
      composed: true,
    }));
  }

  private _onDragStart(e: DragEvent) {
    writeDragTransfer(e, {
      type: 'existing-row',
      rowId: this.row.id,
    });
    if (e.dataTransfer) {
      const target = e.currentTarget as HTMLElement;
      const rowEl = target.closest('.row-wrapper') as HTMLElement | null;
      if (rowEl) {
        e.dataTransfer.setDragImage(rowEl, 0, 0);
      }
    }
    this._dragging = true;
  }

  private _onDragEnd() {
    this._dragging = false;
    clearDragData();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-row': PigeonRow;
  }
}
