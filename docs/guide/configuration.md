# Configuration

`<pigeon-editor>` is configured through a handful of element properties and
one `config` object of type `Partial<EditorConfig>`. This page lists every
field, derived from `@lit-pigeon/core` 0.3.3 (`packages/core/src/types/editor.ts`)
and `@lit-pigeon/editor` 0.3.3 (`packages/editor/src/editor.ts`).

## Setting configuration

Set `config` as a property, never as an attribute, and replace the whole
object to change it. The element detects changes by identity, so mutating the
existing object in place has no effect.

A configuration using every field:

<!-- snippet: src/configuration/full-config.ts -->
```ts
import {
  InMemoryBrandKitStorage,
  InMemoryRowLibraryStorage,
  createDefaultDocument,
  type AssetStorage,
  type EditorConfig,
  type MergeTag,
} from '@lit-pigeon/core';
import { createAssetManagerConfig, type TokenGetter } from '../images/upload-handler.js';

const mergeTags: MergeTag[] = [
  { name: '{{first_name}}', label: 'First name', category: 'Contact', sample: 'Ada' },
  { name: '{{company}}', label: 'Company', category: 'Contact', sample: 'Example Ltd' },
];

export function createEditorConfig(getToken: TokenGetter, assetStorage: AssetStorage): Partial<EditorConfig> {
  return {
    // Used only when no `document` property is set before the editor connects.
    doc: createDefaultDocument('New campaign'),
    plugins: [],
    // #region asset-manager
    assetManager: createAssetManagerConfig(getToken),
    // #endregion asset-manager
    assetStorage,
    mergeTags: { tags: mergeTags },
    brandKit: new InMemoryBrandKitStorage(),
    fontConfig: [
      { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700' },
    ],
    rowLibrary: new InMemoryRowLibraryStorage(),
    linkTypes: [{ id: 'preferences', label: 'Email preferences', href: '{{preferences_url}}' }],
    locale: 'fr',
    messages: { fr: { 'toolbar.preview': 'Aperçu', 'toolbar.export': 'Exporter' } },
    dir: 'ltr',
  };
}
```

## `EditorConfig` reference

"Read" says when the editor looks at the field. "Live" means a new `config`
object takes effect on the next render.

| Field | Type | Default | Read | Description |
|---|---|---|---|---|
| `doc` | `PigeonDocument` | A blank document from `createDefaultDocument()` (name `'Untitled'`, 600 px wide) | Once, when the element first connects | Initial document, used only if the `document` property has not been set by then. Prefer the `document` property. |
| `plugins` | `PigeonPlugin[]` | `[]` | When the element first connects, and on every document load | State plugins. The history plugin is always added: the editor inserts it into the array you pass (the array is modified). If you replace `plugins` later, include `createHistoryPlugin()`, or undo stops working after the next load. Plugins' `blocks` are **not** registered, and their `commands` are not callable from the editor; see [Custom blocks](./custom-blocks.md). |
| `assetManager` | `AssetManagerConfig` | `{}`: uploads enabled, stored as `data:` URLs | Live | Upload adapters, accepted types, size limit and stock photos. See [Images and uploads](./images-and-uploads.md). |
| `assetStorage` | `AssetStorage` | None (no Library tab) | Live | Asset library for the Library tab. The element's `assetStorage` property takes precedence. |
| `mergeTags` | `MergeTagConfig` (`{ trigger?: string; tags?: MergeTag[] }`) | None: no Tag button | Live | Merge tags offered by the Tag button. With no tags (for example `{}`), clicking Tag fires `pigeon:merge-tag-request`. `trigger` is declared but has no effect in 0.3.3. See [Merge tags](./merge-tags-and-personalisation.md). |
| `brandKit` | `BrandKit \| BrandKitStorage` | None: no Brand tab | When `config` changes | A kit is used directly. A storage is detected by its `list()` method; the first kit it returns becomes active, and edits made in the Brand tab are written back with `save()`. |
| `fontConfig` | `FontDefinition[]` (`{ name, family, url? }`) | `[]` | Live | Fonts added to the font pickers. Fonts with a `url` are emitted as `<mj-font>` by `exportMjml()`, `exportHtml()` and the preview. |
| `rowLibrary` | `RowLibraryStorage` | An in-memory store, per element | Live | Persistence for the palette's Saved tab (rows saved with a row's save action). |
| `linkTypes` | `LinkType[]` (`{ id, label, href?, prompt? }`) | `[]` | Live | Extra entries for the link picker and the button panel, after the built-in Unsubscribe (`{{unsubscribe_url}}`), View in browser (`{{view_in_browser_url}}`), Email address and Phone number. |
| `locale` | `string` | `'en'` | When the element connects and when `config` changes | Active UI locale. The setting is global to the page: the last editor to apply it wins for every editor instance. |
| `messages` | `Record<string, Record<string, string>>` | English only | As `locale` | Per-locale catalogues, merged over the built-in English strings. Missing keys fall back to English, then to the key itself. |
| `dir` | `'ltr' \| 'rtl'` | Derived from `locale` | As `locale` | Text direction, set as the element's `dir` attribute. Without it, `ar`, `he`, `fa`, `ur`, `ps`, `sd`, `dv` and `yi` locales are right-to-left. |

