import type { ButtonBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders a ButtonBlock to an MJML <mj-button> element.
 */
export function renderButtonBlock(block: ButtonBlock): string {
  const {
    text,
    href,
    backgroundColor,
    textColor,
    borderRadius,
    padding,
    innerPadding,
    fontSize,
    fontWeight,
    alignment,
    fullWidth,
  } = block.values;

  const attrs: string[] = [
    `href="${escapeAttr(href)}"`,
    `background-color="${backgroundColor}"`,
    `color="${textColor}"`,
    `border-radius="${borderRadius}px"`,
    `padding="${spacingToMjml(padding)}"`,
    `inner-padding="${spacingToMjml(innerPadding)}"`,
    `font-size="${fontSize}px"`,
    `font-weight="${fontWeight}"`,
    `align="${alignment}"`,
  ];

  if (fullWidth) {
    attrs.push('width="100%"');
  }

  return `<mj-button ${attrs.join(' ')}>${escapeHtml(text)}</mj-button>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
