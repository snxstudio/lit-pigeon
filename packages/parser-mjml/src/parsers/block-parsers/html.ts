import type { HtmlBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';

export function parseHtmlBlock(innerHtml: string): HtmlBlock {
  // mj-raw wraps content in a div with padding style sometimes
  // Try to extract padding from wrapping div if present
  const divMatch = innerHtml.match(/^<div\s+style="padding:\s*([^"]*)">([\s\S]*)<\/div>$/);
  if (divMatch) {
    return {
      id: generateId(),
      type: 'html',
      values: {
        content: divMatch[2],
        padding: parseSpacing(divMatch[1], 0),
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
