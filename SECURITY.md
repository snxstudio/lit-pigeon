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

- `hono`, `ajv` — patched via pnpm `overrides` (hono ≥ 4.12.25, ajv ≥ 8.18.0).
- `mjml` (`mj-include` directory traversal) — only fixed in an unreleased
  `5.0.0-alpha` pre-release, so we cannot bump to a stable fix yet. Lit Pigeon
  generates MJML from a structured document model — `mj-include` paths are not
  attacker-controllable in normal use — so exposure is limited to callers who
  compile fully **untrusted raw MJML** server-side. Do not feed untrusted raw
  MJML to `@lit-pigeon/renderer-mjml` / `ssr` / `rest` until an upstream fix
  ships. Tracked upstream.
- `html-minifier`, `lodash` (transitive, via `mjml`) — no fixed release is
  available upstream; both are reached only through the MJML compile path above
  and are not exposed to user input directly. They resolve when `mjml` is
  updated.

**Dev-only dependencies (NOT in any published package's install tree)**

- `vite`, `vitest`, `esbuild` — advisories affect the local dev server / test
  runner only. Fixes require major-version migrations (Vite 6 / Vitest 3),
  tracked as a follow-up.
- `minimatch` (via the ESLint / typescript-eslint toolchain) — dev-time ReDoS;
  clears with an ESLint 9 / typescript-eslint 8 upgrade, tracked as a follow-up.

None of the dev-only items affect anyone who installs an `@lit-pigeon/*`
package. We bump every item above as soon as a fixed release is available.

## Disclosure timeline

We follow a coordinated disclosure model:

1. You report the issue privately.
2. We confirm the issue and start work on a fix.
3. We publish a patched release.
4. We publish an advisory crediting the reporter (with their permission).
