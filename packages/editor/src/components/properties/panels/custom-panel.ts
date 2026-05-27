import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { ContentBlock, PropertyField } from '@lit-pigeon/core';
import { panelStyles } from './panel-styles.js';
import '../controls/color-picker.js';

/**
 * Generic property panel for registry-defined custom blocks. Renders the
 * fields declared on `BlockDefinition.propertySchema` and emits the same
 * `property-change` event the built-in panels use, so the editor writes edits
 * back through the normal `updateBlock` path.
 */
@customElement('pigeon-custom-panel')
export class PigeonCustomPanel extends LitElement {
  @property({ type: Object })
  block!: ContentBlock;

  @property({ type: String })
  rowId = '';

  @property({ type: String })
  columnId = '';

  @property({ type: String })
  label = 'Block';

  @property({ type: Array })
  schema: PropertyField[] = [];

  static styles = [
    panelStyles,
    css`
      :host {
        display: block;
      }

      .checkbox-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .checkbox-row label {
        margin-bottom: 0;
      }
    `,
  ];

  render() {
    if (!this.block) return html``;
    const values = this.block.values as Record<string, unknown>;
    return html`
      <h3>${this.label}</h3>
      ${this.schema.map((field) => this._renderField(field, values[field.key]))}
    `;
  }

  private _renderField(field: PropertyField, value: unknown) {
    switch (field.type) {
      case 'textarea':
        return html`
          <div class="field">
            <label for=${field.key}>${field.label}</label>
            <textarea
              id=${field.key}
              .value=${String(value ?? '')}
              placeholder=${field.placeholder ?? ''}
              @change=${(e: Event) =>
                this._emit(field.key, (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>
        `;
      case 'number':
        return html`
          <div class="field">
            <label for=${field.key}>${field.label}</label>
            <input
              id=${field.key}
              type="number"
              .value=${String(value ?? 0)}
              min=${field.min ?? ''}
              max=${field.max ?? ''}
              step=${field.step ?? ''}
              @change=${(e: Event) =>
                this._emit(field.key, Number((e.target as HTMLInputElement).value))}
            />
          </div>
        `;
      case 'color':
        return html`
          <pigeon-color-picker
            label=${field.label}
            .value=${String(value ?? '#000000')}
            @color-change=${(e: CustomEvent<{ value: string }>) =>
              this._emit(field.key, e.detail.value)}
          ></pigeon-color-picker>
        `;
      case 'checkbox':
        return html`
          <div class="field checkbox-row">
            <input
              id=${field.key}
              type="checkbox"
              .checked=${Boolean(value)}
              @change=${(e: Event) =>
                this._emit(field.key, (e.target as HTMLInputElement).checked)}
            />
            <label for=${field.key}>${field.label}</label>
          </div>
        `;
      case 'select':
        return html`
          <div class="field">
            <label for=${field.key}>${field.label}</label>
            <select
              id=${field.key}
              .value=${String(value ?? '')}
              @change=${(e: Event) =>
                this._emit(field.key, (e.target as HTMLSelectElement).value)}
            >
              ${(field.options ?? []).map(
                (opt) => html`<option value=${opt.value}>${opt.label}</option>`,
              )}
            </select>
          </div>
        `;
      case 'text':
      default:
        return html`
          <div class="field">
            <label for=${field.key}>${field.label}</label>
            <input
              id=${field.key}
              type="text"
              .value=${String(value ?? '')}
              placeholder=${field.placeholder ?? ''}
              @change=${(e: Event) =>
                this._emit(field.key, (e.target as HTMLInputElement).value)}
            />
          </div>
        `;
    }
  }

  private _emit(key: string, value: unknown) {
    this.dispatchEvent(
      new CustomEvent('property-change', {
        detail: {
          rowId: this.rowId,
          columnId: this.columnId,
          blockId: this.block.id,
          values: { [key]: value },
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-custom-panel': PigeonCustomPanel;
  }
}
