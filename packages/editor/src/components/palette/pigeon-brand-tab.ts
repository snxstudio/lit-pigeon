import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { generateId } from '@lit-pigeon/core';
import type { BrandKit, BrandColor, BrandFont, BrandLogo } from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';

/**
 * `<pigeon-brand-tab>` — the Brand palette tab. Renders the active kit's
 * colors, fonts, and logos with add/edit/delete affordances. Mutations emit
 * `brand-kit-edit` with the full updated kit; clicking an entry emits an
 * apply/insert event handled by `<pigeon-editor>`.
 */
@customElement('pigeon-brand-tab')
export class PigeonBrandTab extends LitElement {
  @property({ attribute: false })
  brandKit: BrandKit | null = null;

  static styles = css`
    :host { display: block; }
    .section { padding: 12px; }
    .section:not(:last-child) { border-bottom: 1px solid var(--pigeon-border, #e2e8f0); }
    .section-head {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
    }
    .section-head h4 {
      margin: 0; font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.5px; color: var(--pigeon-text-secondary, #64748b); font-family: var(--pigeon-font);
    }
    .add {
      border: 1px solid var(--pigeon-border, #e2e8f0); background: var(--pigeon-surface, #f8fafc);
      border-radius: var(--pigeon-radius-sm, 6px); cursor: pointer; font-size: 12px;
      line-height: 1; padding: 4px 8px; color: var(--pigeon-text-secondary, #64748b);
    }
    .row {
      display: flex; align-items: center; gap: 8px; padding: 4px 0; font-family: var(--pigeon-font);
      font-size: 13px; color: var(--pigeon-text, #1e293b);
    }
    .swatch {
      width: 20px; height: 20px; border-radius: var(--pigeon-radius-sm, 4px);
      border: 1px solid var(--pigeon-input, #cbd5e1); padding: 0; cursor: pointer; flex-shrink: 0;
    }
    .name { flex: 1; }
    .name-input {
      flex: 1; height: 24px; border: 1px solid var(--pigeon-input, #cbd5e1);
      border-radius: var(--pigeon-radius-sm, 4px); padding: 0 6px; font: inherit; min-width: 0;
    }
    .apply {
      flex: 1; text-align: left; background: none; border: none; cursor: pointer; font: inherit;
      color: var(--pigeon-text, #1e293b); padding: 0; min-width: 0;
    }
    .apply:hover { color: var(--pigeon-primary, #4f46e5); }
    .delete {
      background: none; border: none; cursor: pointer; color: var(--pigeon-text-muted, #94a3b8);
      font-size: 14px; line-height: 1; padding: 2px;
    }
    .delete:hover { color: var(--pigeon-danger, #dc2626); }
    .logo-thumb { width: 28px; height: 28px; object-fit: contain; flex-shrink: 0; }
    .empty { font-size: 12px; color: var(--pigeon-text-muted, #94a3b8); font-family: var(--pigeon-font); }
  `;

  render() {
    const kit = this.brandKit;
    if (!kit) return html``;
    return html`
      ${this._renderColors(kit)}
      ${this._renderFonts(kit)}
      ${this._renderLogos(kit)}
    `;
  }

  private _renderColors(kit: BrandKit) {
    return html`
      <div class="section">
        <div class="section-head">
          <h4>${t('palette.brand.colors')}</h4>
          <button class="add add-color" type="button" @click=${this._addColor}>${t('palette.brand.add')}</button>
        </div>
        ${kit.colors.length === 0 ? html`<div class="empty">${t('palette.brand.no-colors')}</div>` : ''}
        ${kit.colors.map(
          (c) => html`<div class="row" data-color-id=${c.id}>
            <button
              class="swatch" type="button" title=${`Apply ${c.name}`} aria-label=${`Apply ${c.name}`}
              style=${`background:${c.value}`} @click=${() => this._applyColor(c)}
            ></button>
            <input
              class="name-input" aria-label=${t('palette.brand.color-name-label')} .value=${c.name}
              @change=${(e: Event) => this._renameColor(c, (e.target as HTMLInputElement).value)}
            />
            <input
              type="color" aria-label=${t('palette.brand.color-value-label')} .value=${c.value}
              @input=${(e: Event) => this._recolor(c, (e.target as HTMLInputElement).value)}
            />
            <button class="delete" type="button" title=${t('palette.brand.delete-title')} aria-label=${`Delete ${c.name}`} @click=${() => this._deleteColor(c)}>×</button>
          </div>`,
        )}
      </div>
    `;
  }

