# @lit-pigeon/rest

Framework-agnostic Node REST adapter for [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) —
render, parse, validate, and lint `PigeonDocument`s over HTTP. Mount the
handler in Express/Fastify/Connect, run a stand-alone server, or launch the
bundled `lit-pigeon-rest` CLI.

## Install

```bash
npm install @lit-pigeon/rest
```

## Usage

Stand-alone Node server:

```ts
import { createServer } from '@lit-pigeon/rest';

const { server, ready } = createServer({ port: 3000 });
const { host, port } = await ready;
console.log(`listening on http://${host}:${port}`);
```

Or mount into an existing framework via a `(req, res)` handler:

```ts
import { createHandler } from '@lit-pigeon/rest';

const handler = createHandler({ bearerToken: process.env.API_TOKEN });
// e.g. Node http.createServer(handler), or wire into Express/Connect.
```

### CLI

```bash
npx lit-pigeon-rest        # honours PORT / HOST / LIT_PIGEON_REST_TOKEN
```

### Endpoints

`GET /health`, plus POST `/render`, `/render/mjml`, `/validate`, `/parse`,
`/lint`, and `/lint/async`. Each POST takes `{ document, options? }` JSON. A
lower-level pure router, `handleRequest(jsonRequest, ctx)`, is also exported for
custom transports.

Rendering, parsing, and linting are powered by [`@lit-pigeon/ssr`](../ssr) and
[`@lit-pigeon/lint`](../lint).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
