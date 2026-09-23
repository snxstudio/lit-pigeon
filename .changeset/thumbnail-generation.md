---
'@lit-pigeon/thumbnail': minor
'@lit-pigeon/rest': minor
---

Add `@lit-pigeon/thumbnail`, which rasterises a document to the preview image `Template.thumbnail` has always accepted but nothing produced. It renders through the normal SSR pipeline and screenshots the result in a headless browser, so the thumbnail matches the email rather than the editor canvas. `playwright-core` is an optional peer dependency and the browser is injectable, so nothing is downloaded at install and the package never reaches the browser bundle. Every call runs under a hard time budget that closes the browser even when a page hangs.

`@lit-pigeon/rest` gains `POST /render/thumbnail`, enabled by passing `thumbnailRenderer` to `createHandler`/`createServer` and answering 503 when unconfigured — the same shape the brand-kit and asset routes already use.
