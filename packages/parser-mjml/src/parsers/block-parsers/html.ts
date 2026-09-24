import type { HtmlBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { takeVisibility } from '../../utils/parse-attributes.js';

export function parseHtmlBlock(innerHtml: string): HtmlBlock {
  // mj-raw wraps content in a div with padding style sometimes
  // Try to extract padding from wrapping div if present
  // The renderer marks that div with lp-html plus its own hide classes.
  const divMatch = innerHtml.match(
    /^<div(?:\s+class="lp-html((?:\s+pigeon-hide-(?:mobile|desktop))*)")?\s+style="padding:\s*([^"]*)">([\s\S]*)<\/div>$/,
  );
  if (divMatch) {
    return {
      id: generateId(),
      type: 'html',
      values: {
        content: divMatch[3],
        padding: parseSpacing(divMatch[2], 0),
        ...takeVisibility({ 'css-class': divMatch[1] ?? '' }),
      },
    };
  }

  return {
    id: generateId(),
    type: 'html',
    values: {
      content: innerHtml,
      padding: parseSpacing(undefined, 0),
    },
  };
}
