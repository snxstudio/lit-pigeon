import type { PigeonDocument } from '@lit-pigeon/core';
import type {
  AsyncLintOptions,
  AsyncLintRule,
  LintFetcher,
  LintIssue,
  LintOptions,
  LintReport,
  LintRule,
} from './types.js';
import { altTextRule } from './rules/alt-text.js';
import { linksRule } from './rules/links.js';
import { contrastRule } from './rules/contrast.js';
import { previewTextRule } from './rules/preview-text.js';
import { spamScoreRule } from './rules/spam-score.js';
import { mergeTagsRule } from './rules/merge-tags.js';
import { emptyContentRule } from './rules/empty-content.js';
import { imageWeightRule } from './async-rules/image-weight.js';
import { linkReachabilityRule } from './async-rules/link-reachability.js';

export const defaultRules: LintRule[] = [
  altTextRule,
  linksRule,
  contrastRule,
  previewTextRule,
  spamScoreRule,
  mergeTagsRule,
  emptyContentRule,
];

export const defaultAsyncRules: AsyncLintRule[] = [
  imageWeightRule,
  linkReachabilityRule,
];

/**
 * Run every static rule against the document and return a sorted, summarised
 * report. Pure, fast, no network — safe to call on every keystroke if desired.
 */
export function lintDocument(
  doc: PigeonDocument,
  options: LintOptions = {},
): LintReport {
  const rules = options.rules ?? defaultRules;
  const issues = rules.flatMap((rule) => rule.check(doc));
  return finalise(issues);
}

/**
 * Run every static rule plus the configured async (network) rules. Use this
 * in CI / pre-send hooks where slower checks like HEAD-request image-weight
 * are acceptable.
 */
export async function lintDocumentAsync(
  doc: PigeonDocument,
  options: AsyncLintOptions = {},
): Promise<LintReport> {
  const sync = lintDocument(doc, options);
  const asyncRules = options.asyncRules ?? defaultAsyncRules;
  const fetcher = options.fetcher ?? (globalThis.fetch as LintFetcher | undefined);

  if (!fetcher || asyncRules.length === 0) {
    return sync;
  }

  const settled = await Promise.allSettled(
    asyncRules.map((rule) => rule.check(doc, wrapFetcher(fetcher, options.timeoutMs ?? 5000))),
  );
  const asyncIssues: LintIssue[] = [];
  settled.forEach((entry, idx) => {
    if (entry.status === 'fulfilled') {
      asyncIssues.push(...entry.value);
    } else {
      asyncIssues.push({
        rule: `${asyncRules[idx].id}/crashed`,
        severity: 'warning',
        message: `Lint rule "${asyncRules[idx].id}" failed: ${
          entry.reason instanceof Error ? entry.reason.message : String(entry.reason)
        }`,
        path: '',
      });
    }
  });
  return finalise([...sync.issues, ...asyncIssues]);
}

function finalise(issues: LintIssue[]): LintReport {
  const sorted = [...issues].sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  return {
    issues: sorted,
    summary: {
      errors: sorted.filter((i) => i.severity === 'error').length,
      warnings: sorted.filter((i) => i.severity === 'warning').length,
      infos: sorted.filter((i) => i.severity === 'info').length,
    },
  };
}

function severityRank(s: 'error' | 'warning' | 'info'): number {
  return s === 'error' ? 0 : s === 'warning' ? 1 : 2;
}

/**
 * Wrap a fetcher with a per-request AbortSignal so a stuck server can't hang
 * the entire lint pass.
 */
function wrapFetcher(fetcher: LintFetcher, timeoutMs: number): LintFetcher {
  return async (url, init) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetcher(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };
}
