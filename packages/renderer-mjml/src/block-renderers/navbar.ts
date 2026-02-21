import type { NavBarBlock, NavLink } from '@lit-pigeon/core';
import { spacingToMjml } from '../utils/spacing.js';

/**
 * Renders a single NavLink to an MJML <mj-navbar-link> element.
 */
function renderNavLink(link: NavLink): string {
  const attrs: string[] = [
    `href="${escapeAttr(link.href)}"`,
  ];

  if (link.color) {
    attrs.push(`color="${link.color}"`);
  }

  if (link.fontWeight) {
    attrs.push(`font-weight="${link.fontWeight}"`);
  }

  if (link.textDecoration) {
    attrs.push(`text-decoration="${link.textDecoration}"`);
  }

  if (link.padding) {
    attrs.push(`padding="${link.padding}"`);
  }

  return `<mj-navbar-link ${attrs.join(' ')}>${escapeHtml(link.text)}</mj-navbar-link>`;
}

/**
 * Renders a NavBarBlock to an MJML <mj-navbar> element.
 */
export function renderNavBarBlock(block: NavBarBlock): string {
  const { links, hamburger, padding } = block.values;

  const attrs: string[] = [
    `hamburger="${hamburger}"`,
    `padding="${spacingToMjml(padding)}"`,
  ];

  const elements = links.map((link) => renderNavLink(link)).join('\n    ');

  return `<mj-navbar ${attrs.join(' ')}>
    ${elements}
  </mj-navbar>`;
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
