import type { HtmlBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

const MJ_RAW_TAG = /<(\s*\/?\s*mj-raw\b[^>]*)>/gi;

function escapeMjRawTags(content: string): string {
  return content.replace(MJ_RAW_TAG, '&lt;$1&gt;');
}

export function renderHtmlBlock(block: HtmlBlock): string {
  const { content, padding } = block.values;
  const paddingStr = spacingToMjml(padding);
  const safeContent = escapeMjRawTags(content);

  return `<mj-raw><div style="padding: ${paddingStr};">${safeContent}</div></mj-raw>`;
}
