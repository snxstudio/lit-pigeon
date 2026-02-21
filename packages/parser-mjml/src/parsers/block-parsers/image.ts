import type { ImageBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../../utils/parse-attributes.js';

export function parseImageBlock(attrs: Record<string, string>): ImageBlock {
  const widthStr = getAttr(attrs, 'width');
  const width: number | 'auto' = widthStr ? parseInt(widthStr, 10) || 'auto' : 'auto';

  return {
    id: generateId(),
    type: 'image',
    values: {
      src: getAttr(attrs, 'src'),
      alt: getAttr(attrs, 'alt'),
      width,
      href: getAttr(attrs, 'href') || undefined,
      padding: parseSpacing(getAttr(attrs, 'padding'), 10),
      alignment: (getAttr(attrs, 'align', 'center') as 'left' | 'center' | 'right'),
      borderRadius: getNumericAttr(attrs, 'border-radius', 0),
    },
  };
}
