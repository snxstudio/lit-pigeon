import type {
  PigeonDocument,
  RowNode,
  ColumnNode,
  ContentBlock,
  HeroBlock,
} from '@lit-pigeon/core';
import { spacingToMjml } from './utils/spacing.js';
import { renderTextBlock } from './block-renderers/text.js';
import { renderImageBlock } from './block-renderers/image.js';
import { renderButtonBlock } from './block-renderers/button.js';
import { renderDividerBlock } from './block-renderers/divider.js';
import { renderSpacerBlock } from './block-renderers/spacer.js';
import { renderSocialBlock } from './block-renderers/social.js';
import { renderHtmlBlock } from './block-renderers/html.js';
import { renderHeroBlock, renderHeroSection } from './block-renderers/hero.js';
import { renderNavBarBlock } from './block-renderers/navbar.js';

/**
 * Renders a single content block to its MJML representation.
 */
function renderBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return renderTextBlock(block);
    case 'image':
      return renderImageBlock(block);
    case 'button':
      return renderButtonBlock(block);
    case 'divider':
      return renderDividerBlock(block);
    case 'spacer':
      return renderSpacerBlock(block);
    case 'social':
      return renderSocialBlock(block);
    case 'html':
      return renderHtmlBlock(block);
    case 'hero':
      return renderHeroBlock(block);
    case 'navbar':
      return renderNavBarBlock(block);
    default: {
      // Exhaustive check: if a new block type is added, TypeScript will error here
      const _exhaustive: never = block;
      return `<!-- Unknown block type: ${(_exhaustive as ContentBlock).type} -->`;
    }
  }
}

/**
 * Renders a ColumnNode to an MJML <mj-column> element.
 *
 * @param column - The column data
 * @param widthPercent - The column width as a percentage string (e.g., "50%")
 */
function renderColumn(column: ColumnNode, widthPercent: string): string {
  const { backgroundColor, padding, borderRadius, verticalAlign } = column.attributes;

  const attrs: string[] = [
    `width="${widthPercent}"`,
    `padding="${spacingToMjml(padding)}"`,
    `vertical-align="${verticalAlign}"`,
  ];

  if (backgroundColor) {
    attrs.push(`background-color="${backgroundColor}"`);
  }

  if (borderRadius !== undefined && borderRadius > 0) {
    attrs.push(`border-radius="${borderRadius}px"`);
  }

  const blocksMarkup = column.blocks.map((block) => `      ${renderBlock(block)}`).join('\n');

  return `    <mj-column ${attrs.join(' ')}>
${blocksMarkup}
    </mj-column>`;
}

/**
 * Renders a RowNode to an MJML <mj-section> element.
 * Column widths are calculated from the columnRatios array.
 * Each ratio represents a fraction of a 12-column grid.
 */
function renderRow(row: RowNode): string {
  // If the row has a single column with a single hero block, render as mj-hero
  if (
    row.columns.length === 1 &&
    row.columns[0].blocks.length === 1 &&
    row.columns[0].blocks[0].type === 'hero'
  ) {
    return renderHeroSection(row.columns[0].blocks[0] as HeroBlock);
  }

  const { backgroundColor, backgroundImage, padding, fullWidth } = row.attributes;

  const attrs: string[] = [
    `padding="${spacingToMjml(padding)}"`,
  ];

  if (fullWidth) {
    attrs.push('full-width="full-width"');
  }

  if (backgroundColor) {
    attrs.push(`background-color="${backgroundColor}"`);
  }

  if (backgroundImage) {
    attrs.push(`background-url="${escapeAttr(backgroundImage)}"`);
    attrs.push('background-size="cover"');
    attrs.push('background-repeat="no-repeat"');
  }

  // Calculate column width percentages from ratios
  // Each ratio is a fraction of 12 (e.g., [6, 6] => ["50%", "50%"])
  const totalRatio = row.columnRatios.reduce((sum, r) => sum + r, 0);
  const columnsMarkup = row.columns
    .map((column, index) => {
      const ratio = row.columnRatios[index] ?? 1;
      const percent = ((ratio / totalRatio) * 100).toFixed(2).replace(/\.?0+$/, '');
      return renderColumn(column, `${percent}%`);
    })
    .join('\n');

  return `  <mj-section ${attrs.join(' ')}>
${columnsMarkup}
  </mj-section>`;
}

/**
 * Builds the <mj-head> section of the MJML document, including:
 * - <mj-attributes> for default styling
 * - <mj-preview> for preview text
 */
function renderHead(doc: PigeonDocument): string {
  const { fontFamily } = doc.body.attributes;
  const previewText = doc.metadata.previewText;

  const headParts: string[] = [];

  // Default attributes
  headParts.push(`    <mj-attributes>
      <mj-all font-family="${escapeAttr(fontFamily)}" />
      <mj-text font-size="14px" line-height="1.5" />
      <mj-button font-size="14px" />
    </mj-attributes>`);

  // Preview text
  if (previewText) {
    headParts.push(`    <mj-preview>${escapeHtml(previewText)}</mj-preview>`);
  }

  return `  <mj-head>
${headParts.join('\n')}
  </mj-head>`;
}

/**
 * Converts a PigeonDocument into a complete MJML markup string.
 *
 * This function maps the document's body attributes, rows, columns,
 * and content blocks to their MJML equivalents. The resulting string
 * can then be passed to mjml2html() to produce the final HTML output.
 */
export function documentToMjml(doc: PigeonDocument): string {
  const { width, backgroundColor } = doc.body.attributes;

  const bodyAttrs: string[] = [
    `width="${width}px"`,
  ];

  if (backgroundColor) {
    bodyAttrs.push(`background-color="${backgroundColor}"`);
  }

  const head = renderHead(doc);
  const rows = doc.body.rows.map((row) => renderRow(row)).join('\n');

  return `<mjml>
${head}
  <mj-body ${bodyAttrs.join(' ')}>
${rows}
  </mj-body>
</mjml>`;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
