import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { MergeTag } from '@lit-pigeon/core';

@customElement('pigeon-merge-tag-picker')
export class PigeonMergeTagPicker extends LitElement {
  @property({ type: Array })
  tags: MergeTag[] = [];

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Number })
  x = 0;

  @property({ type: Number })
  y = 0;

  @state()
  private _search = '';

  static styles = css`
    :host {
      display: none;
    }

    :host([open]) {
      display: block;
      position: fixed;
      z-index: 10001;
    }

    .picker {
      background: var(--pigeon-bg, #ffffff);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      box-shadow: var(--pigeon-shadow-md);
      width: 260px;
      max-height: 320px;
      display: flex;
      flex-direction: column;
      font-family: var(--pigeon-font);
      overflow: hidden;
    }

    .search-box {
      padding: 8px;
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .search-box input {
      width: 100%;
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
    }

    .search-box input:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
    }

    .tag-list {
      overflow-y: auto;
      flex: 1;
    }

    .category-header {
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--pigeon-text-secondary, #64748b);
      background: var(--pigeon-surface, #f8fafc);
    }

    .tag-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.1s;
      font-size: 13px;
    }

    .tag-item:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
    }

    .tag-name {
      color: var(--pigeon-text, #1e293b);
      font-weight: 500;
    }

    .tag-sample {
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 11px;
    }

    .empty {
      padding: 20px;
      text-align: center;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 13px;
    }
  `;

  render() {
    const filteredTags = this._getFilteredTags();
    const grouped = this._groupByCategory(filteredTags);

    return html`
      <div class="picker" style="position: absolute; left: ${this.x}px; top: ${this.y}px;">
        <div class="search-box">
          <input
            type="text"
            placeholder="Search tags..."
            .value=${this._search}
            @input=${(e: Event) => this._search = (e.target as HTMLInputElement).value}
          />
        </div>
        <div class="tag-list">
          ${filteredTags.length === 0
            ? html`<div class="empty">No matching tags</div>`
            : Array.from(grouped.entries()).map(([category, tags]) => html`
                ${category ? html`<div class="category-header">${category}</div>` : ''}
                ${tags.map(tag => html`
                  <div class="tag-item" @click=${() => this._selectTag(tag)}>
                    <span class="tag-name">${tag.label}</span>
                    ${tag.sample ? html`<span class="tag-sample">${tag.sample}</span>` : ''}
                  </div>
                `)}
              `)}
        </div>
      </div>
    `;
  }

  private _getFilteredTags(): MergeTag[] {
    if (!this._search) return this.tags;
    const q = this._search.toLowerCase();
    return this.tags.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  }

  private _groupByCategory(tags: MergeTag[]): Map<string, MergeTag[]> {
    const groups = new Map<string, MergeTag[]>();
    for (const tag of tags) {
      const cat = tag.category ?? '';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(tag);
    }
    return groups;
  }

  private _selectTag(tag: MergeTag) {
    this.dispatchEvent(new CustomEvent('merge-tag-insert', {
      detail: { tag },
      bubbles: true,
      composed: true,
    }));
    this.open = false;
    this._search = '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-merge-tag-picker': PigeonMergeTagPicker;
  }
}
