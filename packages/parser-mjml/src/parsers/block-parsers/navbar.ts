import type { NavBarBlock, NavLink } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../../utils/parse-attributes.js';

export interface NavLinkData {
  attrs: Record<string, string>;
  innerText: string;
}

export function parseNavBarBlock(
  attrs: Record<string, string>,
  linkElements: NavLinkData[],
): NavBarBlock {
  const links: NavLink[] = linkElements.map((el) => {
    const link: NavLink = {
      href: getAttr(el.attrs, 'href', '#'),
      text: el.innerText.trim() || 'Link',
    };
    const color = getAttr(el.attrs, 'color');
    if (color) link.color = color;
    const fontWeight = getAttr(el.attrs, 'font-weight');
    if (fontWeight) link.fontWeight = fontWeight;
    const textDecoration = getAttr(el.attrs, 'text-decoration');
    if (textDecoration) link.textDecoration = textDecoration;
    const padding = getAttr(el.attrs, 'padding');
    if (padding) link.padding = padding;
    return link;
  });

  return {
    id: generateId(),
    type: 'navbar',
    values: {
      links,
      hamburger: (getAttr(attrs, 'hamburger', 'hamburger') as 'hamburger' | 'none'),
      alignment: (getAttr(attrs, 'align', 'center') as 'left' | 'center' | 'right'),
      padding: parseSpacing(getAttr(attrs, 'padding'), 10),
      linkColor: getAttr(attrs, 'ico-color', '#000000'),
      linkFontSize: getNumericAttr(attrs, 'font-size', 14),
      linkPadding: getAttr(attrs, 'link-padding', '10px 15px'),
    },
  };
}
