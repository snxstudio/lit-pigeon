# Developer guide

A guide for application developers embedding the Lit Pigeon email editor in a
production application.

> **Last verified against** `@lit-pigeon/core` 0.3.3, `editor` 0.3.3,
> `angular` 0.2.0, `react` 0.1.6, `vue` 0.1.5, `svelte` 0.1.5,
> `parser-mjml` 0.1.7, `renderer-mjml` 0.2.4, `import-unlayer` 0.2.0,
> `ssr` 0.1.5, `rest` 0.1.5, `lint` 0.1.5 and `blocks` 0.1.5
> (repository `main` at `6957887`, 23 September 2026), with Angular 22.2 and
> Chromium. Features that are not yet released are marked "coming in the next
> release" with a link to their issue.

## Pages

| Page | Covers |
|---|---|
| [Getting started](./getting-started.md) | Install, render the editor, react to changes and export HTML, for the web component, React, Vue, Svelte and Angular. |
| [Angular](./angular.md) | Angular 22 build settings, bundle budgets, OnPush and zoneless, binding `[document]`, Material dialogs and tabs. |
| [Load and save](./load-and-save.md) | Storing templates as MJML plus HTML or as JSON, and what the MJML round trip loses. |
| [Images and uploads](./images-and-uploads.md) | Upload adapters with auth headers, presigned uploads, the asset library and stock photos. |
| [Merge tags and personalisation](./merge-tags-and-personalisation.md) | Merge tags, loading them on demand, special links and row display conditions. |
| [Configuration](./configuration.md) | Every `EditorConfig` field and element property. |
| [Events and API](./events-and-api.md) | Every event and method, and each framework wrapper's inputs, outputs and methods. |
| [Theming and customisation](./theming-and-customisation.md) | Design tokens, `themeOverrides`, `::part()`, dark mode, languages and RTL, brand kits, fonts. |
| [Custom blocks](./custom-blocks.md) | The `BlockDefinition` API with a complete example, and state plugins. |
| [Server-side](./server-side.md) | `@lit-pigeon/ssr`, `@lit-pigeon/rest` and `@lit-pigeon/lint`, with a render-and-send example. |
| [Security](./security.md) | How HTML is handled, Content Security Policy, and what the host application must do. |
| [Troubleshooting](./troubleshooting.md) | Known failure modes and the versions that fix them. |
| [Migrating from Unlayer](./migrating-from-unlayer.md) | Converting Unlayer designs and replacing the embed. |
| [Migrating from GrapesJS](./migrating-from-grapesjs.md) | Importing MJML from `grapesjs-mjml`. |

Reference material outside the guide: the [plugin API](../plugins/README.md),
the [theming reference](../theming/README.md) and the
[AI authoring specification](../ai-spec/README.md).

## How the examples are verified

Every code block in these pages (except shell commands and plain-text output)
is a copy of a file, or a marked region of a file, in
[`examples/`](./examples/). That directory is a private workspace package,
`@lit-pigeon/docs-examples`, which:

- typechecks every example against the built packages with `tsc`, `vue-tsc`
  and `svelte-check` (part of `pnpm typecheck`);
- runs the examples with Vitest (part of `pnpm test`), including a test that
  fails if a code block in these pages no longer matches its source file;
- builds the Angular examples in a fresh `ng new` Angular 22 production
  application from `pnpm pack` tarballs and drives them in headless Chromium
  with [`examples/angular-e2e/run.sh`](./examples/angular-e2e/run.sh) (run by
  hand; it needs network access and Node.js 22.22.3 or later).

To change an example, edit the file under `examples/src/`, paste the same code
into the page, and run `pnpm build && pnpm test && pnpm typecheck`.
