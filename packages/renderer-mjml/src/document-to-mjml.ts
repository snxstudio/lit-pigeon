import type {
  PigeonDocument,
  RowNode,
  ColumnNode,
  ContentBlock,
  HeroBlock,
  RegisteredBlock,
  FontDefinition,
} from '@lit-pigeon/core';
import { getBlockDefinition } from '@lit-pigeon/core';
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
    default:
      return renderCustomBlock(block);
  }
}

/**
 * Render a registry-defined custom block to MJML via its `renderMjml` hook.
 * If the type is unknown or supplies no MJML renderer, emit a comment so the
 * output stays valid and the gap is visible rather than silently dropped.
 */
function renderCustomBlock(block: ContentBlock): string {
  const type = (block as { type: string }).type;
  const def = getBlockDefinition(type);
  if (def?.renderMjml) {
    return def.renderMjml(block as unknown as RegisteredBlock);
  }
  return `<!-- Unknown block type: ${type} -->`;
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
    return wrapConditional(
      renderHeroSection(row.columns[0].blocks[0] as HeroBlock),
      row.attributes.condition,
    );
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

  return wrapConditional(
    `  <mj-section ${attrs.join(' ')}>
${columnsMarkup}
  </mj-section>`,
    row.attributes.condition,
  );
}

/**
 * Wrap a section's MJML in a template-engine conditional when the row has a
 * display `condition`. The `{{#if}}` / `{{/if}}` markers are emitted inside
 * `<mj-raw>` so mjml2html passes them through verbatim into the final HTML,
 * where the sending platform (Handlebars, Liquid, etc.) evaluates them.
 */
function wrapConditional(sectionMarkup: string, condition?: string): string {
  const expr = condition?.trim();
  if (!expr) return sectionMarkup;
  return `  <mj-raw>{{#if ${expr}}}</mj-raw>
${sectionMarkup}
  <mj-raw>{{/if}}</mj-raw>`;
}

/**
 * Options that influence the MJML document the renderer emits.
 *
 * Kept as a local subset of `@lit-pigeon/core`'s `RenderOptions` — only the
 * fields that affect MJML markup generation are relevant here (other fields
 * like `minify`/`beautify` apply to the mjml2html compilation step).
 */
export interface DocumentToMjmlOptions {
  /**
   * Inject Outlook (mso) and dark-mode rendering workarounds into the
   * document. Defaults to `true`. Set to `false` to emit a bare MJML
   * document without the heading-margin reset, dark-mode meta tags, or
   * `[if mso]` conditional block.
   */
  outlookWorkarounds?: boolean;
  /**
   * Web fonts to emit as `<mj-font>` in the head. Each font with a `url`
   * produces one stylesheet link (deduped by url); URL-less fonts are skipped.
   */
  fonts?: FontDefinition[];
}

/**
 * `<mj-raw>` block holding the standard Office365 / Outlook 2016+ mso
 * conditional. The Arial fallback only fires inside MSO — modern clients
 * keep using the document's chosen font-family.
 */
const MSO_CONDITIONAL_BLOCK = `    <mj-raw>
      <!--[if mso]>
      <style>
        body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
        blockquote { margin: 0 0 16px !important; }
      </style>
      <![endif]-->
    </mj-raw>`;

/**
 * Dark-mode color-scheme meta tags inside an `<mj-raw>` so MJML emits them
 * verbatim into the document `<head>`. Email clients that honour these
 * (Apple Mail, recent Outlook desktop, etc.) will respect the document's
 * chosen background/text colours instead of force-inverting them.
 */
const DARK_MODE_META_BLOCK = `    <mj-raw>
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
    </mj-raw>`;

/**
 * Heading-margin reset for Outlook. TipTap emits `<h1>`/`<h2>`/`<h3>` and
 * `<blockquote>` with browser-default margins that Outlook renders with
 * extra whitespace. This zeros the top margin and uses a compact bottom
 * margin across all clients (mso variant in MSO_CONDITIONAL_BLOCK gets the
 * `!important` override that Outlook needs).
 */
const HEADING_MARGIN_RESET_BLOCK = `    <mj-style inline="inline">
      h1, h2, h3, blockquote { margin: 0 0 0.5em; }
    </mj-style>`;

/**
 * Builds `<mj-font>` tags for each registered font that has a URL, deduped by
 * href. `name` is the primary family token (first entry of the stack), which
 * is what MJML matches against `font-family` declarations.
 */
function renderFontTags(fonts: FontDefinition[]): string {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const font of fonts) {
    if (!font.url || seen.has(font.url)) continue;
    seen.add(font.url);
    const name = font.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    tags.push(`    <mj-font name="${escapeAttr(name)}" href="${escapeAttr(font.url)}" />`);
  }
  return tags.join('\n');
}

/**
 * Builds the <mj-head> section of the MJML document, including:
 * - Outlook + dark-mode workarounds (unless disabled)
 * - <mj-attributes> for default styling
 * - <mj-preview> for preview text
 */
function renderHead(doc: PigeonDocument, options: Required<DocumentToMjmlOptions>): string {
  const { fontFamily } = doc.body.attributes;
  const previewText = doc.metadata.previewText;

  const headParts: string[] = [];

  if (options.outlookWorkarounds) {
    // mso conditional first so Outlook picks it up before any other styling.
    headParts.push(MSO_CONDITIONAL_BLOCK);
    headParts.push(DARK_MODE_META_BLOCK);
    headParts.push(HEADING_MARGIN_RESET_BLOCK);
  }

  const fontTags = renderFontTags(options.fonts);
  if (fontTags) headParts.push(fontTags);

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
 *
 * @param doc - The PigeonDocument to render.
 * @param options - Optional MJML-shaping options. `outlookWorkarounds`
 *   defaults to `true` and injects Outlook (mso) + dark-mode workarounds.
 */
export function documentToMjml(doc: PigeonDocument, options?: DocumentToMjmlOptions): string {
  const resolved: Required<DocumentToMjmlOptions> = {
    outlookWorkarounds: options?.outlookWorkarounds ?? true,
    fonts: options?.fonts ?? [],
  };

  const { width, backgroundColor } = doc.body.attributes;

  const bodyAttrs: string[] = [
    `width="${width}px"`,
  ];

  if (backgroundColor) {
    bodyAttrs.push(`background-color="${backgroundColor}"`);
  }

  const head = renderHead(doc, resolved);
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
