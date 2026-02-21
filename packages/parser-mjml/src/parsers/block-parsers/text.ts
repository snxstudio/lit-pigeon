import type { TextBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr } from '../../utils/parse-attributes.js';

export function parseTextBlock(attrs: Record<string, string>, innerHtml: string): TextBlock {
  return {
    id: generateId(),
    type: 'text',
    values: {
      content: innerHtml,
      padding: parseSpacing(getAttr(attrs, 'padding'), 10),
      lineHeight: getAttr(attrs, 'line-height', '1.5'),
      textAlign: (getAttr(attrs, 'align', 'left') as 'left' | 'center' | 'right'),
    },
  };
}
