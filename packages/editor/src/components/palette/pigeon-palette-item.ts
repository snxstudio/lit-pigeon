import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { writeDragTransfer } from '../../dnd/drag-manager.js';
import type { DragItemType } from '../../dnd/drag-manager.js';

const BLOCK_ICONS: Record<string, string> = {
  text: 'T',
  image: '[]',
  button: '[B]',
  divider: '--',
  spacer: '||',
  social: '@',
  html: '</>',
};

@customElement('pigeon-palette-item')
export class PigeonPaletteItem extends LitElement {
  @property({ type: String })
  label = '';

  @property({ type: String })
  icon = '';

  /** 'palette-block' or 'palette-row' */
  @property({ type: String, attribute: 'drag-type' })
  dragType: DragItemType = 'palette-block';

  /** Block type for blocks (e.g. 'text'), unused for rows */
  @property({ type: String, attribute: 'block-type' })
  blockType = '';

  /** Number of columns for row items */
  @property({ type: Number, attribute: 'column-count' })
  columnCount = 1;

  static styles = css`
    :host {
      display: block;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      background: var(--pigeon-bg, #ffffff);
      cursor: grab;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      user-select: none;
      font-family: var(--pigeon-font);
    }

    .item:hover {
      border-color: var(--pigeon-primary, #3b82f6);
      box-shadow: var(--pigeon-shadow-sm);
      background: var(--pigeon-surface, #f8fafc);
    }

    .item:active {
      cursor: grabbing;
      box-shadow: var(--pigeon-shadow);
      transform: scale(0.98);
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--pigeon-radius-sm, 4px);
      background: var(--pigeon-surface, #f8fafc);
      color: var(--pigeon-primary, #3b82f6);
      font-size: 12px;
      font-weight: 700;
      font-family: var(--pigeon-font-mono);
      flex-shrink: 0;
    }

    .label {
      font-size: 13px;
      font-weight: 500;
      color: var(--pigeon-text, #1e293b);
    }
  `;

  render() {
    const displayIcon = BLOCK_ICONS[this.icon] ?? this.icon ?? '?';
    return html`
      <div
        class="item"
        draggable="true"
        @dragstart=${this._onDragStart}
        @dragend=${this._onDragEnd}
      >
        <span class="icon">${displayIcon}</span>
        <span class="label">${this.label}</span>
      </div>
    `;
  }

  private _onDragStart(e: DragEvent) {
    writeDragTransfer(e, {
      type: this.dragType,
      blockType: this.blockType || undefined,
      columnCount: this.columnCount,
    });

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
    }

    // Add a slight delay to allow the browser to create the ghost image
    requestAnimationFrame(() => {
      this.dispatchEvent(new CustomEvent('palette-drag-start', {
        detail: {
          type: this.dragType,
          blockType: this.blockType,
          columnCount: this.columnCount,
        },
        bubbles: true,
        composed: true,
      }));
    });
  }

  private _onDragEnd() {
    this.dispatchEvent(new CustomEvent('palette-drag-end', {
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-palette-item': PigeonPaletteItem;
  }
}
