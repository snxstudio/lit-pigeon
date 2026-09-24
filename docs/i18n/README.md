# Editor locales

The `<pigeon-editor>` chrome (toolbar, palette, property panels, asset picker, rich-text bubble) ships in English and ten other languages. English is built in. Every other locale is its own chunk, fetched only when you ask for it, so the locales you don't use cost nothing.

```js
import { loadLocale } from '@lit-pigeon/editor';

const locale = 'fr';
editor.config = {
  ...editor.config,
  locale,
  messages: { [locale]: await loadLocale(locale) },
};
```

`loadLocale()` matches the full tag first (`pt-BR`, case-insensitive, `_` or `-`), then the language subtag, so `pt` loads `pt-BR` and `fr-CA` loads `fr`. It resolves to `undefined` for English or for a locale with no built-in file. Any key a catalog lacks falls back to English. `BUILT_IN_LOCALES` lists the codes.

To correct a few strings, spread your own over the built-in catalog:

```js
messages: { fr: { ...(await loadLocale('fr')), 'toolbar.preview': 'Prévisualiser' } }
```

Arabic switches the editor to right-to-left automatically. Set `config.dir` to override the direction for any locale.

## Status

Every locale covers every key in `en.ts`: `__tests__/locales.test.ts` fails when a key is added to English and not to a locale.

| Code | Language | Direction | Status |
| --- | --- | --- | --- |
| `en` | English | LTR | Source |
| `es` | Spanish | LTR | Machine-translated, native review welcome |
| `fr` | French | LTR | Machine-translated, native review welcome |
| `de` | German | LTR | Machine-translated, native review welcome |
| `pt-BR` | Portuguese (Brazil) | LTR | Machine-translated, native review welcome |
| `it` | Italian | LTR | Machine-translated, native review welcome |
| `nl` | Dutch | LTR | Machine-translated, native review welcome |
| `ja` | Japanese | LTR | Machine-translated, native review welcome |
| `zh-CN` | Chinese (Simplified) | LTR | Machine-translated, native review welcome |
| `ar` | Arabic | RTL | Machine-translated, native review welcome |
| `hi` | Hindi | LTR | Machine-translated, native review welcome |

## Reviewing or adding a locale

Files live in [`packages/editor/src/i18n/locales/`](../../packages/editor/src/i18n/locales/).

- **Review:** fix strings in place. Once a native speaker has checked the whole file, remove "Machine-translated, native review welcome." from its header and update the table above.
- **New locale:** copy a locale file, translate every value, and add a loader line to `LOCALE_LOADERS` in `packages/editor/src/i18n/index.ts`.
