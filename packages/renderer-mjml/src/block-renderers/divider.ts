import type { DividerBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders a DividerBlock to an MJML <mj-divider> element.
 */
export function renderDividerBlock(block: DividerBlock): string {
  const { borderColor, borderWidth, borderStyle, padding, width } = block.values;

  const attrs: string[] = [
    `border-color="${borderColor}"`,
    `border-width="${borderWidth}px"`,
    `border-style="${borderStyle}"`,
    `padding="${spacingToMjml(padding)}"`,
    `width="${width}"`,
  ];

  return `<mj-divider ${attrs.join(' ')} />`;
}
