import type { HeroBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../../utils/parse-attributes.js';

export function parseHeroBlock(attrs: Record<string, string>, innerContent: string): HeroBlock {
  return {
    id: generateId(),
    type: 'hero',
    values: {
      backgroundUrl: getAttr(attrs, 'background-url'),
      backgroundPosition: (getAttr(attrs, 'background-position', 'center center') as HeroBlock['values']['backgroundPosition']),
      mode: (getAttr(attrs, 'mode', 'fluid-height') as 'fixed-height' | 'fluid-height'),
      width: getNumericAttr(attrs, 'width', 600),
      height: getNumericAttr(attrs, 'height', 400),
      verticalAlign: (getAttr(attrs, 'vertical-align', 'middle') as 'top' | 'middle' | 'bottom'),
      padding: parseSpacing(getAttr(attrs, 'padding'), 0),
      innerPadding: parseSpacing(undefined, 20),
      backgroundColor: getAttr(attrs, 'background-color', '#ffffff'),
      content: innerContent,
    },
  };
}
