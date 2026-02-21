import type { ButtonBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../../utils/parse-attributes.js';

export function parseButtonBlock(attrs: Record<string, string>, innerText: string): ButtonBlock {
  return {
    id: generateId(),
    type: 'button',
    values: {
      text: innerText.trim(),
      href: getAttr(attrs, 'href', '#'),
      backgroundColor: getAttr(attrs, 'background-color', '#3b82f6'),
      textColor: getAttr(attrs, 'color', '#ffffff'),
      borderRadius: getNumericAttr(attrs, 'border-radius', 4),
      padding: parseSpacing(getAttr(attrs, 'padding'), 10),
      innerPadding: parseSpacing(getAttr(attrs, 'inner-padding'), 12),
      fontSize: getNumericAttr(attrs, 'font-size', 16),
      fontWeight: getAttr(attrs, 'font-weight', '600'),
      alignment: (getAttr(attrs, 'align', 'center') as 'left' | 'center' | 'right'),
      fullWidth: getAttr(attrs, 'width') === '100%',
    },
  };
}
