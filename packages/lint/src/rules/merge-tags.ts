import type { LintIssue, LintRule } from '../types.js';
import { collectBlocks } from '../walk.js';

const VALID_TAG = /^\s*[\w.-]+\s*$/;
const TAG_PATTERN = /\{\{([^}]*)\}\}/g;

/**
 * Catch broken merge tags before they reach the inbox. Unbalanced braces,
 * empty placeholders, and characters that some template engines refuse to
 * accept will all trip this rule.
 */
export const mergeTagsRule: LintRule = {
  id: 'merge-tags',
  description: 'Merge tags must be well-formed `{{name}}` placeholders.',
  check(doc) {
    const issues: LintIssue[] = [];
    for (const hit of collectBlocks(doc)) {
      const values = hit.block.values as Record<string, unknown>;
      for (const [key, value] of Object.entries(values)) {
        if (typeof value !== 'string') continue;
        const opens = (value.match(/\{\{/g) ?? []).length;
        const closes = (value.match(/\}\}/g) ?? []).length;
        if (opens !== closes) {
          issues.push({
            rule: 'merge-tags/unbalanced',
            severity: 'error',
            message: `"${key}" has ${opens} \`{{\` but ${closes} \`}}\`.`,
            path: `${hit.path}.values.${key}`,
            blockId: hit.block.id,
          });
          continue;
        }
        for (const match of value.matchAll(TAG_PATTERN)) {
          const inner = match[1];
          if (!inner.trim()) {
            issues.push({
              rule: 'merge-tags/empty',
              severity: 'error',
              message: 'Empty merge-tag placeholder `{{}}`.',
              path: `${hit.path}.values.${key}`,
              blockId: hit.block.id,
            });
          } else if (!VALID_TAG.test(inner)) {
            issues.push({
              rule: 'merge-tags/invalid-name',
              severity: 'warning',
              message: `Merge tag "{{${inner}}}" uses characters most template engines reject.`,
              path: `${hit.path}.values.${key}`,
              blockId: hit.block.id,
            });
          }
        }
      }
    }
    return issues;
  },
};
