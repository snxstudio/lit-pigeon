# @lit-pigeon/lint

Pre-flight QA for [Lit Pigeon](https://github.com/snxstudio/lit-pigeon)
documents. Catches the mistakes that break emails in the wild: missing image
alt text, low text/background contrast, links without an `href`, undefined
merge tags, likely spam-trigger content, and empty blocks. An async pass adds
network checks — total image weight and link reachability.

## Install

```bash
npm install @lit-pigeon/lint
```

## Usage

```ts
import { lintDocument, lintDocumentAsync } from '@lit-pigeon/lint';

// Synchronous — pure, fast, no network. Safe to run on every keystroke.
const report = lintDocument(doc);
console.log(report.summary); // { errors, warnings, infos }
for (const issue of report.issues) {
  console.log(`${issue.severity} [${issue.rule}] ${issue.path}: ${issue.message}`);
}

// Async — adds image-weight + link-reachability (uses global fetch by default).
const full = await lintDocumentAsync(doc, { timeoutMs: 5000 });
```

Compose a custom rule set by passing `{ rules }` (or `{ asyncRules }`). The
built-in rules are exported individually — `altTextRule`, `contrastRule`,
`linksRule`, `mergeTagsRule`, `spamScoreRule`, `previewTextRule`,
`emptyContentRule`, `imageWeightRule`, `linkReachabilityRule` — alongside the
`defaultRules` and `defaultAsyncRules` arrays. These checks are also exposed as
`/lint` and `/lint/async` endpoints by [`@lit-pigeon/rest`](../rest).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
