# Editor i18n + RTL Support — Design Spec

**Issue:** #21 Editor UI localization (i18n) + RTL support
**Date:** 2026-06-17
**Status:** Approved design — ready for implementation plan
**Branch:** `feat/21-i18n-rtl` (stacked on `feat/24-special-links`)

## Goal

Localize the editor chrome. Today every chrome string is hardcoded English.
Add a locale registry (`EditorConfig.locale` + an `en` string catalog with
host-supplied per-locale overrides) and RTL-aware layout, then replace all
hardcoded chrome strings with catalog lookups.

## Decisions (locked)

- **Access:** a module-level i18n singleton with `t(key)`. The editor configures
  it (locale + host messages) **before first render**; components import `t`.
- **Extraction:** comprehensive — every user-facing chrome string across the
  ~30 editor components, batched by area.
- **Catalog:** ship the built-in `en` catalog only (the fallback baseline);
  hosts supply other locales via `EditorConfig.messages`. (Community/host owns
  translations; we own infrastructure + en.)
- **Locale switching:** set-once-at-init is the tested contract; runtime
  `config.locale` change is best-effort (top chrome re-renders; deep
  already-rendered panels refresh on next interaction). No per-component
  reactive wiring.
- **RTL:** set `dir` on the host (flips the shell layout) + targeted
  `:host([dir='rtl'])` overrides for the shell's directional borders. Deep
  per-control mirroring is best-effort.

## i18n module — `packages/editor/src/i18n/`

`en.ts` — the built-in catalog, the source of truth for ALL keys:
```ts
export const EN_MESSAGES: Record<string, string> = {
  'toolbar.preview': 'Preview',
  'toolbar.undo': 'Undo',
  'palette.tab.content': 'Content',
  'panel.body.title': 'Email Body',
  // …every chrome string, dotted keys grouped by area…
};
```

`index.ts`:
```ts
import { EN_MESSAGES } from './en.js';

type Catalog = Record<string, string>;
const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'dv', 'yi']);

let _locale = 'en';
let _catalogs: Record<string, Catalog> = { en: EN_MESSAGES };

/** Configure the active locale + merge host-supplied catalogs over the en baseline. */
export function configureI18n(locale?: string, messages?: Record<string, Catalog>): void {
  _locale = locale || 'en';
  _catalogs = { en: EN_MESSAGES, ...(messages ?? {}) };
}

/** Translate a key: active locale → en fallback → the key itself. */
export function t(key: string): string {
  return _catalogs[_locale]?.[key] ?? EN_MESSAGES[key] ?? key;
}

export function getLocale(): string { return _locale; }

/** Resolve text direction: explicit override wins, else derived from the locale's language subtag. */
export function resolveDir(locale?: string, override?: 'ltr' | 'rtl'): 'ltr' | 'rtl' {
  if (override) return override;
  const lang = (locale || 'en').toLowerCase().split(/[-_]/)[0];
  return RTL_LANGS.has(lang) ? 'rtl' : 'ltr';
}
```

**Caveat:** the singleton means one active locale per page. Fine for the typical
single embedded editor; multiple editors with different locales on one page
would share locale. Documented; out of scope to fix here.

## Config (core `EditorConfig`)

```ts
  /** Active locale code (e.g. 'fr', 'ar'). Defaults to 'en'. */
  locale?: string;
  /** Host-supplied per-locale catalogs, merged over the built-in `en` baseline. */
  messages?: Record<string, Record<string, string>>;
  /** Explicit text direction. When unset, derived from `locale`. */
  dir?: 'ltr' | 'rtl';
```

## Editor wiring (`packages/editor/src/editor.ts`)

- In `connectedCallback`, BEFORE `_initState()`/first render:
  `configureI18n(this.config.locale, this.config.messages);`
- Resolve + apply direction (mirror `_applyTheme`): `_applyDir()` sets the
  host `dir` attribute to `resolveDir(this.config.locale, this.config.dir)`.
  Call it in `connectedCallback` and in `updated()` when `config` changes
  (also re-`configureI18n` + `requestUpdate()` there for best-effort switching).
- `dir` is a reflected concept on the host element (`this.setAttribute('dir', …)`),
  so descendant CSS and the browser's bidi handling pick it up.

## RTL layout

- `dir="rtl"` on the host flips the `.editor-body` flex row automatically
  (palette → right, properties → left), and flips text alignment/bidi.
- Add `:host([dir='rtl'])` overrides in `editor.ts` styles for the shell's
  directional borders: palette `border-right` ↔ `border-left`, properties
  `border-left` ↔ `border-right` (or convert those two to
  `border-inline-start`/`border-inline-end`).
- Deep per-control directional CSS is best-effort; most controls use symmetric
  padding and inherit `dir`.

## Comprehensive string extraction

Replace hardcoded chrome strings with `t('key')` + an `EN_MESSAGES` entry, area
by area (the plan batches these). Each component imports `t` from the i18n
module. Areas (≈30 components):
- **Toolbar** (`pigeon-toolbar`).
- **Palette** (`pigeon-palette` tabs, `pigeon-brand-tab`, `pigeon-saved-tab`, layout labels).
- **Preview / templates / asset-manager** (`pigeon-preview`, `pigeon-template-picker`, `pigeon-asset-manager`).
- **Property panels A** (body, text, button, image, hero).
- **Property panels B** (navbar, divider, spacer, social, html, row, column, custom).
- **Controls** (color-picker, font-picker, link-type-picker, spacing-input, slider-input, alignment-picker, merge-tag-picker).
- **Rich-text** (`bubble` titles/labels).

Keys are grouped by area (`toolbar.*`, `palette.*`, `panel.<block>.*`,
`control.*`, `richtext.*`). The `en` value equals the current hardcoded string,
so existing English-string tests keep passing.

## Error handling / fallback

- Unknown key → en value → the key string itself (never throws; never blank).
- Missing locale catalog → en baseline.
- `dir` defaults to `ltr` for unknown/LTR locales.

## Testing

**i18n module** (`packages/editor/__tests__/i18n.test.ts`):
1. `t` returns the en string by default; returns the key when unknown.
2. `configureI18n('fr', { fr: { 'toolbar.preview': 'Aperçu' } })` → `t('toolbar.preview')` = 'Aperçu'; an unkeyed-in-fr key falls back to en.
3. `resolveDir`: `'ar'` → `'rtl'`; `'en'` → `'ltr'`; override `'rtl'` wins; `'ar-EG'` → `'rtl'` (subtag).

**Editor** (`packages/editor/__tests__/`):
4. `<pigeon-editor .config=${{ dir: 'rtl' }}>` (or `locale:'ar'`) sets `dir="rtl"` on the host; default → `dir="ltr"`.
5. With `config.messages` for a locale, a representative chrome string renders
   translated (e.g. toolbar Preview button label).
6. Regression: with default config, existing chrome strings still read English
   (the broad existing suite already asserts many — they must stay green).

**Per-area extraction tasks** each re-run that component's existing tests to
confirm the `en` default keeps them green.

## Out of scope

- Bundling non-en translation catalogs (host provides via `messages`).
- Per-page multiple editors with distinct locales (singleton limitation).
- Fully reactive live locale switching of deeply-nested panels.
- Pixel-perfect RTL for every deep control (best-effort beyond the shell).
- Localizing user *content* (only editor chrome).
- Number/date/pluralization formatting (`t` is a flat key→string lookup).
