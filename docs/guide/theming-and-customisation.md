# Theming and customisation

This page covers the look of the editor's own interface (its "chrome"): design
tokens, `themeOverrides`, `::part()`, dark mode, languages and right-to-left
layout, brand kits and fonts. The email itself is styled by the document
(body background, font family, block settings), not by the editor theme.

The examples are tested in
[`examples/test/theming.test.ts`](./examples/test/theming.test.ts), and
`theme.css` is also checked in Chromium by
[`examples/angular-e2e/theme-check.mjs`](./examples/angular-e2e/theme-check.mjs).

## Design tokens

Every part of the chrome is styled with `--pigeon-*` custom properties. The
defaults are declared on the editor's shadow host, so set your values **on the
`pigeon-editor` element itself**. Values set on an ancestor such as `body` or a
wrapper `div` are ignored, because the element's own declarations take
precedence over inherited values.

<!-- snippet: src/theming/theme.css -->
```css
/* Tokens must be set on the element itself: values on an ancestor are ignored. */
pigeon-editor {
  --pigeon-primary: #0f766e;
  --pigeon-primary-hover: #115e59;
  --pigeon-accent: #ccfbf1;
  --pigeon-accent-foreground: #115e59;
  --pigeon-ring: #14b8a6;
  --pigeon-radius: 4px;
  --pigeon-font: 'Inter', system-ui, sans-serif;
  --pigeon-properties-width: 340px;
}

/* A rule on the element applies in every theme, so give dark mode its own values. */
pigeon-editor[theme='dark'] {
  --pigeon-primary: #2dd4bf;
  --pigeon-primary-hover: #5eead4;
  --pigeon-accent: #134e4a;
  --pigeon-accent-foreground: #ccfbf1;
}

@media (prefers-color-scheme: dark) {
  pigeon-editor[theme='auto'] {
    --pigeon-primary: #2dd4bf;
    --pigeon-primary-hover: #5eead4;
    --pigeon-accent: #134e4a;
    --pigeon-accent-foreground: #ccfbf1;
  }
}

/* Parts: use them for shape and layout; use tokens for colours. */
pigeon-editor::part(toolbar-button) {
  border-radius: 0;
}

pigeon-editor::part(canvas-area) {
  box-shadow: none;
  outline: 1px solid #e2e8f0;
}
```

The full set, from `packages/editor/src/themes/tokens.ts`:

| Group | Tokens |
|---|---|
| Surfaces | `--pigeon-bg`, `--pigeon-surface`, `--pigeon-surface-hover`, `--pigeon-muted`, `--pigeon-muted-foreground` |
| Text | `--pigeon-text`, `--pigeon-text-secondary` |
| Borders | `--pigeon-border`, `--pigeon-input`, `--pigeon-border-focus` |
| Brand | `--pigeon-primary`, `--pigeon-primary-hover`, `--pigeon-primary-foreground`, `--pigeon-accent`, `--pigeon-accent-foreground` |
| Focus | `--pigeon-ring`, `--pigeon-ring-shadow` |
| Status | `--pigeon-danger`, `--pigeon-danger-foreground`, `--pigeon-success`, `--pigeon-success-foreground` |
| Canvas | `--pigeon-canvas-bg`, `--pigeon-drop-color`, `--pigeon-selected-outline` |
| Shape | `--pigeon-radius`, `--pigeon-radius-sm`, `--pigeon-radius-lg`, `--pigeon-shadow-sm`, `--pigeon-shadow`, `--pigeon-shadow-md`, `--pigeon-shadow-lg` |
| Type | `--pigeon-font`, `--pigeon-font-mono` |
| Layout | `--pigeon-palette-width` (248px), `--pigeon-properties-width` (312px), `--pigeon-toolbar-height` (52px) |

The default look is a neutral slate palette with an indigo primary colour
(`#4f46e5` light, `#6366f1` dark). The email sheet on the canvas stays white
in every theme, because it represents the rendered email.

## `theme` and `themeOverrides`

