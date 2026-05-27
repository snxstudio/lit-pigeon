# Theming the Pigeon editor

The `<pigeon-editor>` chrome is built on a small set of CSS custom properties
("design tokens") plus a shadcn-inspired neutral palette. There are three ways
to customise the look, from simplest to most powerful:

1. **Light / dark / auto** — flip the whole editor with one attribute.
2. **Token overrides** — re-skin via CSS variables (colours, radii, shadows).
3. **`::part()` selectors** — restructure individual elements when tokens
   aren't enough.

You almost never need to fork or write deep selectors — tokens cover the vast
majority of cases.

---

## 1. Light / dark / auto

```html
<pigeon-editor theme="light"></pigeon-editor> <!-- default -->
<pigeon-editor theme="dark"></pigeon-editor>
<pigeon-editor theme="auto"></pigeon-editor> <!-- follows prefers-color-scheme -->
```

`theme` is a reflected property, so it also works imperatively:

```js
document.querySelector('pigeon-editor').theme = 'dark';
```

Internally `dark` adds a `.pigeon-dark` host class and `auto` adds
`.pigeon-auto`, which the token sheet keys off (`auto` only goes dark under an
OS `prefers-color-scheme: dark`).

---

## 2. Token overrides

All tokens are `--pigeon-*` custom properties defined on the editor host. They
inherit through every internal shadow root, so overriding them anywhere above
the editor re-skins the whole UI.

### From plain CSS

Custom properties pierce the shadow boundary, so a normal rule targeting the
host works:

```css
pigeon-editor {
  --pigeon-primary: #db2777;       /* pink-600 brand */
  --pigeon-primary-hover: #be185d;
  --pigeon-radius: 0.75rem;        /* rounder corners */
  --pigeon-font: 'Geist', sans-serif;
}
```

### From the `themeOverrides` property

For white-labelling without writing CSS, pass a token map:

```js
editor.themeOverrides = {
  '--pigeon-primary': '#db2777',
  '--pigeon-ring': '#ec4899',
};
```

These are applied as inline custom properties on the host, on top of the active
theme.

### Token reference

The full, authoritative list lives in
[`packages/editor/src/themes/tokens.ts`](../../packages/editor/src/themes/tokens.ts).
The most commonly overridden:

| Token | Purpose |
|---|---|
| `--pigeon-primary` / `--pigeon-primary-hover` | Brand / primary action colour |
| `--pigeon-primary-foreground` | Text/icon colour on primary surfaces |
| `--pigeon-accent` / `--pigeon-accent-foreground` | Subtle highlight fills (active toggles, palette chips) |
| `--pigeon-bg` / `--pigeon-surface` / `--pigeon-surface-hover` | Panel and hover backgrounds |
| `--pigeon-text` / `--pigeon-text-secondary` / `--pigeon-muted-foreground` | Text colours |
| `--pigeon-border` / `--pigeon-input` | Hairline and input border colours |
| `--pigeon-ring` / `--pigeon-ring-shadow` | Focus-ring colour and halo |
| `--pigeon-canvas-bg` | The "stage" behind the email sheet |
| `--pigeon-danger` / `--pigeon-success` (+ `-foreground`) | Status colours |
| `--pigeon-radius` / `--pigeon-radius-sm` / `--pigeon-radius-lg` | Corner radii |
| `--pigeon-shadow-sm` … `--pigeon-shadow-lg` | Elevation shadows |
| `--pigeon-font` / `--pigeon-font-mono` | Type families |
| `--pigeon-palette-width` / `--pigeon-properties-width` / `--pigeon-toolbar-height` | Layout sizing |

> The email **sheet** inside the canvas intentionally stays white regardless of
> theme — it represents the rendered email, whose own background comes from the
> document's body attributes, not the editor theme.

---

## 3. `::part()` selectors

When a token isn't enough (e.g. you want a square toolbar or a different active
treatment), style the exposed parts. Parts are forwarded to the
`<pigeon-editor>` boundary, so you target them from light DOM:

```css
/* Square off the export button and recolour it */
pigeon-editor::part(toolbar-button-export) {
  border-radius: 0;
  background: #111827;
}

/* Tighten the property-panel padding */
pigeon-editor::part(panel) {
  padding: 12px;
}
```

### Exposed parts

| Part | Element |
|---|---|
| `toolbar` / `palette` / `canvas` / `properties` | The four editor regions |
| `canvas-area` | The email sheet inside the canvas |
| `panel` | The active property-panel wrapper |
| `palette-tab` | A palette tab button (Content / Layers) |
| `palette-item` | A draggable block/layout chip |
| `toolbar-button` | Any toolbar button |
| `toolbar-button-{undo,redo,fullscreen,templates,preview,export}` | Per-action toolbar buttons |

---

## Recipes

**Brand the editor in one block:**

```css
pigeon-editor {
  --pigeon-primary: #0ea5e9;
  --pigeon-primary-hover: #0284c7;
  --pigeon-accent: #e0f2fe;
  --pigeon-accent-foreground: #0369a1;
  --pigeon-ring: #38bdf8;
}
```

**Force dark and widen the panels:**

```html
<pigeon-editor
  theme="dark"
  style="--pigeon-properties-width: 360px; --pigeon-palette-width: 280px;"
></pigeon-editor>
```
