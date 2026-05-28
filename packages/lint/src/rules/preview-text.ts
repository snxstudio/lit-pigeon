import type { LintIssue, LintRule } from '../types.js';

/**
 * Inbox preview text (the snippet shown beside the subject line) drives
 * open rates as much as the subject itself. Empty preview text leaks the
 * email's first words instead. Too long means inboxes truncate mid-thought.
 */
export const previewTextRule: LintRule = {
  id: 'preview-text',
  description: 'Inbox preview text should be set and between 35 and 90 characters.',
  check(doc) {
    const issues: LintIssue[] = [];
    const preview = doc.metadata.previewText?.trim() ?? '';
    const path = 'metadata.previewText';

    if (!preview) {
      issues.push({
        rule: 'preview-text/missing',
        severity: 'warning',
        message: 'No previewText set — inboxes will fall back to the first body text.',
        path,
      });
    } else if (preview.length < 35) {
      issues.push({
        rule: 'preview-text/too-short',
        severity: 'info',
        message: `previewText is ${preview.length} chars; aim for 35–90 to fill the inbox snippet.`,
        path,
      });
    } else if (preview.length > 90) {
      issues.push({
        rule: 'preview-text/too-long',
        severity: 'info',
        message: `previewText is ${preview.length} chars; most inboxes truncate around 90.`,
        path,
      });
    }

    if (!doc.metadata.name?.trim()) {
      issues.push({
        rule: 'preview-text/missing-subject',
        severity: 'error',
        message: 'metadata.name (the email subject) is empty.',
        path: 'metadata.name',
      });
    }

    return issues;
  },
};
