import type { HtmlBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

// The slash is inside the optional group on purpose. Written as `\s*\/?\s*`,
// the two runs of whitespace are interchangeable, so a `<` followed by n
// spaces costs O(n^2) backtracking per start position before the match fails
// — and html-block content is attacker-supplied on any hosted `/render`.
// Requiring a slash before the second run makes each attempt linear. Both
// forms accept exactly the same strings.
const MJ_RAW_TAG = /<(\s*(?:\/\s*)?mj-raw\b[^>]*)>/gi;

function escapeMjRawTags(content: string): string {
  return content.replace(MJ_RAW_TAG, '&lt;$1&gt;');
}

export function renderHtmlBlock(block: HtmlBlock): string {
  const { content, padding } = block.values;
  const paddingStr = spacingToMjml(padding);
  const safeContent = escapeMjRawTags(content);

  return `<mj-raw><div style="padding: ${paddingStr};">${safeContent}</div></mj-raw>`;
}
