# Troubleshooting

Problems found while integrating the editor into production applications, with
the version that fixes each one. Where no fixed version exists yet, the entry
gives a workaround.

| Symptom | Affected | Fixed in |
|---|---|---|
| [Angular AOT or JIT errors](#angular-aot-or-jit-errors-from-lit-pigeonangular-before-020) | `@lit-pigeon/angular` before 0.2.0 | `@lit-pigeon/angular` 0.2.0 |
| [`Could not resolve "fs"`](#could-not-resolve-fs-when-building-for-the-browser) | Any browser build with `@lit-pigeon/renderer-mjml` | Configuration: alias `mjml` to `mjml-browser` |
| [Line breaks doubled](#line-breaks-doubled-after-an-mjml-round-trip) | `@lit-pigeon/parser-mjml` 0.1.6 and earlier | `@lit-pigeon/parser-mjml` 0.1.7 (stored MJML needs a one-off repair) |
| [Two export events per click](#two-events-for-each-export) | `@lit-pigeon/editor` 0.3.2 and earlier | `@lit-pigeon/editor` 0.3.3 |
| [Shortcuts act on host widgets](#keyboard-shortcuts-act-on-the-host-pages-own-widgets) | `@lit-pigeon/editor` 0.3.2 and earlier | `@lit-pigeon/editor` 0.3.3 |
| [Size and budget errors](#bundle-budget-and-size-limit-errors) | Angular apps importing the editor eagerly; repository CI before #93 | Configuration: lazy route; repository budgets raised in #93 |
| [`currentDirective._$initialize is not a function`](#currentdirective_initialize-is-not-a-function-in-development) | Development builds with `@lit-pigeon/editor` 0.3.3 | Not fixed yet; workaround below |

## Angular AOT or JIT errors from `@lit-pigeon/angular` before 0.2.0

**Symptoms.** With `@lit-pigeon/angular` 0.1.6 and earlier, an Angular 22
production build fails with:

```text
✘ [ERROR] NG2012: Component imports must be standalone components, directives, pipes, or must be NgModules.
```

In other set-ups the build succeeds but the component fails at runtime in
AOT builds, because it was not compiled for the Ivy runtime.

**Cause.** Versions before 0.2.0 were built with plain Vite, without Angular
compiler (Ivy) metadata.

**Fix.** Upgrade to `@lit-pigeon/angular` 0.2.0 or later, which is built with
ng-packagr in partial compilation mode. Its peer dependency is
`@angular/core >=22.0.0`; 0.1.x declared `>=17.0.0`, so older applications must
upgrade Angular too. 0.2.0 also adds the `renderer`, `documentToMjml`, `theme`,
`themeOverrides`, `templateStorage` and `assetStorage` inputs and the
`exportMjml()`/`exportHtml()` methods; code that uses them fails to compile
against 0.1.x with `TS2339: Property 'exportMjml' does not exist`.

## `Could not resolve "fs"` when building for the browser

**Symptoms.** The build stops with errors such as:

```text
✘ [ERROR] Could not resolve "path"
    node_modules/mjml-parser-xml/lib/index.js:15:43
✘ [ERROR] Could not resolve "fs"
    node_modules/mjml-parser-xml/lib/index.js:16:41
✘ [ERROR] Could not resolve "url"
    node_modules/relateurl/lib/parse/urlstring.js:3:24
```

**Cause.** `@lit-pigeon/renderer-mjml` depends on `mjml`, which is written for
Node.js.

**Fix.** Alias `mjml` to `mjml-browser` in your application's `package.json`:

<!-- snippet: src/angular/package-overrides.json -->
```json
{
  "overrides": {
    "mjml": "npm:mjml-browser@^4.18.0"
  }
}
```

npm applies a new override only to a fresh tree. If the error persists and
`npm ls mjml` still shows `mjml@4.x` rather than `mjml@npm:mjml-browser@…`,
delete `package-lock.json` and `node_modules` and install again. For pnpm and
Yarn, and the related `allowedCommonJsDependencies` warning, see
[Angular](./angular.md#build-configuration). If you render only on the server,
remove the renderer from the browser bundle instead.

## Line breaks doubled after an MJML round trip

**Symptoms.** Every line break in imported text appears twice after the
template is saved and sent.

**Cause.** `@lit-pigeon/parser-mjml` 0.1.6 and earlier wrote void elements
with a closing tag: `One<br/>Two` was saved as `One<br></br>Two`, which
browsers and email clients read as two breaks. The same happened to `<img>`
and `<hr>`.

**Fix.** Upgrade to `@lit-pigeon/parser-mjml` 0.1.7. Templates saved with the
old version still contain `<br></br>`, and the new parser keeps both breaks,
so repair stored MJML once:

<!-- snippet: src/troubleshooting/repair-line-breaks.ts -->
```ts
/**
 * MJML saved with @lit-pigeon/parser-mjml 0.1.6 or earlier contains
 * `<br></br>` (and `<img …></img>`, `<hr></hr>`), which renders as two line
 * breaks. Upgrading the parser does not change templates already stored, so
 * repair them once, before opening or as a data migration.
 */
export function repairVoidElements(mjml: string): string {
  return mjml.replace(/<(br|hr|img)(\s[^>]*)?>\s*<\/\1>/gi, (_match, tag: string, attrs = '') => `<${tag}${attrs} />`);
}
```

This is tested in
[`examples/test/troubleshooting.test.ts`](./examples/test/troubleshooting.test.ts)
against MJML produced by 0.1.6. Parser 0.1.7 also fixed lost HTML comments
(including Outlook conditional comments), entity decoding in text and
attributes, lost `mj-attributes`/`mj-class` styling, `mj-hero` button styling,
`mj-navbar` `base-url` and dropped `mj-table`. Templates imported with an
earlier version may be worth re-importing from their original MJML.

## Two events for each export

**Symptoms.** A `pigeon:export-html`, `pigeon:export-mjml` or
`pigeon:export-json` listener runs twice per click, and the first event has no
`detail`. In Angular, `pigeonExportHtml` emits `null` first.

**Cause.** In `@lit-pigeon/editor` 0.3.2 and earlier, the toolbar's own event
escaped the editor alongside the editor's event.

**Fix.** Upgrade to `@lit-pigeon/editor` 0.3.3, which sends one event with the
payload: `{ document, html }`, `{ document, mjml }` or `{ document }`. In the
same release, `pigeon:export` (Export menu opened) and
`pigeon:merge-tag-request` started firing; before 0.3.3 they were documented
but never dispatched.

`pigeon:preview` still reaches the host twice when no `renderer` is set; see
[Events and API](./events-and-api.md#known-issue-duplicate-pigeonpreview).

## Keyboard shortcuts act on the host page's own widgets

**Symptoms.** With a block selected, pressing Delete, Backspace, the arrow keys
or Cmd/Ctrl+C/V in your application's own controls (a search box outside the
editor, a dialog's buttons, a list) deletes or moves email content, or the
browser's copy and paste stop working there.

**Cause.** In `@lit-pigeon/editor` 0.3.2 and earlier, the editor listened for
key presses on the whole document.

**Fix.** Upgrade to `@lit-pigeon/editor` 0.3.3. Shortcuts now act only on key
presses aimed at the editor, or at nothing in particular (the page body), and
never inside inputs, text areas, selects or content-editable elements.

Related fixes in 0.3.3 for embedded use:

- Moving the element in the DOM (Angular Material dialogs and tabs, portals)
  no longer resets the document and undo history to the initial document.
- The preview iframe and HTML blocks on the canvas no longer run script.
- The merge-tag picker opens under its Tag button instead of far away.

## Bundle budget and size-limit errors

**Symptoms (Angular application).**

```text
✘ [ERROR] bundle initial exceeded maximum budget. Budget 1.00 MB was not met by 1.21 MB with a total of 2.21 MB.
```

**Cause.** The editor, Lit, the rich-text engine and `mjml-browser` add about
2 MB (raw) to whichever bundle imports them. A new Angular 22 application's
`initial` budget is 1 MB.

**Fix.** Load the editor from a lazy route (`loadComponent`), which keeps the
initial bundle at about 250 kB; see [Angular](./angular.md#bundle-budgets).
Raising the budget also works but makes every page load slower.

**Symptoms (contributors to this repository).** `pnpm size` fails in CI for the
editor, `renderer-mjml` or `parser-mjml` entries after adding the 0.3.3 and
parser 0.1.7 fixes.

**Fix.** The budgets in `.size-limit.json` were raised in
[#93](https://github.com/snxstudio/lit-pigeon/pull/93) (editor 50 kB,
`renderer-mjml` 3.5 kB, `parser-mjml` 6 kB, gzipped, excluding peer
dependencies). Merge `main` into your branch.

## `currentDirective._$initialize is not a function` in development

**Symptoms.** In `ng serve` or `ng build --configuration development` (and
other development builds that resolve Lit's `development` export condition,
such as a Vite dev server), property panels that use the Tag button (text,
HTML, body) fail to render their content, and the
console shows:

```text
ERROR TypeError: currentDirective._$initialize is not a function
```

Production builds work.

**Cause.** `@lit-pigeon/editor` 0.3.3 bundles a production copy of Lit's `ref`
directive into `dist/index.js` instead of importing it from `lit`. When the
application loads Lit's development build, the two copies do not match.

**Workaround (Angular).** Resolve Lit's production build in development too,
and turn off the dev server's pre-bundling:

<!-- snippet: src/angular/angular-dev-workaround.json -->
```json
{
  "projects": {
    "my-app": {
      "architect": {
        "build": {
          "configurations": {
            "development": {
              "conditions": ["module", "production"]
            }
          }
        },
        "serve": {
          "options": {
            "prebundle": false
          }
        }
      }
    }
  }
}
```

With both settings the verification application passes the same checks under
`ng serve` as in production. Other bundlers need the equivalent: resolve the
`production` condition instead of `development` for `lit`, `lit-html`,
`lit-element` and `@lit/reactive-element`.

## Other things that commonly go wrong

| Symptom | Cause and fix |
|---|---|
| `NG0950` when opening the editor route | A required `input()` bound from a route parameter needs `provideRouter(routes, withComponentInputBinding())`. |
| "Unexpected global target 'pigeon' defined for 'merge-tag-request' event" | Angular templates cannot bind `(pigeon:…)` events. Add the listener in code; see [Angular](./angular.md#inputs-outputs-and-methods). |
| Undo history resets, or edits disappear, after a change | The document was bound back as a copy or after a delay. See [Events and API](./events-and-api.md#echoing-the-document-back). |
| Save button enabled as soon as a template opens | `pigeon:change` also fires for loads and selection changes. Compare document objects; see [Events and API](./events-and-api.md#detecting-unsaved-changes). |
| Undo stops working after changing `config.plugins` | Include `createHistoryPlugin()` when you replace `plugins`; see [Configuration](./configuration.md). |
| Custom block missing from the palette | Register it with `registerBlock()` before the editor connects; `config.plugins[].blocks` is not registered. See [Custom blocks](./custom-blocks.md#registering-blocks). |
| `/render` returns 400 "Invalid document" for documents with custom blocks | `validateDocument` accepts only built-in block types. See [Custom blocks](./custom-blocks.md#validation-and-custom-blocks). |
| Images show in the editor but not in Gmail | No upload adapter was configured, so images were stored as `data:` URLs. Configure `uploadHandler`; see [Images and uploads](./images-and-uploads.md). |
| Uploaded image not in the Library tab | The editor does not save uploads to `assetStorage`; see [Images and uploads](./images-and-uploads.md#asset-storage-and-the-library-tab). |
| CSS variables on a wrapper element have no effect | Set tokens on `pigeon-editor` itself; see [Theming](./theming-and-customisation.md#design-tokens). |
| Imported template's columns are all the same width | The parser ignores `mj-column` `width`. See [Load and save](./load-and-save.md#what-the-parser-does-not-keep). |
| `{{user.plan}}` not replaced by `applyMergeTags` | Pass nested values, `{ user: { plan: 'Pro' } }`, not `{ 'user.plan': 'Pro' }`. |
| Every template with a hero fails lint | Hero blocks have no alt text field, so `alt-text/missing` is always reported for them. See [Server-side](./server-side.md#lit-pigeonlint). |