  private _renderFonts(kit: BrandKit) {
    return html`
      <div class="section">
        <div class="section-head">
          <h4>${t('palette.brand.fonts')}</h4>
          <button class="add add-font" type="button" @click=${this._addFont}>${t('palette.brand.add')}</button>
        </div>
        ${kit.fonts.length === 0 ? html`<div class="empty">${t('palette.brand.no-fonts')}</div>` : ''}
        ${kit.fonts.map(
          (f) => html`<div class="row" data-font-id=${f.id}>
            <button class="apply" type="button" title=${`Apply ${f.name}`} aria-label=${`Apply font ${f.name}`} @click=${() => this._applyFont(f)}>
              ${f.name}
            </button>
            <button class="delete" type="button" title=${t('palette.brand.delete-title')} aria-label=${`Delete ${f.name}`} @click=${() => this._deleteFont(f)}>×</button>
          </div>`,
        )}
      </div>
    `;
  }

  private _renderLogos(kit: BrandKit) {
    return html`
      <div class="section">
        <div class="section-head">
          <h4>${t('palette.brand.logos')}</h4>
          <button class="add add-logo" type="button" @click=${this._addLogo}>${t('palette.brand.add')}</button>
        </div>
        ${kit.logos.length === 0 ? html`<div class="empty">${t('palette.brand.no-logos')}</div>` : ''}
        ${kit.logos.map(
          (l) => html`<div class="row" data-logo-id=${l.id}>
            <img class="logo-thumb" src=${l.src} alt=${l.name} />
            <button class="apply" type="button" title=${t('palette.brand.insert-logo-title')} aria-label=${`Insert logo ${l.name}`} @click=${() => this._insertLogo(l)}>
              ${l.name}
            </button>
            <button class="delete" type="button" title=${t('palette.brand.delete-title')} aria-label=${`Delete ${l.name}`} @click=${() => this._deleteLogo(l)}>×</button>
          </div>`,
        )}
      </div>
    `;
  }

  /* ---- apply / insert (no kit mutation) ---- */

  private _applyColor(c: BrandColor) {
    this._fire('brand-color-apply', { value: c.value });
  }
  private _applyFont(f: BrandFont) {
    this._fire('brand-font-apply', { family: f.family });
  }
  private _insertLogo(l: BrandLogo) {
    this._fire('brand-logo-insert', { logo: l });
  }

  /* ---- mutations: compute new kit, emit brand-kit-edit ---- */

  private _emitKit(kit: BrandKit) {
    this._fire('brand-kit-edit', { kit });
  }
  private _clone(): BrandKit {
    const k = this.brandKit!;
    return { ...k, colors: [...k.colors], fonts: [...k.fonts], logos: [...k.logos] };
  }

  private _addColor() {
    const k = this._clone();
    k.colors = [...k.colors, { id: generateId(), name: 'New color', value: '#000000' }];
    this._emitKit(k);
  }
  private _renameColor(c: BrandColor, name: string) {
    const k = this._clone();
    k.colors = k.colors.map((x) => (x.id === c.id ? { ...x, name } : x));
    this._emitKit(k);
  }
  private _recolor(c: BrandColor, value: string) {
    const k = this._clone();
    k.colors = k.colors.map((x) => (x.id === c.id ? { ...x, value } : x));
    this._emitKit(k);
  }
  private _deleteColor(c: BrandColor) {
    const k = this._clone();
    k.colors = k.colors.filter((x) => x.id !== c.id);
    this._emitKit(k);
  }

  private _addFont() {
    const k = this._clone();
    k.fonts = [...k.fonts, { id: generateId(), name: 'New font', family: 'Arial, Helvetica, sans-serif' }];
    this._emitKit(k);
  }
  private _deleteFont(f: BrandFont) {
    const k = this._clone();
    k.fonts = k.fonts.filter((x) => x.id !== f.id);
    this._emitKit(k);
  }

  private _addLogo() {
    const src = prompt('Logo image URL');
    if (!src) return;
    const k = this._clone();
    k.logos = [...k.logos, { id: generateId(), name: 'Logo', src }];
    this._emitKit(k);
  }
  private _deleteLogo(l: BrandLogo) {
    const k = this._clone();
    k.logos = k.logos.filter((x) => x.id !== l.id);
    this._emitKit(k);
  }

  private _fire(type: string, detail: Record<string, unknown>) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-brand-tab': PigeonBrandTab;
  }
}