`theme` is `'light'` (default), `'dark'` or `'auto'` (follows the operating
system's `prefers-color-scheme`). It is reflected to the `theme` attribute, so
it can be set in HTML or targeted in CSS as above.

`themeOverrides` sets tokens from script, as inline custom properties on the
element, which win over stylesheet rules:

<!-- snippet: src/theming/theme-overrides.ts -->
```ts
import type { PigeonEditor } from '@lit-pigeon/editor';

export function applyTheme(editor: PigeonEditor, mode: 'light' | 'dark' | 'auto', brandColour: string): void {
  editor.theme = mode;
  // Applied as inline custom properties on the element, over the active theme.
  editor.themeOverrides = {
    '--pigeon-primary': brandColour,
    '--pigeon-ring': brandColour,
  };
}

/** Removing a key from themeOverrides does not reset it; clear it explicitly. */
export function clearOverride(editor: PigeonEditor, token: string): void {
  editor.style.removeProperty(token);
  const { [token]: _removed, ...rest } = editor.themeOverrides;
  editor.themeOverrides = rest;
}
```

The editor only ever sets the properties in `themeOverrides`; it never removes
them. Assigning `{}` leaves the previous values in place, so clear a token with
`style.removeProperty()` as above. Because inline values apply in both themes,
prefer a stylesheet when light and dark need different values.

## `::part()`

These parts are exposed on `<pigeon-editor>`:

| Part | Element |
|---|---|
| `toolbar`, `palette`, `canvas`, `properties` | The four regions |
| `canvas-area` | The email sheet inside the canvas |
| `panel` | The active property panel |
| `palette-tab` | A palette tab (Content, Layers, Brand, Saved) |
| `palette-item` | A block or layout item in the palette |
| `toolbar-button` | Every toolbar button |
| `toolbar-button-undo`, `-redo`, `-fullscreen`, `-templates`, `-preview`, `-export` | Individual toolbar buttons |

Use parts for shape, spacing, outlines and layout. In Chromium, a `::part()`
rule does not override a colour that the editor's own stylesheet sets on that
element, even with `!important`: for example
`pigeon-editor::part(toolbar-button-export) { background: … }` has no effect,
because the export button's background comes from `--pigeon-primary`. Change
colours through tokens.

## Dark mode

- `theme="dark"` always uses the dark tokens.
- `theme="auto"` uses them when the operating system prefers dark.
- Your own token rules on `pigeon-editor` apply in every mode. Scope dark
  values with `pigeon-editor[theme='dark']` and, for `auto`, a
  `prefers-color-scheme: dark` media query, as in `theme.css` above.

The rendered email has its own dark-mode handling: `MjmlRenderer` adds
`color-scheme` meta tags by default (turn them off with
`outlookWorkarounds: false`).

## Languages and right-to-left layout

The interface text comes from a built-in English catalogue. Supply
translations with `config.locale` and `config.messages`:

<!-- snippet: src/theming/i18n.ts -->
```ts
import type { EditorConfig } from '@lit-pigeon/core';

// Keys come from packages/editor/src/i18n/en.ts. Missing keys fall back to English.
export const germanConfig: Partial<EditorConfig> = {
  locale: 'de',
  messages: {
    de: {
      'toolbar.undo': 'Rückgängig',
      'toolbar.redo': 'Wiederholen',
      'toolbar.preview': 'Vorschau',
      'toolbar.export': 'Exportieren',
      'toolbar.templates': 'Vorlagen',
    },
  },
};

// Arabic, Hebrew, Persian and Urdu (and a few others) switch the layout to right-to-left.
export const arabicConfig: Partial<EditorConfig> = {
  locale: 'ar',
  messages: { ar: { 'toolbar.preview': 'معاينة' } },
};
```

- The list of keys is the source file
  [`packages/editor/src/i18n/en.ts`](../../packages/editor/src/i18n/en.ts)
  (216 keys in 0.3.3); the catalogue is not exported from the package. Lookup is
  active locale, then English, then the key itself.
- Only English ships with the editor today. Additional locale files are
  planned ([#98](https://github.com/snxstudio/lit-pigeon/issues/98)).
- Some strings are not yet in the catalogue, for example the asset manager's
  size and type errors and the "Name this saved row" prompt.
- The locale is global to the page. With several editors on one page, the last
  one configured sets the language for all of them.
- Set the locale before the editor is shown. Switching it at runtime updates
  components as they next render, so some labels can stay in the previous
  language until then.
- `config.dir` sets the direction explicitly. Without it, the editor sets
  `dir="rtl"` on itself for `ar`, `he`, `fa`, `ur`, `ps`, `sd`, `dv` and `yi`
  (including regional variants such as `ar-EG`), and the layout mirrors.
  This affects the editor chrome only, not the email.

## Brand kits

A brand kit adds a Brand tab to the palette with saved colours, fonts and
logos. Colours apply to the selected button's background or to the body
background; fonts apply to the body font family; logos insert an image block.

<!-- snippet: src/theming/brand-kit.ts -->
```ts
import type { BrandKit, EditorConfig } from '@lit-pigeon/core';

const now = new Date().toISOString();

export const brandKit: BrandKit = {
  id: 'default',
  name: 'Default brand',
  colors: [
    { id: 'primary', name: 'Primary', value: '#0f766e' },
    { id: 'ink', name: 'Ink', value: '#0f172a' },
  ],
  fonts: [
    // Fonts with a url are loaded in the preview and emitted as <mj-font> on export.
    { id: 'inter', name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700' },
  ],
  logos: [{ id: 'logo', name: 'Logo', src: 'https://cdn.example.com/logo.png', width: 160 }],
  createdAt: now,
  updatedAt: now,
};

export const brandConfig: Partial<EditorConfig> = {
  brandKit,
  // Fonts offered in the font pickers, in addition to the brand kit's.
  fontConfig: [{ name: 'Georgia', family: 'Georgia, serif' }],
};
```

Pass a `BrandKitStorage` instead of a kit to load kits from your API: the
first kit returned by `list()` becomes active, and edits in the Brand tab are
saved with `save()`. The editor fires `brand-kit-change` on every edit and
`brand-kit-error` if the storage rejects. Brand colours also appear as
swatches in the colour pickers.

## Fonts

`config.fontConfig` adds fonts to the font pickers. Each is
`{ name, family, url? }`; give `family` a full stack with email-safe fallbacks.
Fonts with a `url` (for example a Google Fonts CSS URL), and brand-kit fonts
with a `url`, are:

- loaded in the preview;
- emitted as `<mj-font>` plus a stylesheet link by `exportMjml()`,
  `exportHtml()` and the toolbar exports.

If you call `documentToMjml` or `MjmlRenderer.render` yourself, pass the same
list as `{ fonts }`; see [Load and save](./load-and-save.md#saving). Web fonts
work in some email clients only (notably Apple Mail and iOS); others use the
fallbacks in `family`.

The editor's own interface font is the `--pigeon-font` token, not
`fontConfig`.
