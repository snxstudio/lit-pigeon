# Comparison: bundle size and features

Measured and sourced on **2026-09-23** with Node v22.22.2 and esbuild 0.28.2, and reproduced byte for byte on 2026-09-24. Top-level packages are pinned; their transitive dependencies are whatever npm resolves on the day, so a later run can differ slightly. Re-run the script to check.

## Initial JS size

```bash
node scripts/benchmark/run.mjs
```

The script ([`scripts/benchmark/run.mjs`](../scripts/benchmark/run.mjs)) installs each target from npm at the pinned versions below into its own temp directory, bundles a minimal page with esbuild 0.28.2 (`minify`, `splitting`, ESM, browser platform, `NODE_ENV=production`), and gzips the output with Node's zlib defaults. **Initial JS** is the entry chunk plus every chunk it imports statically. Chunks that are only reached through `import()` count towards **All JS**. CSS is whatever the documented setup imports. Fonts and images are excluded. Raw results are in [`scripts/benchmark/results.json`](../scripts/benchmark/results.json).

Every page mounts the editor (or, for EmailBuilder.js, the renderer) with an empty document. All six bundles were loaded in headless Chromium and ran without page errors.

| Target | Versions | Initial JS (gzip) | All JS incl. lazy (gzip) | Initial CSS (gzip) |
| --- | --- | ---: | ---: | ---: |
| Lit Pigeon (`@lit-pigeon/editor`) | @lit-pigeon/editor@0.3.3, @lit-pigeon/core@0.3.3 | 168.9 kB | 175.2 kB | 0.0 kB |
| GrapesJS + `grapesjs-mjml` | grapesjs@0.23.6, grapesjs-mjml@1.0.8 | 662.0 kB | 662.0 kB | 12.1 kB |
| Easy Email (`easy-email-editor` + `-core` + `-extensions`) | react@18.3.1, react-dom@18.3.1, easy-email-core@4.17.1, easy-email-editor@4.17.1, easy-email-extensions@4.17.1, react-final-form@6.5.9, final-form@4.20.10, mjml-browser@4.15.3 | 847.8 kB | 909.2 kB | 42.4 kB |
| EmailBuilder.js (`@usewaypoint/email-builder`, renderer only) | react@18.3.1, react-dom@18.3.1, @usewaypoint/email-builder@0.0.9, zod@3.25.76 | 98.6 kB | 98.6 kB | 0.0 kB |
| Unlayer (`react-email-editor` wrapper) | react@18.3.1, react-dom@18.3.1, react-email-editor@2.1.2 | 45.5 kB | 45.5 kB | 0.0 kB |
|  ↳ plus `https://editor.unlayer.com/embed.js?2` at runtime | | ? | | |
| Reference: React 18 + ReactDOM rendering one `<div>` | react@18.3.1, react-dom@18.3.1 | 44.6 kB | 44.6 kB | 0.0 kB |

1 kB = 1,024 bytes.

How to read the table:

