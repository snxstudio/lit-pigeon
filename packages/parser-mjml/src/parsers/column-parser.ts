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
import { parseTableBlock } from './block-parsers/table.js';
import { parseNavBarBlock, type NavLinkData } from './block-parsers/navbar.js';
import type { ParseWarning, MjmlNode } from '../mjml-to-document.js';

/**
 * Parses an mj-column element into a ColumnNode.
 */
export function parseColumn(columnNode: MjmlNode, warnings: ParseWarning[]): ColumnNode {
  const attrs = columnNode.attrs;
  const blocks: ContentBlock[] = [];

  const children = columnNode.children;
  for (let i = 0; i < children.length; i++) {
    // A block the renderer wrapped in `{{#if}}` / `{{/if}}` markers. Only an
    // exact open-block-close triple counts, so hand-written raw HTML that
    // spans several blocks is kept as html blocks.
    const condition = conditionMarker(children[i]);
    if (condition && isEndMarker(children[i + 2])) {
      const block = parseBlockElement(children[i + 1], warnings);
      if (block) {
        Object.assign(block.values, children[i + 1].visibility);
        block.values.condition = condition;
        blocks.push(block);
        i += 2;
        continue;
      }
    }
    const block = parseBlockElement(children[i], warnings);
    if (block) {
      Object.assign(block.values, children[i].visibility);
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
      cssClass: getAttr(attrs, 'css-class') || undefined,
      ...columnNode.visibility,
    },
    blocks,
  };
}

function conditionMarker(node: MjmlNode): string | undefined {
  if (node.tag !== 'mj-raw') return undefined;
  return /^\s*\{\{#if\s+([^}]+?)\s*\}\}\s*$/.exec(node.text ?? '')?.[1];
}

function isEndMarker(node: MjmlNode | undefined): boolean {
  return node?.tag === 'mj-raw' && /^\s*\{\{\/if\}\}\s*$/.test(node.text ?? '');
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
    case 'mj-table':
      return parseTableBlock(node.attrs, node.text);
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
