import type { RowNode, ColumnNode } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../utils/parse-attributes.js';
import { parseSection } from './section-parser.js';
import { parseHeroBlock } from './block-parsers/hero.js';
import type { ParseWarning, MjmlNode } from '../mjml-to-document.js';

export interface BodyData {
  width: number;
  backgroundColor: string;
  rows: RowNode[];
}

/**
 * Parses the mj-body element and its children into rows.
 */
export function parseBody(bodyNode: MjmlNode, warnings: ParseWarning[]): BodyData {
  const width = getNumericAttr(bodyNode.attrs, 'width', 600);
  const backgroundColor = getAttr(bodyNode.attrs, 'background-color', '#f4f4f5');

  const rows: RowNode[] = [];

  for (const child of bodyNode.children) {
    switch (child.tag) {
      case 'mj-section':
        rows.push(parseSection(child, warnings));
        break;
      case 'mj-hero': {
        // mj-hero becomes a row with a single column containing a hero block
        const heroContent = extractHeroContent(child);
        const heroBlock = parseHeroBlock(child.attrs, heroContent);
        const column: ColumnNode = {
          id: generateId(),
          type: 'column',
          attributes: {
            padding: parseSpacing(undefined, 0),
            verticalAlign: 'top',
          },
          blocks: [heroBlock],
        };
        const row: RowNode = {
          id: generateId(),
          type: 'row',
          attributes: {
            padding: parseSpacing(undefined, 0),
            fullWidth: false,
          },
          columns: [column],
          columnRatios: [12],
          locked: false,
        };
        rows.push(row);
        break;
      }
      case 'mj-wrapper':
        // Treat wrapper children as normal sections
        for (const wrapperChild of child.children) {
          if (wrapperChild.tag === 'mj-section') {
            rows.push(parseSection(wrapperChild, warnings));
          }
        }
        break;
      default:
        warnings.push({
          message: `Unknown body child element: ${child.tag}`,
          tag: child.tag,
        });
        break;
    }
  }

  return { width, backgroundColor, rows };
}

function extractHeroContent(heroNode: MjmlNode): string {
  // Extract text content from mj-text children inside the hero
  const textParts: string[] = [];
  for (const child of heroNode.children) {
    if (child.tag === 'mj-text') {
      textParts.push(child.text);
    } else if (child.tag === 'mj-button') {
      textParts.push(child.text);
    }
  }
  return textParts.join('') || '<p>Hero Content</p>';
}
