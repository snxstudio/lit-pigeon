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

    .item:focus-visible {
      outline: none;
      border-color: var(--pigeon-ring);
      box-shadow: var(--pigeon-ring-shadow);
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--pigeon-radius-sm, 4px);
      background: var(--pigeon-accent, #eef2ff);
      color: var(--pigeon-accent-foreground, #4338ca);
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
    const verb = this.dragType === 'palette-row' ? 'Add layout' : 'Add block';
    return html`
      <div
        class="item"
        draggable="true"
        role="button"
        tabindex="0"
        aria-label="${verb}: ${this.label}"
        title="Click to add, or drag onto the canvas"
        @click=${this._onClick}
        @dragstart=${this._onDragStart}
        @dragend=${this._onDragEnd}
        @keydown=${this._onKeyDown}
      >
        <span class="icon" aria-hidden="true">${displayIcon}</span>
        <span class="label">${this.label}</span>
      </div>
    `;
  }

  /** Suppresses the click that some browsers fire after a drag operation. */
  private _didDrag = false;

  private _onClick() {
    if (this._didDrag) return;
    this._activate();
  }

  private _onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this._activate();
  }

  /**
   * Click/keyboard equivalent of dragging this item onto the canvas: ask the
   * editor to append the block/layout to the document.
   */
  private _activate() {
    this.dispatchEvent(
      new CustomEvent('palette-item-activate', {
        detail: {
          type: this.dragType,
          blockType: this.blockType,
          columnCount: this.columnCount,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onDragStart(e: DragEvent) {
    this._didDrag = true;
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
    // Reset after the tick so a click event fired for the same gesture is
    // still suppressed.
    setTimeout(() => {
      this._didDrag = false;
    }, 0);
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
