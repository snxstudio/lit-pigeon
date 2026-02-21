import type { SocialBlock, SocialIcon } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../../utils/parse-attributes.js';

const KNOWN_SOCIAL_TYPES = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'] as const;

function mapSocialName(name: string): SocialIcon['type'] {
  const lower = name.toLowerCase();
  for (const known of KNOWN_SOCIAL_TYPES) {
    if (lower.includes(known)) return known;
  }
  return 'custom';
}

export interface SocialElementData {
  attrs: Record<string, string>;
  innerText: string;
}

export function parseSocialBlock(
  attrs: Record<string, string>,
  elements: SocialElementData[],
): SocialBlock {
  const icons: SocialIcon[] = elements.map((el) => {
    const type = mapSocialName(getAttr(el.attrs, 'name', 'custom'));
    const icon: SocialIcon = {
      type,
      href: getAttr(el.attrs, 'href', '#'),
      label: el.innerText.trim() || undefined,
    };
    const src = getAttr(el.attrs, 'src');
    if (src) {
      icon.iconUrl = src;
    }
    return icon;
  });

  return {
    id: generateId(),
    type: 'social',
    values: {
      icons,
      iconSize: getNumericAttr(attrs, 'icon-size', 32),
      spacing: getNumericAttr(attrs, 'icon-padding', 8),
      alignment: (getAttr(attrs, 'align', 'center') as 'left' | 'center' | 'right'),
      padding: parseSpacing(getAttr(attrs, 'padding'), 10),
    },
  };
}
