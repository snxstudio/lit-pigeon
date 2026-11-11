/** Language subtags written right-to-left. */
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'dv', 'yi']);

/**
 * Resolve text direction for a BCP 47 tag: an explicit override wins, else the
 * language subtag decides (`ar`, `pt-BR` → `rtl`, `ltr`). Shared by the editor
 * chrome and the renderer so the RTL list is defined once.
 */
export function resolveDirection(language?: string, override?: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  if (override) return override;
  const lang = (language || 'en').toLowerCase().split(/[-_]/)[0];
  return RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
}
