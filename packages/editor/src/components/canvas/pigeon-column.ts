import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type {
  ColumnNode,
  ContentBlock,
  RegisteredBlock,
  Selection,
} from '@lit-pigeon/core';
import { getBlockDefinition } from '@lit-pigeon/core';
import { getDragData, clearDragData, writeDragTransfer } from '../../dnd/drag-manager.js';
import { calculateBlockDropIndex, resolveReorderTarget } from '../../dnd/drop-zones.js';
import './pigeon-drop-indicator.js';
import '../blocks/text-block.js';
import '../blocks/image-block.js';
import '../blocks/button-block.js';
import '../blocks/divider-block.js';
import '../blocks/spacer-block.js';
import '../blocks/social-block.js';
import '../blocks/html-block.js';
import '../blocks/hero-block.js';
import '../blocks/navbar-block.js';

@customElement('pigeon-column')
export class PigeonColumn extends LitElement {
  @property({ type: Object })
  column!: ColumnNode;

  @property({ type: String, attribute: 'row-id' })
  rowId = '';

  @property({ type: Object })
  selection: Selection | null = null;

  @property({ type: String, attribute: 'editing-block-id' })
  editingBlockId: string | null = null;

  @state()
  private _dropIndex = -1;

  @state()
  private _isDragOver = false;

  /** Id of the block currently being dragged from this column, or null. Dims
   *  the source block while a reorder drag is in flight. */
  @state()
  private _draggingBlockId: string | null = null;

  static styles = css`
    :host {
      display: block;
      min-height: 40px;
      position: relative;
    }

    .column-content {
      min-height: 40px;
      position: relative;
      transition: background 0.15s ease;
    }

    .column-content.drag-over {
      background: color-mix(in srgb, var(--pigeon-drop-color, #3b82f6) 6%, transparent);
    }

    .empty-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60px;
      border: 2px dashed var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      color: var(--pigeon-text-secondary, #64748b);
      font-family: var(--pigeon-font);
      font-size: 12px;
      margin: 4px;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .column-content.drag-over .empty-hint {
      border-color: var(--pigeon-drop-color, #3b82f6);
      background: color-mix(in srgb, var(--pigeon-drop-color, #3b82f6) 8%, transparent);
    }

    .block-wrapper {
      position: relative;
      transition: opacity 0.15s ease;
    }

    .block-wrapper.dragging {
      opacity: 0.4;
    }

    .block-drag-handle {
      position: absolute;
      top: 4px;
      left: 4px;
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      background: var(--pigeon-bg, #ffffff);
      color: var(--pigeon-text-secondary, #64748b);
      box-shadow: var(--pigeon-shadow-sm);
      cursor: grab;
      opacity: 0;
      transition: opacity 0.15s ease;
    }

    .block-wrapper:hover .block-drag-handle {
      opacity: 1;
    }

    .block-drag-handle:active {
      cursor: grabbing;
    }

    .block-drag-handle:focus-visible {
      outline: none;
      box-shadow: var(--pigeon-ring-shadow);
      opacity: 1;
    }

    .block-drag-handle svg {
      width: 12px;
      height: 12px;
    }

    .custom-block {
      cursor: pointer;
      border-radius: var(--pigeon-radius-sm, 4px);
      outline: 1px dashed transparent;
      outline-offset: 0;
      transition: outline 0.15s ease;
    }

    .custom-block:hover:not(.selected) {
      outline-color: var(--pigeon-border, #e2e8f0);
    }

    .custom-block.selected {
      outline: 2px solid var(--pigeon-selected-outline, #3b82f6);
    }

    .custom-block--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      margin: 4px;
      padding: 12px;
      border: 1px dashed var(--pigeon-border, #e2e8f0);
      background: var(--pigeon-muted, #f1f5f9);
      color: var(--pigeon-muted-foreground, #64748b);
      font-family: var(--pigeon-font);
      font-size: 12px;
      text-align: center;
    }
  `;

