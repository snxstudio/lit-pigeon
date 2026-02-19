import type { SocialBlock, SocialIcon } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Maps a SocialIcon type to the MJML social element name attribute.
 * MJML uses specific names for built-in social icons.
 */
function socialIconName(icon: SocialIcon): string {
  switch (icon.type) {
    case 'facebook':
      return 'facebook';
    case 'twitter':
      return 'twitter';
    case 'instagram':
      return 'instagram';
    case 'linkedin':
      return 'linkedin';
    case 'youtube':
      return 'youtube';
    case 'tiktok':
      return 'web';
    case 'custom':
      return 'web';
    default:
      return 'web';
  }
}

/**
 * Renders a single SocialIcon to an MJML <mj-social-element>.
 */
function renderSocialElement(icon: SocialIcon, iconSize: number): string {
  const name = socialIconName(icon);
  const attrs: string[] = [
    `name="${name}"`,
    `href="${escapeAttr(icon.href)}"`,
    `icon-size="${iconSize}px"`,
  ];

  if (icon.iconUrl) {
    attrs.push(`src="${escapeAttr(icon.iconUrl)}"`);
  }

  const label = icon.label ?? '';

  return `<mj-social-element ${attrs.join(' ')}>${escapeHtml(label)}</mj-social-element>`;
}

/**
 * Renders a SocialBlock to an MJML <mj-social> element.
 */
export function renderSocialBlock(block: SocialBlock): string {
  const { icons, iconSize, spacing, alignment, padding } = block.values;

  const attrs: string[] = [
    `icon-size="${iconSize}px"`,
    `icon-padding="${spacing}px"`,
    `align="${alignment}"`,
    `padding="${spacingToMjml(padding)}"`,
    'mode="horizontal"',
  ];

  const elements = icons.map((icon) => renderSocialElement(icon, iconSize)).join('\n    ');

  return `<mj-social ${attrs.join(' ')}>
    ${elements}
  </mj-social>`;
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
