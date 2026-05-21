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

## Disclosure timeline

We follow a coordinated disclosure model:

1. You report the issue privately.
2. We confirm the issue and start work on a fix.
3. We publish a patched release.
4. We publish an advisory crediting the reporter (with their permission).