  render() {
    if (!this.column) return html``;

    const blocks = this.column.blocks;
    const padStyle = `padding: ${this.column.attributes.padding.top}px ${this.column.attributes.padding.right}px ${this.column.attributes.padding.bottom}px ${this.column.attributes.padding.left}px;`;
    const bgStyle = this.column.attributes.backgroundColor
      ? `background-color: ${this.column.attributes.backgroundColor};`
      : '';
    const radiusStyle = this.column.attributes.borderRadius
      ? `border-radius: ${this.column.attributes.borderRadius}px;`
      : '';

    return html`
      <div
        class="column-content ${this._isDragOver ? 'drag-over' : ''}"
        style="${padStyle} ${bgStyle} ${radiusStyle}"
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        ${blocks.length === 0
          ? html`<div class="empty-hint">Drop content here</div>`
          : blocks.map((block, index) => html`
              <pigeon-drop-indicator
                ?visible=${this._isDragOver && this._dropIndex === index}
              ></pigeon-drop-indicator>
              <div class="block-wrapper ${this._draggingBlockId === block.id ? 'dragging' : ''}">
                <button
                  class="block-drag-handle"
                  title="Drag to reorder"
                  draggable="true"
                  @dragstart=${(e: DragEvent) => this._onBlockDragStart(e, block.id)}
                  @dragend=${this._onBlockDragEnd}
                  @click=${(e: Event) => e.stopPropagation()}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M9 5v14M15 5v14" />
                  </svg>
                </button>
                ${this._renderBlock(block)}
              </div>
            `)}
        ${blocks.length > 0
          ? html`<pigeon-drop-indicator
              ?visible=${this._isDragOver && this._dropIndex === blocks.length}
            ></pigeon-drop-indicator>`
          : ''}
      </div>
    `;
  }

  private _renderBlock(block: ContentBlock) {
    const isSelected = this.selection?.type === 'block' && this.selection.blockId === block.id;
    const isEditing = this.editingBlockId === block.id;

    switch (block.type) {
      case 'text':
        return html`<pigeon-text-block
          .block=${block}
          ?selected=${isSelected}
          ?editing=${isEditing}
        ></pigeon-text-block>`;
      case 'image':
        return html`<pigeon-image-block .block=${block} ?selected=${isSelected}></pigeon-image-block>`;
      case 'button':
        return html`<pigeon-button-block
          .block=${block}
          ?selected=${isSelected}
          ?editing=${isEditing}
        ></pigeon-button-block>`;
      case 'divider':
        return html`<pigeon-divider-block .block=${block} ?selected=${isSelected}></pigeon-divider-block>`;
      case 'spacer':
        return html`<pigeon-spacer-block .block=${block} ?selected=${isSelected}></pigeon-spacer-block>`;
      case 'social':
        return html`<pigeon-social-block .block=${block} ?selected=${isSelected}></pigeon-social-block>`;
      case 'html':
        return html`<pigeon-html-block .block=${block} ?selected=${isSelected}></pigeon-html-block>`;
      case 'hero':
        return html`<pigeon-hero-block
          .block=${block}
          ?selected=${isSelected}
          ?editing=${isEditing}
        ></pigeon-hero-block>`;
      case 'navbar':
        return html`<pigeon-navbar-block .block=${block} ?selected=${isSelected}></pigeon-navbar-block>`;
      default:
        return this._renderCustomBlock(block, isSelected);
    }
  }

  /**
   * Render a registry-defined custom block. If its definition supplies a
   * `renderCanvas` hook, its HTML is shown; otherwise we render a labelled
   * placeholder so the block is still visible and selectable instead of
   * failing with "Unknown block type".
   */
  private _renderCustomBlock(block: ContentBlock, isSelected: boolean) {
    const def = getBlockDefinition(block.type);
    const registered = block as unknown as RegisteredBlock;
    const inner = def?.renderCanvas
      ? unsafeHTML(def.renderCanvas(registered))
      : html`<span class="custom-block__label"
          >${def?.label ?? block.type}</span
        >`;
    return html`<div
      class="custom-block ${isSelected ? 'selected' : ''} ${def?.renderCanvas
        ? ''
        : 'custom-block--placeholder'}"
      data-block-id=${block.id}
      @click=${this._onCustomBlockClick}
    >
      ${inner}
    </div>`;
  }

