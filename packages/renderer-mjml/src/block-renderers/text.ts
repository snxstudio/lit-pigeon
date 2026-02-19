import type { TextBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders a TextBlock to an MJML <mj-text> element.
 */
export function renderTextBlock(block: TextBlock): string {
  const { content, padding, textAlign, lineHeight } = block.values;

  const attrs: string[] = [
    `padding="${spacingToMjml(padding)}"`,
    `align="${textAlign}"`,
    `line-height="${lineHeight}"`,
  ];

  return `<mj-text ${attrs.join(' ')}>${content}</mj-text>`;
}
