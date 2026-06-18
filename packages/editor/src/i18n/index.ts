import { EN_MESSAGES } from './en.js';

type Catalog = Record<string, string>;

/** Language subtags that render right-to-left. */
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'dv', 'yi']);

let _locale = 'en';
let _catalogs: Record<string, Catalog> = { en: EN_MESSAGES };

/** Configure the active locale and merge host catalogs over the en baseline. */
export function configureI18n(locale?: string, messages?: Record<string, Catalog>): void {
  _locale = locale || 'en';
  _catalogs = { en: EN_MESSAGES, ...(messages ?? {}) };
}

/** Translate a key: active locale → en fallback → the key itself. */
export function t(key: string): string {
  return _catalogs[_locale]?.[key] ?? EN_MESSAGES[key] ?? key;
}

export function getLocale(): string {
  return _locale;
}

/** Resolve text direction: explicit override wins, else derived from the locale's language subtag. */
export function resolveDir(locale?: string, override?: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  if (override) return override;
  const lang = (locale || 'en').toLowerCase().split(/[-_]/)[0];
  return RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
}