- **Lit Pigeon.** The figure includes Lit, `@lit-pigeon/core`, immer and nanoid. In the published 0.3.3 package, `dist/index.js` imports `dist/rich-text.js` statically, so the TipTap rich-text engine loads up front. The ~69 kB quoted elsewhere in this repo is the initial JS of the [playground](https://lit-pigeon.wearesnx.studio/playground/), which Vite builds from the editor's source, where TipTap stays lazy. A consumer installing from npm gets the figure above.
- **React-based targets** include React and ReactDOM (44.6 kB on their own; see the reference row). Subtract that if your app already ships React.
- **Easy Email** uses the `StandardLayout` setup from the `easy-email-extensions` README, because `easy-email-editor` alone has no block palette or property panels.
- **EmailBuilder.js** does not publish its visual editor to npm: the README says to fork the repository and self-host the sample app. `@usewaypoint/email-builder` is the renderer (`Reader`, `renderToStaticMarkup`), so its row is not an editor-to-editor comparison.
- **Unlayer.** `react-email-editor` is a thin wrapper. Its default `scriptUrl` is `https://editor.unlayer.com/embed.js?2`, which then loads the editor from Unlayer's servers. That runtime cost is not measured here, because the benchmark environment could not reach `editor.unlayer.com`. The script tries to fetch the loader script and prints its size when it can.
- **Not measured yet:** time-to-interactive and MJML re-render time.

## Features

✓ = yes, ✗ = no, ? = not verified from a public source. Each cell cites where it came from. Lit Pigeon's column refers to this repository.

| | Lit Pigeon | Unlayer | GrapesJS + grapesjs-mjml | Easy Email | EmailBuilder.js | Templatical |
| --- | --- | --- | --- | --- | --- | --- |
| Licence | MIT | Wrapper MIT [1]; the editor itself is not in that repository and is served from Unlayer's CDN [8]; paid plans [2] | BSD-3-Clause [3][4] | MIT; separate Pro version [5] | MIT [6] | Editor packages FSL-1.1-MIT (MIT after 2 years); renderer and importers MIT [7] |
| Visual editor on npm | ✓ | ✓ wrapper; editor loads from Unlayer's CDN [1][8] | ✓ [3][4] | ✓ [5] | ✗ fork-and-host sample app [6] | ✓ [7] |
| UI framework | Lit web components; React, Vue, Svelte and Angular wrappers | React wrapper [1] (other wrappers: ?) | Plain JavaScript; official React wrapper `@grapesjs/react` [3] | React [5] | React [6] | Vue inside; examples for React, Vue, Svelte, Angular and vanilla [7] |
| MJML export | ✓ | ? | ✓ [4] | ✓ `JsonToMjml` [9] | ✗ outputs JSON or HTML [6] | ✓ [7] |
| MJML import | ✓ `@lit-pigeon/parser-mjml` | ? | ✓ import modal [4] | ✓ `MjmlToJson` [10] | ? not mentioned [6] | ✓ `@templatical/import-mjml` [7] |
| HTML export | ✓ | ✓ `exportHtml` [1] | ✓ in-browser MJML compiler [4] | ? | ✓ [6] | ✓ via MJML [7] |
| Custom blocks | ✓ plugin registry | ✓ custom tools, limited by plan [2] | ✓ `customComponents` [4] | ✓ `createCustomBlock` [9]; premium blocks in Pro [5] | ✓ blocks are npm packages [6] | ✓ [7] |
| Unlayer design import | ✓ `@lit-pigeon/import-unlayer` | n/a | ? | ? | ? | ✓ `@templatical/import-unlayer` [7] |
| MCP server | ✓ `@lit-pigeon/mcp-server`, self-hosted | ? | ? | ? | ? | Hosted MCP server, Cloud tier only [7] |
| Paid hosted tier | ✗ | ✓ Launch $250, Scale $750, Optimize $2,000 per month; Enterprise on request [2] | ? | ? commercial Pro edition exists [5]; not verified whether it is hosted | ? | ✓ optional Cloud tier [7] |

Unlayer's plan features, from search-engine summaries of [2] (the page itself could not be loaded from the benchmark environment): custom CSS from the Optimize plan, and custom JS at Enterprise. Unlayer has also stated that custom JS is a premium feature [11]. Check [2] before relying on any Unlayer price or plan detail.

### Sources

1. unlayer/react-email-editor README and licence: <https://github.com/unlayer/react-email-editor>
2. Unlayer pricing: <https://unlayer.com/pricing> (retrieved through search-engine summaries on 2026-09-23 and 2026-09-24; not loaded directly)
3. GrapesJS README: <https://github.com/GrapesJS/grapesjs>
4. grapesjs-mjml README: <https://github.com/GrapesJS/mjml>
5. Easy Email README: <https://github.com/zalify/easy-email>
6. EmailBuilder.js README: <https://github.com/usewaypoint/email-builder-js>
7. Templatical SDK README: <https://github.com/templatical/sdk>
8. `defaultScriptUrl` in `react-email-editor@2.1.2` `dist/index.mjs`: <https://unpkg.com/react-email-editor@2.1.2/dist/index.mjs>
9. `easy-email-core` utilities (`JsonToMjml.tsx`, `createCustomBlock.ts`): <https://github.com/zalify/easy-email/tree/master/packages/easy-email-core/src/utils>
10. `easy-email-extensions` utilities (`MjmlToJson.ts`): <https://github.com/zalify/easy-email/tree/master/packages/easy-email-extensions/src/utils>
11. Unlayer maintainer reply, 14 February 2019: <https://github.com/unlayer/react-email-editor/issues/57>

Found an error or a stale number? Open an issue or a PR with the source.

Product names are trademarks of their respective owners and are used only to identify the products compared. Lit Pigeon is not affiliated with or endorsed by any of them.
