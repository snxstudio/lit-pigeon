import type { ParseWarning } from '../mjml-to-document.js';

export interface HeadData {
  previewText?: string;
  fontFamily?: string;
}

interface HeadNode {
  tag: string;
  attrs: Record<string, string>;
  children: HeadNode[];
  text: string;
}

/**
 * Extracts head data from parsed mj-head children.
 */
export function parseHead(headChildren: HeadNode[], _warnings: ParseWarning[]): HeadData {
  const result: HeadData = {};

  for (const child of headChildren) {
    switch (child.tag) {
      case 'mj-preview':
        result.previewText = child.text;
        break;
      case 'mj-attributes':
        for (const attrChild of child.children) {
          if (attrChild.tag === 'mj-all' && attrChild.attrs['font-family']) {
            result.fontFamily = attrChild.attrs['font-family'];
          }
        }
        break;
      default:
        // Ignore unknown head elements
        break;
    }
  }

  return result;
}
