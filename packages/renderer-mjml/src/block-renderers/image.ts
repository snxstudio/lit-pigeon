import type { ImageBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders an ImageBlock to an MJML <mj-image> element.
 */
export function renderImageBlock(block: ImageBlock): string {
  const { src, alt, width, href, padding, alignment, borderRadius } = block.values;

  const attrs: string[] = [
    `src="${escapeAttr(src)}"`,
    `alt="${escapeAttr(alt)}"`,
    `padding="${spacingToMjml(padding)}"`,
    `align="${alignment}"`,
  ];

  if (width !== 'auto') {
    attrs.push(`width="${width}px"`);
  }

  if (href) {
    attrs.push(`href="${escapeAttr(href)}"`);
  }

  if (borderRadius !== undefined && borderRadius > 0) {
    attrs.push(`border-radius="${borderRadius}px"`);
  }

  return `<mj-image ${attrs.join(' ')} />`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
