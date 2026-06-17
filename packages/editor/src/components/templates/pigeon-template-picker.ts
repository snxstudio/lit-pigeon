import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Template, TemplateCategory, TemplateStorage } from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';

const CATEGORIES: { v: TemplateCategory; l: string }[] = [
  { v: 'welcome', l: 'Welcome' },
  { v: 'newsletter', l: 'Newsletter' },
  { v: 'transactional', l: 'Transactional' },
  { v: 'promo', l: 'Promo' },
  { v: 'announcement', l: 'Announcement' },
  { v: 'other', l: 'Other' },
];

/**
 * `<pigeon-template-picker>` — modal for browsing/saving templates.
 *
 * @element pigeon-template-picker
 * @fires template-load - `{ template: Template }` when a card is clicked.
 * @fires template-save - `{ name, description, category }` on save form submit.
 */
@customElement('pigeon-template-picker')
export class PigeonTemplatePicker extends LitElement {
  /** Storage used to list templates. Required for the gallery to populate. */
  @property({ attribute: false })
  storage?: TemplateStorage;

  /** Toggles the modal visibility. */
  @property({ type: Boolean, reflect: true })
  open = false;

  @state() private _templates: Template[] = [];
  @state() private _name = '';
  @state() private _description = '';
  @state() private _category: TemplateCategory = 'other';
  @state() private _formError = '';

  static styles = css`
    :host { display: none; }
    :host([open]) { display: block; position: fixed; inset: 0; z-index: 10000; }
    .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); }
    .modal {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: 720px; max-width: 92vw; max-height: 85vh;
      background: var(--pigeon-bg, #fff);
      border-radius: var(--pigeon-radius, 6px);
      box-shadow: var(--pigeon-shadow-md);
      display: flex; flex-direction: column;
      font-family: var(--pigeon-font);
      color: var(--pigeon-text, #1e293b);
    }
    .header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--pigeon-border, #e2e8f0);
    }
    .header h3 { margin: 0; font-size: 16px; font-weight: 600; }
    .close-btn {
      background: none; border: none; cursor: pointer;
      color: var(--pigeon-text-secondary, #64748b);
      padding: 4px; font-size: 18px; line-height: 1;
    }
    .body { padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
    .section-title {
      margin: 0 0 8px; font-size: 13px; font-weight: 600;
      color: var(--pigeon-text-secondary, #64748b);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .template-card {
      display: flex; flex-direction: column; gap: 6px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      background: var(--pigeon-surface, #f8fafc);
      padding: 10px; cursor: pointer; text-align: left;
      font-family: var(--pigeon-font); color: inherit;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .template-card:hover {
      border-color: var(--pigeon-primary, #3b82f6);
      background: var(--pigeon-bg, #fff);
      box-shadow: var(--pigeon-shadow-sm);
    }
    .thumb, .thumb-placeholder {
      width: 100%; height: 96px;
      border-radius: var(--pigeon-radius-sm, 4px);
      background: var(--pigeon-bg, #fff);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      display: block;
    }
    .thumb { object-fit: cover; }
    .thumb-placeholder {
      border-style: dashed;
      display: flex; align-items: center; justify-content: center;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .name { font-size: 13px; font-weight: 600; color: var(--pigeon-text, #1e293b); }
    .description { font-size: 12px; color: var(--pigeon-text-secondary, #64748b); line-height: 1.4; }
    .empty {
      padding: 24px; text-align: center;
      color: var(--pigeon-text-secondary, #64748b);
      font-size: 13px;
      border: 1px dashed var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
    }
    .save-form {
      display: flex; flex-direction: column; gap: 8px;
      padding-top: 16px;
      border-top: 1px solid var(--pigeon-border, #e2e8f0);
    }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label {
      font-size: 12px; font-weight: 500;
      color: var(--pigeon-text-secondary, #64748b);
    }
    .field input, .field textarea, .field select {
      height: 32px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font); font-size: 13px;
      color: var(--pigeon-text, #1e293b);
      background: var(--pigeon-bg, #fff);
      outline: none; box-sizing: border-box;
    }
    .field textarea { height: auto; min-height: 56px; padding: 8px; resize: vertical; }
    .field input:focus, .field textarea:focus, .field select:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
    }
    .save-row { display: grid; grid-template-columns: 1fr 160px; gap: 8px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
    .form-actions button {
      height: 32px; padding: 0 14px;
      border: 1px solid transparent;
      border-radius: var(--pigeon-radius-sm, 4px);
      font-family: var(--pigeon-font); font-size: 13px; font-weight: 500;
      cursor: pointer;
      background: var(--pigeon-primary, #3b82f6); color: #fff;
    }
    .form-actions button:hover { background: var(--pigeon-primary-hover, #2563eb); }
    .form-actions button.secondary {
      background: transparent;
      color: var(--pigeon-text, #1e293b);
      border-color: var(--pigeon-border, #e2e8f0);
    }
    .form-actions button.secondary:hover { background: var(--pigeon-surface-hover, #f1f5f9); }
    .error { color: var(--pigeon-danger, #ef4444); font-size: 12px; }
  `;

