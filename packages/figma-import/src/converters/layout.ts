import { createColumn, createRow } from '@lit-pigeon/core';
import type { ColumnNode, ContentBlock, RowNode } from '@lit-pigeon/core';
import type { FigmaNode, ImportOptions } from '../types.js';
import { isVisible, paddingFromAutolayout, solidHex } from '../utils.js';
import { nodeToBlock } from './block.js';
import { looksLikeButton } from './button.js';

/**
 * Convert a top-level frame's direct children into Pigeon rows.
 *
 * Heuristics:
 *  - A FRAME with `layoutMode === 'HORIZONTAL'` and >1 visible children
 *    becomes a multi-column row (one column per child, columnRatios derived
 *    from each child's measured width).
 *  - Anything else becomes a single-column row whose lone block is the
 *    converted node.
 *  - Children that produce no block (skipped) emit a warning and are dropped.
 */
export function frameToRows(
  frame: FigmaNode,
  opts: ImportOptions,
  warnings: string[],
): RowNode[] {
  const children = (frame.children ?? []).filter(isVisible);
  const rows: RowNode[] = [];

  for (const child of children) {
    const row = childToRow(child, opts, warnings);
    if (row) rows.push(row);
  }
  return rows;
}

function childToRow(node: FigmaNode, opts: ImportOptions, warnings: string[]): RowNode | null {
  // Multi-column horizontal autolayout — but don't tear apart a button frame.
  if (
    node.type === 'FRAME' &&
    node.layoutMode === 'HORIZONTAL' &&
    (node.children?.filter(isVisible).length ?? 0) > 1 &&
    !looksLikeButton(node)
  ) {
    return horizontalFrameToRow(node, opts, warnings);
  }

  const block = nodeToBlock(node, opts, warnings);
  if (!block) return null;

  const column = createColumn([block]);
  const row = createRow([column]);
  row.attributes.padding = paddingFromAutolayout(node);
  const bg = solidHex(node.fills) ?? solidHex(node.background);
  if (bg) row.attributes.backgroundColor = bg;
  return row;
}

function horizontalFrameToRow(node: FigmaNode, opts: ImportOptions, warnings: string[]): RowNode {
  const children = (node.children ?? []).filter(isVisible);
  const cols: ColumnNode[] = [];
  const widths: number[] = [];

  for (const child of children) {
    const blocks: ContentBlock[] = [];
    const block = nodeToBlock(child, opts, warnings);
    if (block) blocks.push(block);
    const column = createColumn(blocks);
    column.attributes.padding = paddingFromAutolayout(child);
    cols.push(column);
    widths.push(child.absoluteBoundingBox?.width ?? 1);
  }

  const ratios = widthsToRatios(widths);
  const row = createRow(cols);
  row.columnRatios = ratios;
  row.attributes.padding = paddingFromAutolayout(node);
  const bg = solidHex(node.fills) ?? solidHex(node.background);
  if (bg) row.attributes.backgroundColor = bg;
  return row;
}

/** Project arbitrary positive widths onto a 12-grid with at-least-1 per column and a sum of exactly 12. */
export function widthsToRatios(widths: number[]): number[] {
  if (widths.length === 0) return [12];
  if (widths.length === 1) return [12];
  if (widths.length > 4) widths = widths.slice(0, 4);

  const total = widths.reduce((a, b) => a + b, 0);
  if (total === 0) return splitEvenly(widths.length);

  // Initial floor allocation, ensuring each column gets at least 1.
  const raw = widths.map((w) => (w / total) * 12);
  const floored = raw.map((r) => Math.max(1, Math.floor(r)));
  let sum = floored.reduce((a, b) => a + b, 0);

  // Pad or trim to exactly 12.
  while (sum !== 12) {
    if (sum < 12) {
      // Hand a slot to the column with the largest fractional remainder.
      const fractions = raw.map((r, i) => ({ i, frac: r - Math.floor(r), current: floored[i] }));
      fractions.sort((a, b) => b.frac - a.frac);
      const target = fractions[0].i;
      floored[target]++;
      sum++;
    } else {
      // Take a slot from the column with the most.
      let maxIdx = 0;
      for (let i = 1; i < floored.length; i++) if (floored[i] > floored[maxIdx]) maxIdx = i;
      if (floored[maxIdx] > 1) {
        floored[maxIdx]--;
        sum--;
      } else {
        break; // safety — can't go below 1 everywhere.
      }
    }
  }
  return floored;
}

function splitEvenly(count: number): number[] {
  if (count === 1) return [12];
  if (count === 2) return [6, 6];
  if (count === 3) return [4, 4, 4];
  return [3, 3, 3, 3];
}