  private _onCustomBlockClick(e: Event) {
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const blockId = el.getAttribute('data-block-id');
    if (!blockId) return;
    this.dispatchEvent(
      new CustomEvent('block-select', {
        detail: { blockId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onDragOver(e: DragEvent) {
    const dragData = getDragData();
    if (!dragData) return;

    // Columns only accept block drags. Row drags (palette-row / existing-row)
    // must bubble up to the canvas, which owns row insertion/reordering — so
    // bail BEFORE touching the event, otherwise stopPropagation() here would
    // swallow the row drop and reordering would silently fail.
    if (dragData.type !== 'palette-block' && dragData.type !== 'existing-block') return;

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = dragData.type === 'existing-block' ? 'move' : 'copy';
    }

    this._isDragOver = true;

    // Calculate drop index
    const blockElements = Array.from(
      this.renderRoot.querySelectorAll(
        'pigeon-text-block, pigeon-image-block, pigeon-button-block, pigeon-divider-block, pigeon-spacer-block, pigeon-social-block, pigeon-html-block, pigeon-hero-block, pigeon-navbar-block, .custom-block'
      )
    ) as HTMLElement[];

    this._dropIndex = calculateBlockDropIndex(e.clientY, blockElements);
  }

  private _onDragLeave(e: DragEvent) {
    // Only handle if leaving the column entirely
    const rect = this.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      return;
    }
    this._isDragOver = false;
    this._dropIndex = -1;
  }

  private _onDrop(e: DragEvent) {
    const dragData = getDragData();
    if (!dragData) return;

    // Let row drags fall through to the canvas (see _onDragOver). Guard before
    // calling stopPropagation so the canvas still receives the row drop.
    if (dragData.type !== 'palette-block' && dragData.type !== 'existing-block') return;

    e.preventDefault();
    e.stopPropagation();

    let index = this._dropIndex >= 0 ? this._dropIndex : this.column.blocks.length;

    // Same-column reorder: moveBlock removes the source before inserting, so
    // translate the visual drop index into the post-removal splice index and
    // skip no-op drops (onto the source or its immediate gap). Cross-column
    // and palette inserts use the raw visual index unchanged.
    if (
      dragData.type === 'existing-block' &&
      dragData.rowId === this.rowId &&
      dragData.columnId === this.column.id
    ) {
      const sourceIndex = this.column.blocks.findIndex((b) => b.id === dragData.blockId);
      const target = resolveReorderTarget(sourceIndex, index);
      if (target === null) {
        this._resetDragState();
        return;
      }
      index = target;
    }

    this.dispatchEvent(new CustomEvent('block-drop', {
      detail: {
        rowId: this.rowId,
        columnId: this.column.id,
        index,
        dragData,
      },
      bubbles: true,
      composed: true,
    }));

    this._resetDragState();
  }

  private _resetDragState() {
    this._isDragOver = false;
    this._dropIndex = -1;
    clearDragData();
  }

  private _onBlockDragStart(e: DragEvent, blockId: string) {
    writeDragTransfer(e, {
      type: 'existing-block',
      blockId,
      rowId: this.rowId,
      columnId: this.column.id,
    });
    if (e.dataTransfer) {
      const handle = e.currentTarget as HTMLElement;
      const wrapper = handle.closest('.block-wrapper') as HTMLElement | null;
      if (wrapper) e.dataTransfer.setDragImage(wrapper, 0, 0);
    }
    this._draggingBlockId = blockId;
  }

  private _onBlockDragEnd() {
    this._draggingBlockId = null;
    clearDragData();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-column': PigeonColumn;
  }
}