The behaviour of `doc`, `plugins`, `locale` and `dir` above is pinned by
[`examples/test/configuration.test.ts`](./examples/test/configuration.test.ts).

## Element properties

These are set on `<pigeon-editor>` directly (or through a framework wrapper's
inputs):

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `document` | none (use the property) | `PigeonDocument \| undefined` | `undefined` | The document to edit. Setting a different object loads it and resets undo history; setting the object the editor already holds does nothing. See [Events and API](./events-and-api.md#echoing-the-document-back). |
| `config` | none | `Partial<EditorConfig>` | `{}` | See above. |
| `renderer` | none | `Renderer` | `undefined` | Used by Preview and `exportHtml()`. Typically `new MjmlRenderer()`. Without it, Preview fires `pigeon:preview` for the host to handle. |
| `documentToMjml` | none | `(doc, options?: { fonts?: FontDefinition[] }) => string` | `undefined` | Used by `exportMjml()` and the toolbar's Export MJML. Typically `documentToMjml` from `@lit-pigeon/renderer-mjml`. |
| `theme` | `theme` (reflected) | `'light' \| 'dark' \| 'auto'` | `'light'` | Colour theme for the editor chrome. See [Theming](./theming-and-customisation.md). |
| `themeOverrides` | none | `Record<string, string>` | `{}` | Design tokens applied as inline custom properties on the element. |
| `templateStorage` | none | `TemplateStorage` | An in-memory store seeded with the four starter templates | Backs the toolbar's Templates dialog (open and save as). |
| `assetStorage` | none | `AssetStorage` | `undefined` | Asset library; takes precedence over `config.assetStorage`. |

The element also sets its own `dir` attribute (from `config`) and a
`fullscreen` attribute while the toolbar's fullscreen mode is on. It fills its
container (`width: 100%; height: 100%`), so give the container a height.

## Storage interfaces

The storage properties share one shape. Implement them against your own API,
or use the in-memory implementations from `@lit-pigeon/core` in tests and
demos (filesystem implementations for Node.js are in
`@lit-pigeon/mcp-server`):

| Interface | Methods | In-memory implementation |
|---|---|---|
| `TemplateStorage` | `list()`, `get(id)`, `save(template)`, `delete(id)` | `InMemoryTemplateStorage` |
| `AssetStorage` | `list(filter?)`, `get(id)`, `save(asset)`, `delete(id)`, `listFolders()` | `InMemoryAssetStorage` |
| `BrandKitStorage` | `list()`, `get(id)`, `save(kit)`, `delete(id)` | `InMemoryBrandKitStorage` |
| `RowLibraryStorage` | `list()`, `get(id)`, `save(entry)`, `delete(id)` | `InMemoryRowLibraryStorage` |

All methods return promises. Errors from `brandKit` storage are reported with a
`brand-kit-error` event and errors from `rowLibrary` with `row-library-error`;
see [Events and API](./events-and-api.md). Errors from `templateStorage` and
`assetStorage` are not reported as events.

Saving a template or a row asks the user for a name (templates in the dialog,
rows with the browser's `window.prompt`) and uses a slug of the name as the id,
so saving under an existing name overwrites that entry.
