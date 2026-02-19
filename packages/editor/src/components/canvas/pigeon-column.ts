import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ColumnNode, ContentBlock, Selection } from '@lit-pigeon/core';
import { getDragData, clearDragData } from '../../dnd/drag-manager.js';
import { calculateBlockDropIndex } from '../../dnd/drop-zones.js';
import './pigeon-drop-indicator.js';
import '../blocks/text-block.js';
import '../blocks/image-block.js';
import '../blocks/button-block.js';
import '../blocks/divider-block.js';
import '../blocks/spacer-block.js';
import '../blocks/social-block.js';
import '../blocks/html-block.js';

@customElement('pigeon-column')
export class PigeonColumn extends LitElement {
  @property({ type: Object })
  column!: ColumnNode;

  @property({ type: String, attribute: 'row-id' })
  rowId = '';

  @property({ type: Object })
  selection: Selection | null = null;

  @state()
  private _dropIndex = -1;

  @state()
  private _isDragOver = false;

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
      background: rgba(59, 130, 246, 0.04);
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
      background: rgba(59, 130, 246, 0.06);
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
              ${this._renderBlock(block)}
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

    switch (block.type) {
      case 'text':
        return html`<pigeon-text-block .block=${block} ?selected=${isSelected}></pigeon-text-block>`;
      case 'image':
        return html`<pigeon-image-block .block=${block} ?selected=${isSelected}></pigeon-image-block>`;
      case 'button':
        return html`<pigeon-button-block .block=${block} ?selected=${isSelected}></pigeon-button-block>`;
      case 'divider':
        return html`<pigeon-divider-block .block=${block} ?selected=${isSelected}></pigeon-divider-block>`;
      case 'spacer':
        return html`<pigeon-spacer-block .block=${block} ?selected=${isSelected}></pigeon-spacer-block>`;
      case 'social':
        return html`<pigeon-social-block .block=${block} ?selected=${isSelected}></pigeon-social-block>`;
      case 'html':
        return html`<pigeon-html-block .block=${block} ?selected=${isSelected}></pigeon-html-block>`;
      default:
        return html`<div>Unknown block type: ${(block as ContentBlock).type}</div>`;
    }
  }

  private _onDragOver(e: DragEvent) {
    const dragData = getDragData();
    if (!dragData) return;

    // Only accept block drops (not row drops)
    if (dragData.type === 'palette-row') return;

    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    this._isDragOver = true;

    // Calculate drop index
    const blockElements = Array.from(
      this.renderRoot.querySelectorAll(
        'pigeon-text-block, pigeon-image-block, pigeon-button-block, pigeon-divider-block, pigeon-spacer-block, pigeon-social-block, pigeon-html-block'
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
    e.preventDefault();
    e.stopPropagation();

    const dragData = getDragData();
    if (!dragData) return;

    if (dragData.type === 'palette-row') return;

    const index = this._dropIndex >= 0 ? this._dropIndex : this.column.blocks.length;

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

    this._isDragOver = false;
    this._dropIndex = -1;
    clearDragData();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-column': PigeonColumn;
  }
}
