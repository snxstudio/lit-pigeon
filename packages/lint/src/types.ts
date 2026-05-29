import type { PigeonDocument } from '@lit-pigeon/core';

export type LintSeverity = 'error' | 'warning' | 'info';

export interface LintIssue {
  /** Stable rule id (e.g. `alt-text/missing`). */
  rule: string;
  severity: LintSeverity;
  /** Short, human-readable description of the failure. */
  message: string;
  /** Dot-path into the document, e.g. `body.rows[0].columns[1].blocks[2]`. */
  path: string;
  /** Block id when the issue maps to a single block. */
  blockId?: string;
}

export interface LintReport {
  issues: LintIssue[];
  summary: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

export interface LintRule {
  /** Stable id; prefix with the category, e.g. `links/no-href`. */
  id: string;
  /** One-line description of what the rule catches. */
  description: string;
  check(doc: PigeonDocument): LintIssue[];
}

/**
 * A `fetch`-like function used by network rules. Production passes `globalThis.fetch`;
 * tests pass a stub. Only the subset of `fetch` we actually use is required.
 */
export type LintFetcher = (
  url: string,
  init?: { method?: string; signal?: AbortSignal },
) => Promise<{ ok: boolean; status: number; headers: { get(name: string): string | null } }>;

export interface AsyncLintRule {
  id: string;
  description: string;
  check(doc: PigeonDocument, fetcher: LintFetcher): Promise<LintIssue[]>;
}

export interface LintOptions {
  /** Subset of rules to run. Default: every static rule in {@link defaultRules}. */
  rules?: LintRule[];
}

export interface AsyncLintOptions extends LintOptions {
  /** Subset of network rules. Default: every async rule in {@link defaultAsyncRules}. */
  asyncRules?: AsyncLintRule[];
  /** Custom fetcher (e.g. for testing). Default: `globalThis.fetch`. */
  fetcher?: LintFetcher;
  /** Per-request timeout in ms. Default 5000. */
  timeoutMs?: number;
  /** Max parallel network requests. Default 8. */
  concurrency?: number;
}
