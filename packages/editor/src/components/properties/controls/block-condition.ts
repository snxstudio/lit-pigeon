import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { AnyBlock } from '@lit-pigeon/core';
import { panelStyles } from '../panels/panel-styles.js';
import { t } from '../../../i18n/index.js';

/**
 * Display-condition field shown under every block panel. Emits the same
 * `property-change` event as the panels, so the value lands in
 * `block.values.condition`.
 */
@customElement('pigeon-block-condition')
export class PigeonBlockCondition extends LitElement {
  @property({ type: Object })
  block!: AnyBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  static styles = [
    panelStyles,
    css`
      .hint {
        margin: 4px 0 0;
        font-size: 11px;
        line-height: 1.4;
        color: var(--pigeon-muted-foreground, #64748b);
        font-family: var(--pigeon-font);
      }

      .hint code {
        font-family: var(--pigeon-font-mono);
        font-size: 10px;
        background: var(--pigeon-muted, #f1f5f9);
        padding: 1px 4px;
        border-radius: 3px;
      }
    `,
  ];

  render() {
    if (!this.block) return html``;
    const condition = this.block.values.condition;

    return html`
      <div class="field">
        <label for="block-condition">${t('panel.common.displayCondition')}</label>
        <input
          id="block-condition"
          type="text"
          .value=${typeof condition === 'string' ? condition : ''}
          placeholder="e.g. user.premium"
          @change=${this._onChange}
        />
        <p class="hint">
          Show this block only when the expression is truthy. Exported as
          <code>{{#if …}}</code> for your sending platform.
        </p>
      </div>
    `;
  }

  private _onChange(e: Event) {
    const value = (e.target as HTMLInputElement).value.trim();
    // Store undefined (not "") when cleared so the renderer skips the wrapper.
    this.dispatchEvent(new CustomEvent('property-change', {
      detail: {
        rowId: this.rowId,
        columnId: this.columnId,
        blockId: this.block.id,
        values: { condition: value || undefined },
      },
      bubbles: true,
      composed: true,
    }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-block-condition': PigeonBlockCondition;
  }
}