  updated(changed: Map<string, unknown>) {
    if (changed.has('storage') || (changed.has('open') && this.open)) {
      void this.refresh();
    }
  }

  /** Re-fetch templates from storage and re-render. */
  async refresh(): Promise<void> {
    if (!this.storage) {
      this._templates = [];
      return;
    }
    try {
      this._templates = await this.storage.list();
    } catch {
      this._templates = [];
    }
  }

  render() {
    return html`
      <div class="overlay" @click=${this._close}></div>
      <div class="modal">
        <div class="header">
          <h3>${t('template.heading')}</h3>
          <button class="close-btn" title=${t('template.close')} @click=${this._close}>&times;</button>
        </div>
        <div class="body">
          <div>
            <h4 class="section-title">${t('template.section.choose')}</h4>
            ${this._templates.length === 0
              ? html`<div class="empty">${t('template.empty')}</div>`
              : html`<div class="grid">${this._templates.map((tmpl) => this._renderCard(tmpl))}</div>`}
          </div>

          <form class="save-form" @submit=${this._onSubmit}>
            <h4 class="section-title">${t('template.section.save')}</h4>
            <div class="save-row">
              <div class="field">
                <label for="template-name">${t('template.field.name')}</label>
                <input
                  id="template-name"
                  name="template-name"
                  type="text"
                  placeholder=${t('template.field.name-placeholder')}
                  .value=${this._name}
                  @input=${(e: Event) => (this._name = (e.target as HTMLInputElement).value)}
                />
              </div>
              <div class="field">
                <label for="template-category">${t('template.field.category')}</label>
                <select
                  id="template-category"
                  name="template-category"
                  .value=${this._category}
                  @change=${(e: Event) =>
                    (this._category = (e.target as HTMLSelectElement).value as TemplateCategory)}
                >
                  ${CATEGORIES.map(
                    (c) => html`<option value=${c.v} ?selected=${this._category === c.v}>${c.l}</option>`,
                  )}
                </select>
              </div>
            </div>
            <div class="field">
              <label for="template-description">${t('template.field.description')}</label>
              <textarea
                id="template-description"
                name="template-description"
                placeholder=${t('template.field.description-placeholder')}
                .value=${this._description}
                @input=${(e: Event) =>
                  (this._description = (e.target as HTMLTextAreaElement).value)}
              ></textarea>
            </div>
            ${this._formError ? html`<div class="error">${this._formError}</div>` : ''}
            <div class="form-actions">
              <button type="button" class="secondary" @click=${this._close}>${t('template.cancel')}</button>
              <button type="submit">${t('template.save')}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private _renderCard(tmpl: Template) {
    return html`
      <button class="template-card" @click=${() => this._onPick(tmpl)} title="Load ${tmpl.name}">
        ${tmpl.thumbnail
          ? html`<img class="thumb" src=${tmpl.thumbnail} alt="" />`
          : html`<div class="thumb-placeholder">${tmpl.category ?? 'template'}</div>`}
        <span class="name">${tmpl.name}</span>
        ${tmpl.description ? html`<span class="description">${tmpl.description}</span>` : ''}
      </button>
    `;
  }

  private _close = () => {
    this.open = false;
    this._formError = '';
  };

  private _onPick(template: Template) {
    this.dispatchEvent(
      new CustomEvent('template-load', {
        detail: { template },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onSubmit = (e: Event) => {
    e.preventDefault();
    const name = this._name.trim();
    if (!name) {
      this._formError = t('template.error.name-required');
      return;
    }
    this._formError = '';
    this.dispatchEvent(
      new CustomEvent('template-save', {
        detail: {
          name,
          description: this._description.trim() || undefined,
          category: this._category,
        },
        bubbles: true,
        composed: true,
      }),
    );
    this._name = '';
    this._description = '';
    this._category = 'other';
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-template-picker': PigeonTemplatePicker;
  }
}
