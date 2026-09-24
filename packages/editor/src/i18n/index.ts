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

/** Built-in catalogs, each code-split into its own chunk and fetched on demand. */
const LOCALE_LOADERS: Record<string, () => Promise<{ default: Catalog }>> = {
  es: () => import('./locales/es.js'),
  fr: () => import('./locales/fr.js'),
  de: () => import('./locales/de.js'),
  'pt-BR': () => import('./locales/pt-BR.js'),
  it: () => import('./locales/it.js'),
  nl: () => import('./locales/nl.js'),
  ja: () => import('./locales/ja.js'),
  'zh-CN': () => import('./locales/zh-CN.js'),
  ar: () => import('./locales/ar.js'),
  hi: () => import('./locales/hi.js'),
};

export const BUILT_IN_LOCALES = Object.keys(LOCALE_LOADERS);

/**
 * Load a built-in catalog for `locale`, matching the full tag first
 * (`pt-BR`) and then its language subtag (`pt` → `pt-BR`). Resolves to
 * `undefined` for English or an unsupported locale. Pass the result to
 * `config.messages`.
 */
export async function loadLocale(locale: string): Promise<Catalog | undefined> {
  const tag = locale.toLowerCase().replace(/_/g, '-');
  const lang = tag.split('-')[0];
  const code =
    BUILT_IN_LOCALES.find((c) => c.toLowerCase() === tag) ??
    BUILT_IN_LOCALES.find((c) => c.toLowerCase().split('-')[0] === lang);
  return code ? (await LOCALE_LOADERS[code]()).default : undefined;
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
