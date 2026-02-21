import type { ColumnNode, ContentBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../utils/parse-attributes.js';
import { parseTextBlock } from './block-parsers/text.js';
import { parseImageBlock } from './block-parsers/image.js';
import { parseButtonBlock } from './block-parsers/button.js';
import { parseDividerBlock } from './block-parsers/divider.js';
import { parseSpacerBlock } from './block-parsers/spacer.js';
import { parseSocialBlock, type SocialElementData } from './block-parsers/social.js';
import { parseHtmlBlock } from './block-parsers/html.js';
import { parseNavBarBlock, type NavLinkData } from './block-parsers/navbar.js';
import type { ParseWarning, MjmlNode } from '../mjml-to-document.js';

/**
 * Parses an mj-column element into a ColumnNode.
 */
export function parseColumn(columnNode: MjmlNode, warnings: ParseWarning[]): ColumnNode {
  const attrs = columnNode.attrs;
  const blocks: ContentBlock[] = [];

  for (const child of columnNode.children) {
    const block = parseBlockElement(child, warnings);
    if (block) {
      blocks.push(block);
    }
  }

  return {
    id: generateId(),
    type: 'column',
    attributes: {
      backgroundColor: getAttr(attrs, 'background-color') || undefined,
      padding: parseSpacing(getAttr(attrs, 'padding'), 0),
      borderRadius: getNumericAttr(attrs, 'border-radius', 0) || undefined,
      verticalAlign: (getAttr(attrs, 'vertical-align', 'top') as 'top' | 'middle' | 'bottom'),
    },
    blocks,
  };
}

/**
 * Parses a single block-level MJML element into a ContentBlock.
 */
function parseBlockElement(node: MjmlNode, warnings: ParseWarning[]): ContentBlock | null {
  switch (node.tag) {
    case 'mj-text':
      return parseTextBlock(node.attrs, node.text);
    case 'mj-image':
      return parseImageBlock(node.attrs);
    case 'mj-button':
      return parseButtonBlock(node.attrs, node.text);
    case 'mj-divider':
      return parseDividerBlock(node.attrs);
    case 'mj-spacer':
      return parseSpacerBlock(node.attrs);
    case 'mj-social': {
      const elements: SocialElementData[] = node.children
        .filter(c => c.tag === 'mj-social-element')
        .map(c => ({ attrs: c.attrs, innerText: c.text }));
      return parseSocialBlock(node.attrs, elements);
    }
    case 'mj-raw':
      return parseHtmlBlock(node.text);
    case 'mj-navbar': {
      const linkElements: NavLinkData[] = node.children
        .filter(c => c.tag === 'mj-navbar-link')
        .map(c => ({ attrs: c.attrs, innerText: c.text }));
      return parseNavBarBlock(node.attrs, linkElements);
    }
    default:
      warnings.push({
        message: `Unknown block element: ${node.tag}`,
        tag: node.tag,
      });
      return null;
  }
}
