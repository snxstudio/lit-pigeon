import type { RowNode, ColumnNode } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../utils/parse-spacing.js';
import { getAttr } from '../utils/parse-attributes.js';
import { parseColumn } from './column-parser.js';
import type { ParseWarning, MjmlNode } from '../mjml-to-document.js';

/**
 * Parses an mj-section element into a RowNode.
 */
export function parseSection(sectionNode: MjmlNode, warnings: ParseWarning[]): RowNode {
  const attrs = sectionNode.attrs;

  const columns: ColumnNode[] = [];

  for (const child of sectionNode.children) {
    if (child.tag === 'mj-column') {
      columns.push(parseColumn(child, warnings));
    } else if (child.tag === 'mj-group') {
      // mj-group contains columns
      for (const groupChild of child.children) {
        if (groupChild.tag === 'mj-column') {
          columns.push(parseColumn(groupChild, warnings));
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

  // Calculate column ratios from widths
  const columnRatios = calculateColumnRatios(columns, sectionNode);

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
    },
    columns,
    columnRatios,
    locked: false,
  };
}

/**
 * Calculate column ratios from column width percentages.
 * Defaults to equal widths if not specified.
 */
function calculateColumnRatios(columns: ColumnNode[], _sectionNode: MjmlNode): number[] {
  // For now, distribute evenly based on column count
  const count = columns.length;
  const ratio = Math.floor(12 / count);
  return columns.map(() => ratio);
}
