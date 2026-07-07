# Security Policy

## Supported versions

Lit Pigeon is pre-1.0. Security fixes land on `main` and are released as patches to the latest minor version. Older minor versions do not receive backports.

| Version | Supported |
|---------|-----------|
| latest `0.x` | ✓ |
| anything older | ✗ |

## Reporting a vulnerability

Please report security issues **privately** by emailing **mayur@shipthis.co** with:

- A description of the issue
- Steps to reproduce (a minimal repro is appreciated)
- The version / commit SHA you tested
- Any suggested fix, if you have one

You should hear back within **3 business days**. We aim to publish a fix within **30 days** of a confirmed report. Once a fix is released, we will credit reporters in the release notes unless they prefer to remain anonymous.

Please do **not** file public GitHub issues for security problems.

## Scope

Issues that are in scope:

- Cross-site scripting (XSS) via the editor or its block content
- MJML / HTML injection that breaks out of the intended sandbox in the renderer or parser
- Untrusted-document loading that causes denial of service or arbitrary code execution
- Vulnerabilities in our build/publish pipeline

Issues that are out of scope:

- Bugs in third-party libraries we depend on (please report those upstream)
- Vulnerabilities that require attacker-controlled build environments
- Issues only reproducible on unsupported Node.js versions (< 18)

## Known advisories in dependencies

We track Dependabot continuously. Current status, split by whether the code
actually reaches a user who installs an `@lit-pigeon/*` package:

**Shipped (runtime) dependencies**

- `hono`, `ajv`, `lodash` — patched via pnpm `overrides` (hono ≥ 4.12.25,
  ajv ≥ 8.18.0, lodash ≥ 4.18.0). Note: overrides fix *this repo's* install;
  consumers doing a fresh install also resolve lodash ≥ 4.18.0 because mjml's
  `^4.17` range permits it.
- `mjml` (`mj-include` directory traversal) — fixed upstream in the mjml 5.x
  line; we are on `mjml@^4.15` and evaluating the 4 → 5 major bump separately.
  Lit Pigeon generates MJML from a structured document model — `mj-include`
  paths are not attacker-controllable in normal use — so exposure is limited
  to callers who compile fully **untrusted raw MJML** server-side. Do not feed
  untrusted raw MJML to `@lit-pigeon/renderer-mjml` / `ssr` / `rest` on the
  4.x line.
- `html-minifier` (transitive, via `mjml` 4.x) — no fixed release on the 4.x
  path; reached only through the MJML compile path above and not exposed to
  user input directly. Resolves with the mjml 5 bump.

**Dev-only dependencies (NOT in any published package's install tree)**

- `@angular/core` — used only to build/test the Angular wrapper locally;
  pinned to a patched release (≥ 22.0.1) as a devDependency. Consumers bring
  their own Angular via the `>=17.0.0` peer range.
- `ws` (via vitest → happy-dom), `js-yaml` (via @changesets/cli), `esbuild`
  (via size-limit) — dev-time only; we bump as patched releases become
  installable through those toolchains.

None of the dev-only items affect anyone who installs an `@lit-pigeon/*`
package. We bump every item above as soon as a fixed release is available.

## Disclosure timeline

We follow a coordinated disclosure model:

1. You report the issue privately.
2. We confirm the issue and start work on a fix.
3. We publish a patched release.
4. We publish an advisory crediting the reporter (with their permission).
