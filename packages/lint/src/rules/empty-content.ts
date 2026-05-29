import type { LintIssue, LintRule } from '../types.js';

/**
 * Flag rows/columns with no blocks (they render as empty space) and the
 * whole-document empty case. Cheap, useful for catching author mistakes
 * (added a row, never dropped a block in).
 */
export const emptyContentRule: LintRule = {
  id: 'empty-content',
  description: 'Rows and the document body must contain at least one block.',
  check(doc) {
    const issues: LintIssue[] = [];
    if (doc.body.rows.length === 0) {
      issues.push({
        rule: 'empty-content/no-rows',
        severity: 'error',
        message: 'Document has no rows — the rendered email will be blank.',
        path: 'body.rows',
      });
      return issues;
    }
    doc.body.rows.forEach((row, rowIndex) => {
      const totalBlocks = row.columns.reduce((sum, col) => sum + col.blocks.length, 0);
      if (totalBlocks === 0) {
        issues.push({
          rule: 'empty-content/empty-row',
          severity: 'warning',
          message: 'Row contains no blocks — it will render as empty vertical space.',
          path: `body.rows[${rowIndex}]`,
        });
      }
    });
    return issues;
  },
};
