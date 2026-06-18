import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SpacerBlock } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import { t } from '../../../i18n/index.js';
import '../controls/slider-input.js';

@customElement('pigeon-spacer-panel')
export class PigeonSpacerPanel extends LitElement {
  @property({ type: Object })
  block!: SpacerBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  static styles = panelStyles;

  render() {
    if (!this.block) return html``;
    const v = this.block.values;

    return html`
      <h3>${t('panel.spacer.title')}</h3>

      <pigeon-slider-input
        label=${t('panel.spacer.height')}
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
