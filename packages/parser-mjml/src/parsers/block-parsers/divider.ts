import type { DividerBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../../utils/parse-attributes.js';

export function parseDividerBlock(attrs: Record<string, string>): DividerBlock {
  return {
    id: generateId(),
    type: 'divider',
    values: {
      borderColor: getAttr(attrs, 'border-color', '#e2e8f0'),
      borderWidth: getNumericAttr(attrs, 'border-width', 1),
      borderStyle: (getAttr(attrs, 'border-style', 'solid') as 'solid' | 'dashed' | 'dotted'),
      padding: parseSpacing(getAttr(attrs, 'padding'), 10),
      width: getAttr(attrs, 'width', '100%'),
    },
  };
}
