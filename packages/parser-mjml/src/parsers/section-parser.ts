import type { RowNode, ColumnNode } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../utils/parse-spacing.js';
import { getAttr } from '../utils/parse-attributes.js';
import { parseColumn } from './column-parser.js';
import type { ParseWarning, MjmlNode } from '../mjml-to-document.js';

/**
 * Parses an mj-section element into a RowNode.
 */
export function parseSection(
  sectionNode: MjmlNode,
  warnings: ParseWarning[],
  bodyWidth: number,
): RowNode {
  const attrs = sectionNode.attrs;

  const columns: ColumnNode[] = [];
  // Kept alongside `columns` so the ratios can be read off the source widths,
  // which the ColumnNode does not carry.
  const columnNodes: MjmlNode[] = [];
  let groups = 0;
  let looseColumns = 0;

  for (const child of sectionNode.children) {
    if (child.tag === 'mj-column') {
      columns.push(parseColumn(child, warnings));
      columnNodes.push(child);
      looseColumns++;
    } else if (child.tag === 'mj-group') {
      groups++;
      // mj-group contains columns
      for (const groupChild of child.children) {
        if (groupChild.tag === 'mj-column') {
          columns.push(parseColumn(groupChild, warnings));
          columnNodes.push(groupChild);
        }
      }
    } else {
      warnings.push({
        message: `Unexpected section child: ${child.tag}`,
        tag: child.tag,
      });
    }
  }

  // If no columns found, create an empty one
  if (columns.length === 0) {
    columns.push({
      id: generateId(),
      type: 'column',
      attributes: {
        padding: parseSpacing(undefined, 0),
        verticalAlign: 'top',
      },
      blocks: [],
    });
  }

  const columnRatios = columnNodes.length
    ? calculateColumnRatios(columnNodes, bodyWidth, warnings)
    : [12];

  // The document models non-stacking per row, so one group holding every
  // column maps cleanly. A section that mixes a group with loose columns, or
  // holds more than one, cannot be expressed: keeping the flag would make the
  // ungrouped columns stop stacking too, so it is dropped and said out loud.
  const wholeSectionIsOneGroup = groups === 1 && looseColumns === 0;
  if (groups > 0 && !wholeSectionIsOneGroup) {
    warnings.push({
      message:
        'A section mixing mj-group with other columns was flattened: its columns will stack on mobile',
      tag: 'mj-group',
    });
  }

  const fullWidthAttr = getAttr(attrs, 'full-width');
  const isFullWidth = fullWidthAttr === 'full-width';

  return {
    id: generateId(),
    type: 'row',
    attributes: {
      backgroundColor: getAttr(attrs, 'background-color') || undefined,
      backgroundImage: getAttr(attrs, 'background-url') || undefined,
      padding: parseSpacing(getAttr(attrs, 'padding'), 0),
      fullWidth: isFullWidth,
      cssClass: getAttr(attrs, 'css-class') || undefined,
      ...(wholeSectionIsOneGroup ? { noStackOnMobile: true } : {}),
    },
    columns,
    columnRatios,
    locked: false,
  };
}

/**
 * Resolves a single `mj-column` width to a percentage of the section's content
 * width, or undefined when the column does not declare one.
 *
 * MJML accepts a percentage or a pixel length; a bare number is pixels. Pixel
 * widths are taken against the body width so they can be compared with
 * percentages in the same section.
 */
function widthPercent(node: MjmlNode, bodyWidth: number): number | undefined {
  const raw = node.attrs['width']?.trim();
  if (!raw) return undefined;

  const value = parseFloat(raw);
  if (isNaN(value) || value <= 0) return undefined;

  return raw.endsWith('%') ? value : (value / bodyWidth) * 100;
}

/**
 * Derives a row's column ratios from the source `mj-column` widths.
 *
 * Ratios are a fraction of a 12-column grid, so each width is scaled onto that
 * grid and rounded. Unlike `cellsToRatios` in `@lit-pigeon/import-unlayer`,
 * the result is deliberately not forced to sum to 12: five equal columns are
 * `[2, 2, 2, 2, 2]`, not `[4, 2, 2, 2, 2]`. The renderer normalises by the
 * total, so proportionality is what matters, and forcing the sum would widen
 * one column of an even split by a third.
 */
function calculateColumnRatios(
  columnNodes: MjmlNode[],
  bodyWidth: number,
  warnings: ParseWarning[],
): number[] {
  const declared = columnNodes.map((node) => widthPercent(node, bodyWidth));

  // No column states a width: MJML splits the section evenly, and so did every
  // document written before widths were read. Keep that result exactly.
  if (declared.every((pct) => pct === undefined)) {
    const ratio = Math.floor(12 / declared.length);
    return declared.map(() => ratio);
  }

  const claimed = declared.reduce<number>((sum, pct) => sum + (pct ?? 0), 0);
  if (claimed > 101) {
    warnings.push({
      message: `Column widths total ${Math.round(claimed)}% of the body width; they were scaled to fit`,
      tag: 'mj-section',
    });
  }

  // MJML gives the columns that state no width an equal share of what is left.
  const implicit = declared.filter((pct) => pct === undefined).length;
  const remainder = Math.max(0, 100 - claimed);
  const widths = declared.map((pct) => pct ?? remainder / implicit);

  const total = widths.reduce((a, b) => a + b, 0);
  // A column too thin to register on the grid still gets one twelfth: losing it
  // entirely would be a worse answer than showing it narrow.
  return widths.map((w) => Math.max(1, Math.round((w * 12) / total)));
}
