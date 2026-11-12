# @lit-pigeon/thumbnail

Rasterise a `PigeonDocument` to a preview image. Server-side only, optional, and never bundled into the editor.

The document is rendered to email HTML through the normal `@lit-pigeon/ssr` pipeline and then screenshotted in a headless browser, so the thumbnail shows the markup a recipient actually receives rather than a re-drawing of the editor canvas.

```bash
pnpm add @lit-pigeon/thumbnail playwright-core
```

`playwright-core` is an **optional peer dependency**. It never downloads a browser at install time — you supply the Chromium build, or your own launcher.

## Usage

```ts
import { renderThumbnail } from '@lit-pigeon/thumbnail';

const { thumbnail, width, height } = await renderThumbnail(document, {
  width: 600,
  height: 800,
  executablePath: '/usr/bin/chromium',
});

// `thumbnail` is a base64 data URL — exactly what `Template.thumbnail` takes.
await saveTemplate({ ...template, thumbnail });
```

### Options

| Option | Default | |
| --- | --- | --- |
| `width` / `height` | `600` / `800` | Viewport in CSS pixels. The page is cropped to this, not scaled. |
| `deviceScaleFactor` | `1` | Use `2` for a retina thumbnail. Multiplies the image's pixel size; `width`/`height` in the result stay in CSS pixels. |
| `format` | `'png'` | `'jpeg'` is smaller but loses the flat colours emails use. |
| `quality` | — | JPEG only, 0–100. |
| `timeoutMs` | `15000` | Budget for the **whole** launch → load → capture sequence. |
| `executablePath` | — | Browser binary, for the default launcher. |
| `browserArgs` | `[]` | Extra browser flags. See the sandbox note below. |
| `launch` | Chromium via `playwright-core` | Supply your own browser. |

Every option `@lit-pigeon/ssr`'s `renderDocument` takes — `mergeTags`, `outlookWorkarounds` and the rest — is accepted too and applied before rasterising.

### The time budget

Headless browsers are the one dependency here that can hang rather than fail. `timeoutMs` covers the entire sequence, not each step, and the browser is closed either way — including when a launch resolves *after* the deadline has passed. A blown budget rejects with `ThumbnailTimeoutError` (`code: 'THUMBNAIL_TIMEOUT'`); a missing browser rejects with `BrowserUnavailableError` (`code: 'BROWSER_UNAVAILABLE'`). Both carry a `code` so a service can answer 503 without importing this package.

### Sandboxing

`browserArgs` is empty by default: the browser sandbox stays on, because the HTML being rasterised comes from a document this package did not write. Containers that run as root typically need `--no-sandbox`, which is a decision for whoever owns the container.

### Bring your own browser

`launch` takes anything matching `ThumbnailBrowser` — a structural subset of Playwright's `Browser`. A Playwright browser satisfies it as-is, so you can reuse one you already have running instead of paying for a launch per thumbnail:

```ts
const browser = await chromium.launch();
await renderThumbnail(document, { launch: async () => browser });
```

Note that `renderThumbnail` closes whatever `launch` returns. Wrap it if you want to keep it:

```ts
await renderThumbnail(document, {
  launch: async () => ({ newPage: browser.newPage.bind(browser), close: async () => {} }),
});
```

## With `@lit-pigeon/rest`

The REST service exposes `POST /render/thumbnail` once you inject a renderer. It stays injected so the REST package needs no headless browser to serve every other route:

```ts
import { createServer } from '@lit-pigeon/rest';
import { renderThumbnail } from '@lit-pigeon/thumbnail';

createServer({ thumbnailRenderer: renderThumbnail });
```

Without it the endpoint answers **503**, the same as the brand-kit and asset routes do when their storage is unconfigured.

```http
POST /render/thumbnail
{ "document": { … }, "options": { "width": 320, "height": 240 } }

200 { "thumbnail": "data:image/png;base64,…", "width": 320, "height": 240 }
```

## Testing

The unit tests drive a fake browser and need nothing installed. The real rasterisation path is covered separately and skipped unless a browser is present:

```bash
LIT_PIGEON_THUMBNAIL_BROWSER=/path/to/chrome pnpm --filter @lit-pigeon/thumbnail test
```

## Licence

MIT
