import type { TextBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders a TextBlock to an MJML <mj-text> element.
 */
export function renderTextBlock(block: TextBlock): string {
  const { content, padding, textAlign, lineHeight, cssClass } = block.values;

  const attrs: string[] = [
    `padding="${spacingToMjml(padding)}"`,
    `align="${textAlign}"`,
    `line-height="${lineHeight}"`,
  ];

  if (cssClass) {
    attrs.push(`css-class="${escapeAttr(cssClass)}"`);
  }

  return `<mj-text ${attrs.join(' ')}>${content}</mj-text>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
