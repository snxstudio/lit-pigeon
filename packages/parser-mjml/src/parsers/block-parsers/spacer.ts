import type { SpacerBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { getNumericAttr } from '../../utils/parse-attributes.js';

export function parseSpacerBlock(attrs: Record<string, string>): SpacerBlock {
  return {
    id: generateId(),
    type: 'spacer',
    values: {
      height: getNumericAttr(attrs, 'height', 20),
    },
  };
}
