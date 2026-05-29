import type { LintIssue, LintRule } from '../types.js';
import { collectBlocks, readString } from '../walk.js';

const IMAGE_LIKE_TYPES = new Set(['image', 'hero', 'video', 'countdown', 'carousel']);

/**
 * Every visible image must have non-empty alt text so screen readers and
 * image-blocked email clients can describe the content. Custom blocks
 * with a `src` value are also covered.
 */
export const altTextRule: LintRule = {
  id: 'alt-text',
  description: 'Images must carry non-empty alt text.',
  check(doc) {
    const issues: LintIssue[] = [];
    for (const hit of collectBlocks(doc)) {
      // Only rules out blocks that clearly aren't image-like, so custom blocks
      // with a `src` field are still linted.
      const isImageLike =
        IMAGE_LIKE_TYPES.has(hit.block.type) ||
        Boolean(readString(hit.block, 'src')) ||
        Boolean(readString(hit.block, 'posterUrl')) ||
        Boolean(readString(hit.block, 'imageUrl'));
      if (!isImageLike) continue;
      const alt = readString(hit.block, 'alt').trim();
      if (!alt) {
        issues.push({
          rule: 'alt-text/missing',
          severity: 'error',
          message: `Image block "${hit.block.type}" has no alt text.`,
          path: `${hit.path}.values.alt`,
          blockId: hit.block.id,
        });
      } else if (alt.length > 125) {
        issues.push({
          rule: 'alt-text/too-long',
          severity: 'warning',
          message: `Alt text is ${alt.length} chars; keep it under 125 for screen-reader clarity.`,
          path: `${hit.path}.values.alt`,
          blockId: hit.block.id,
        });
      }
    }
    return issues;
  },
};
