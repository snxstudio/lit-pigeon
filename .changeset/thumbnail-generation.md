---
'@lit-pigeon/thumbnail': minor
'@lit-pigeon/rest': minor
---

Add `@lit-pigeon/thumbnail`, which rasterises a document to the preview image `Template.thumbnail` has always accepted but nothing produced. It renders through the normal SSR pipeline and screenshots the result in a headless browser, so the thumbnail matches the email rather than the editor canvas. `playwright-core` is an optional peer dependency and the browser is injectable, so nothing is downloaded at install and the package never reaches the browser bundle. Every call runs under a hard time budget that closes the browser even when a page hangs.

`@lit-pigeon/rest` gains `POST /render/thumbnail`, enabled by passing `thumbnailRenderer` to `createHandler`/`createServer` and answering 503 when unconfigured — the same shape the brand-kit and asset routes already use. It rejects a `timeoutMs` above 60000, as it does an oversized `width`, `height` or `deviceScaleFactor`.

The page a thumbnail is rendered in has JavaScript turned off and may only request `data:` URLs and `http(s)` URLs whose host resolves to public addresses. Loopback, private, link-local and unique-local addresses, `localhost`, other schemes and frame navigations are blocked, and each redirect hop is checked, so a document cannot make the server fetch internal or cloud-metadata URLs.
