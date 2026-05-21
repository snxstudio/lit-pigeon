import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SpacerBlock } from '@lit-pigeon/core';
import '../controls/slider-input.js';

@customElement('pigeon-spacer-panel')
export class PigeonSpacerPanel extends LitElement {
  @property({ type: Object })
  block!: SpacerBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  static styles = css`
    :host {
      display: block;
    }

    h3 {
      margin: 0 0 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--pigeon-text, #1e293b);
      font-family: var(--pigeon-font);
    }
  `;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>Spacer Properties</h3>

      <pigeon-slider-input
        label="Height"
        .value=${v.height}
        min=${4}
        max=${200}
        step=${1}
        unit="px"
        @slider-change=${this._onHeightChange}
      ></pigeon-slider-input>
    `;
  }

  private _emit(values: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent('property-change', {
      detail: {
        rowId: this.rowId,
        columnId: this.columnId,
        blockId: this.block.id,
        values,
      },
      bubbles: true,
      composed: true,
    }));
  }

  private _onHeightChange(e: CustomEvent<{ value: number }>) {
    this._emit({ height: e.detail.value });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-spacer-panel': PigeonSpacerPanel;
  }
}
