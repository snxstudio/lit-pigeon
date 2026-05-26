import type { HeroBlock } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders a HeroBlock to MJML markup.
 * Note: mj-hero is a top-level section element in MJML.
 * This renders the inner content; the wrapping <mj-hero> is handled by renderRow().
 */
export function renderHeroBlock(block: HeroBlock): string {
  const { content, innerPadding } = block.values;

  const attrs: string[] = [
    `padding="${spacingToMjml(innerPadding)}"`,
  ];

  return `<mj-text ${attrs.join(' ')}>${content}</mj-text>`;
}

/**
 * Renders the full mj-hero wrapper for a hero block.
 * Called from renderRow when it detects a hero block.
 */
export function renderHeroSection(block: HeroBlock): string {
  const v = block.values;

  const attrs: string[] = [
    `mode="${v.mode}"`,
    `height="${v.height}px"`,
    `vertical-align="${v.verticalAlign}"`,
    `padding="${spacingToMjml(v.padding)}"`,
  ];

  // MJML doesn't accept `width` on mj-hero — section width is inherited
  // from mj-body. background-width controls the bg image, not the section.
  if (v.backgroundUrl) {
    attrs.push(`background-width="${v.width}px"`);
  }

  if (v.backgroundUrl) {
    attrs.push(`background-url="${escapeAttr(v.backgroundUrl)}"`);
    attrs.push(`background-position="${v.backgroundPosition}"`);
  }

  if (v.backgroundColor) {
    attrs.push(`background-color="${v.backgroundColor}"`);
  }

  return `  <mj-hero ${attrs.join(' ')}>
      <mj-text padding="${spacingToMjml(v.innerPadding)}">${v.content}</mj-text>
  </mj-hero>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
