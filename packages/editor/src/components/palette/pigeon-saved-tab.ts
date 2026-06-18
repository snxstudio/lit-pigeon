import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { writeDragTransfer } from '../../dnd/drag-manager.js';
import type { LibraryEntry, RowLibraryStorage } from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';

/**
 * `<pigeon-saved-tab>` — the Saved palette tab body. Lists saved rows from the
 * `RowLibraryStorage` as drag chips (drag-type `library-row`, carrying the row
 * node) and offers per-entry delete. Re-list via `refresh()`.
 */
@customElement('pigeon-saved-tab')
export class PigeonSavedTab extends LitElement {
  @property({ attribute: false })
  storage?: RowLibraryStorage;

  @state() private _entries: LibraryEntry[] = [];

  static styles = css`
    :host { display: block; }
    .section { padding: 12px; }
    .empty { font-size: 12px; color: var(--pigeon-text-muted, #94a3b8); font-family: var(--pigeon-font); }
    .row {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 6px;
      border: 1px solid var(--pigeon-border, #e2e8f0); border-radius: var(--pigeon-radius, 6px);
      background: var(--pigeon-bg, #ffffff); cursor: grab; font-family: var(--pigeon-font); font-size: 13px;
    }
    .row:hover { border-color: var(--pigeon-primary, #3b82f6); background: var(--pigeon-surface, #f8fafc); }
    .name { flex: 1; color: var(--pigeon-text, #1e293b); }
    .delete {
      background: none; border: none; cursor: pointer; color: var(--pigeon-text-muted, #94a3b8);
      font-size: 14px; line-height: 1; padding: 2px;
    }
    .delete:hover { color: var(--pigeon-danger, #dc2626); }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.refresh();
  }

  /** Re-load entries from storage. */
  async refresh(): Promise<void> {
    if (!this.storage) { this._entries = []; return; }
    try {
      this._entries = await this.storage.list();
    } catch {
      this._entries = [];
    }
  }

  render() {
    return html`
      <div class="section">
        ${this._entries.length === 0
          ? html`<div class="empty">${t('palette.saved.empty')}</div>`
          : this._entries.map(
              (e) => html`<div
                class="row" data-entry-id=${e.id} draggable="true"
                role="button" tabindex="0" aria-label=${`Insert ${e.name}`}
                @dragstart=${(ev: DragEvent) => this._onDragStart(ev, e)}
                @keydown=${(ev: KeyboardEvent) => this._onKeyDown(ev, e)}
              >
                <span class="name">${e.name}</span>
                <button class="delete" type="button" title=${t('palette.saved.delete-title')} aria-label=${`Delete ${e.name}`}
                  @click=${() => this._onDelete(e)}>×</button>
              </div>`,
            )}
      </div>
    `;
  }

  private _onKeyDown(ev: KeyboardEvent, entry: LibraryEntry) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    this.dispatchEvent(new CustomEvent('library-insert', {
      detail: { node: entry.node }, bubbles: true, composed: true,
    }));
  }

  private _onDragStart(ev: DragEvent, entry: LibraryEntry) {
    writeDragTransfer(ev, { type: 'library-row', node: entry.node });
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copy';
  }

  private _onDelete(entry: LibraryEntry) {
    this.dispatchEvent(new CustomEvent('library-delete', {
      detail: { id: entry.id }, bubbles: true, composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-saved-tab': PigeonSavedTab;
  }
}
