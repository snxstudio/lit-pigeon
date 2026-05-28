export { lintDocument, lintDocumentAsync, defaultRules, defaultAsyncRules } from './lint.js';
export type {
  AsyncLintOptions,
  AsyncLintRule,
  LintFetcher,
  LintIssue,
  LintOptions,
  LintReport,
  LintRule,
  LintSeverity,
} from './types.js';

// Individual rule exports so callers can compose a custom rule set.
export { altTextRule } from './rules/alt-text.js';
export { linksRule } from './rules/links.js';
export { contrastRule } from './rules/contrast.js';
export { previewTextRule } from './rules/preview-text.js';
export { spamScoreRule } from './rules/spam-score.js';
export { mergeTagsRule } from './rules/merge-tags.js';
export { emptyContentRule } from './rules/empty-content.js';
export { imageWeightRule } from './async-rules/image-weight.js';
export { linkReachabilityRule } from './async-rules/link-reachability.js';
