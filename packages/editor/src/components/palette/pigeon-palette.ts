import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getAllBlockDefinitions } from '@lit-pigeon/core';
import type { BlockDefinition } from '@lit-pigeon/core';
import './pigeon-palette-item.js';

interface RowLayout {
  label: string;
  columns: number;
  icon: string;
}

const ROW_LAYOUTS: RowLayout[] = [
  { label: '1 Column', columns: 1, icon: '[=]' },
  { label: '2 Columns', columns: 2, icon: '[||]' },
  { label: '3 Columns', columns: 3, icon: '[|||]' },
  { label: '4 Columns', columns: 4, icon: '[||||]' },
];

@customElement('pigeon-palette')
export class PigeonPalette extends LitElement {
  @state()
  private _blockDefs: BlockDefinition[] = [];

  static styles = css`
    :host {
      display: block;
      width: var(--pigeon-palette-width, 240px);
      height: 100%;
      background: var(--pigeon-bg, #ffffff);
      border-right: 1px solid var(--pigeon-border, #e2e8f0);
      overflow-y: auto;
      box-sizing: border-box;
    }

    .section {
      padding: 12px;
    }

    .section:not(:last-child) {
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
    }

    .section-header {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--pigeon-text-secondary, #64748b);
      margin-bottom: 8px;
      font-family: var(--pigeon-font);
    }

    .items {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._blockDefs = getAllBlockDefinitions();
  }

  render() {
    return html`
      <div class="section">
        <div class="section-header">Content</div>
        <div class="items">
          ${this._blockDefs.map(def => html`
            <pigeon-palette-item
              label="${def.label}"
              icon="${def.icon}"
              drag-type="palette-block"
              block-type="${def.type}"
            ></pigeon-palette-item>
          `)}
        </div>
      </div>

      <div class="section">
        <div class="section-header">Layout</div>
        <div class="items">
          ${ROW_LAYOUTS.map(layout => html`
            <pigeon-palette-item
              label="${layout.label}"
              icon="${layout.icon}"
              drag-type="palette-row"
              column-count="${layout.columns}"
            ></pigeon-palette-item>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-palette': PigeonPalette;
  }
}
