import type { HtmlBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders an HtmlBlock to MJML.
 * Uses <mj-raw> wrapped in a <mj-section> style approach.
 * Since mj-raw does not support padding directly, we wrap the content
 * in a div with inline padding styles.
 */
export function renderHtmlBlock(block: HtmlBlock): string {
  const { content, padding } = block.values;
  const paddingStr = spacingToMjml(padding);

  return `<mj-raw><div style="padding: ${paddingStr};">${content}</div></mj-raw>`;
}
