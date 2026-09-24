import type { RowNode, ColumnNode } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../utils/parse-attributes.js';
import { parseSection } from './section-parser.js';
import { parseHeroBlock, heroTextHtml, heroButtonHtml } from './block-parsers/hero.js';
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
  const backgroundColor = getAttr(bodyNode.attrs, 'background-color');

  const rows: RowNode[] = [];

  // Tracks `{{#if …}}` display conditions emitted as mj-raw markers before
  // a section, applied to the next parsed row to round-trip conditional rows.
  // A hero row can carry two: the row's, then the hero block's.
  let pendingConditions: (string | undefined)[] = [];
  // Same for a `{{#each …}}` marker, which round-trips repeat rows.
  let pendingRepeat: string | undefined;
  const applyCondition = (row: RowNode): RowNode => {
    const [rowCondition, blockCondition] = pendingConditions;
    if (rowCondition) row.attributes.condition = rowCondition;
    const [block] = row.columns[0]?.blocks ?? [];
    if (blockCondition && block?.type === 'hero') block.values.condition = blockCondition;
    pendingConditions = [];
    if (pendingRepeat) {
      row.attributes.repeat = pendingRepeat;
      pendingRepeat = undefined;
    }
    return row;
  };

  for (const child of bodyNode.children) {
    switch (child.tag) {
      case 'mj-raw': {
        // Detect the conditional and loop wrappers the renderer emits. Opening
        // markers arm the following section; closing markers are noise.
        const match = /\{\{#if\s+([^}]+?)\s*\}\}/.exec(child.text ?? '');
        if (match) pendingConditions.push(match[1].trim());
        const each = /^\s*\{\{#each\s+([^}]+?)\s*\}\}\s*$/.exec(child.text ?? '');
        if (each) {
          pendingRepeat = each[1].trim();
          // The row condition sits outside the loop, so a later `{{#if}}` is the hero block's.
          pendingConditions = [pendingConditions[0]];
        }
        break;
      }
      case 'mj-section':
        rows.push(applyCondition(parseSection(child, warnings)));
        break;
      case 'mj-hero': {
        // mj-hero becomes a row with a single column containing a hero block
        const heroContent = extractHeroContent(child, warnings);
        const heroBlock = parseHeroBlock(child.attrs, heroContent.content, heroContent.innerPadding);
        Object.assign(heroBlock.values, child.visibility);
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
        rows.push(applyCondition(row));
        break;
      }
      case 'mj-wrapper':
        warnings.push({
          message:
            'mj-wrapper styling (padding, background-color) was dropped: the document model has no wrapper; its sections were imported unwrapped',
          tag: 'mj-wrapper',
        });
        // Treat wrapper children as normal sections
        for (const wrapperChild of child.children) {
          if (wrapperChild.tag === 'mj-section') {
            rows.push(applyCondition(parseSection(wrapperChild, warnings)));
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

function extractHeroContent(
  heroNode: MjmlNode,
  warnings: ParseWarning[],
): { content: string; innerPadding?: string } {
  const [only] = heroNode.children;
  if (heroNode.children.length === 1 && only.tag === 'mj-text') {
    return { content: heroTextHtml(only.attrs, only.text, true), innerPadding: only.attrs.padding };
  }

  // The hero block holds one HTML string, so each child becomes the HTML MJML renders for it
  const parts: string[] = [];
  for (const child of heroNode.children) {
    if (child.tag === 'mj-text') {
      parts.push(heroTextHtml(child.attrs, child.text, false));
    } else if (child.tag === 'mj-button') {
      parts.push(heroButtonHtml(child.attrs, child.text));
    } else {
      warnings.push({ message: `Unsupported mj-hero child element: ${child.tag}`, tag: child.tag });
    }
  }
  return { content: parts.join('') || '<p>Hero Content</p>' };
}
