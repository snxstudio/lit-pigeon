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
import { visibilityClass, withCssClass, VISIBILITY_STYLE } from './utils/visibility.js';
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
  const { backgroundColor, padding, borderRadius, verticalAlign, cssClass } = column.attributes;

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

  const columnClass = [cssClass && escapeAttr(cssClass), visibilityClass(column.attributes)].filter(Boolean).join(' ');
  if (columnClass) {
    attrs.push(`css-class="${columnClass}"`);
  }

  const blocksMarkup = column.blocks
    .map((block) =>
      wrapConditional(
        `      ${withCssClass(renderBlock(block), visibilityClass(block.values))}`,
        block.values.condition,
        '      ',
      ),
    )
    .join('\n');

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
    const hero = row.columns[0].blocks[0] as HeroBlock;
    return wrapConditional(
      wrapRepeat(
        wrapConditional(
          withCssClass(renderHeroSection(hero), visibilityClass(hero.values)),
          hero.values.condition,
        ),
        row.attributes.repeat,
      ),
      row.attributes.condition,
    );
  }

  const { backgroundColor, backgroundImage, padding, fullWidth, cssClass, noStackOnMobile } = row.attributes;

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

  if (cssClass) {
    attrs.push(`css-class="${escapeAttr(cssClass)}"`);
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

  // mj-group is what keeps the columns side by side on mobile; without it MJML
  // stacks them at its breakpoint.
  const body = noStackOnMobile
    ? `    <mj-group>
${columnsMarkup}
    </mj-group>`
    : columnsMarkup;

  return wrapConditional(
    wrapRepeat(
      `  <mj-section ${attrs.join(' ')}>
${body}
  </mj-section>`,
      row.attributes.repeat,
    ),
    row.attributes.condition,
  );
}

/**
 * Wrap a section's (or a block's) MJML in a template-engine conditional when
 * the row or block has a display `condition`. The `{{#if}}` / `{{/if}}`
 * markers are emitted inside `<mj-raw>` so mjml2html passes them through
 * verbatim into the final HTML, where the sending platform (Handlebars,
 * Liquid, etc.) evaluates them.
 */
function wrapConditional(markup: string, condition?: string, indent = '  '): string {
  const expr = condition?.trim();
  if (!expr) return markup;
  return `${indent}<mj-raw>{{#if ${expr}}}</mj-raw>
${markup}
${indent}<mj-raw>{{/if}}</mj-raw>`;
}

/**
 * Wrap a section's MJML in a Handlebars `{{#each}}` loop when the row has a
 * `repeat` path, using the same pass-through `<mj-raw>` markers as
 * {@link wrapConditional}.
 */
function wrapRepeat(sectionMarkup: string, repeat?: string): string {
  const path = repeat?.trim();
  if (!path) return sectionMarkup;
  return `  <mj-raw>{{#each ${path}}}</mj-raw>
${sectionMarkup}
  <mj-raw>{{/each}}</mj-raw>`;
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
 * Builds font tags for each registered font that has a URL, deduped by href.
 *
 * Emits both:
 * - `<mj-font>` so MJML can resolve `font-family` declarations to the correct
 *   stylesheet (MJML only injects the `<link>` when the name matches a used
 *   font-family, so we also emit a `<mj-raw>` link to guarantee the URL is
 *   always present in the rendered HTML regardless of font-family usage).
 * - `<mj-raw><link>` to unconditionally inject the stylesheet into the `<head>`.
 */
function renderFontTags(fonts: FontDefinition[]): string {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const font of fonts) {
    if (!font.url || seen.has(font.url)) continue;
    seen.add(font.url);
    const name = font.family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    const escapedUrl = escapeAttr(font.url);
    const escapedName = escapeAttr(name);
    tags.push(`    <mj-font name="${escapedName}" href="${escapedUrl}" />`);
    tags.push(`    <mj-raw><link rel="stylesheet" href="${escapedUrl}"></mj-raw>`);
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
  const { fontFamily, css } = doc.body.attributes;
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

  // mj-raw gets neither mj-all nor mj-text defaults, and sits in a column td
  // with font-size:0px, so unstyled html-block text would be invisible.
  const hasHtmlBlock = doc.body.rows.some((row) => row.columns.some((col) => col.blocks.some((b) => b.type === 'html')));
  if (hasHtmlBlock) {
    headParts.push(`    <mj-style inline="inline">
      .lp-html { font-size: 14px; line-height: 1.5; font-family: ${fontFamily.replace(/[<>{};]/g, '')}; }
    </mj-style>`);
  }

  const hidesOnDevice = doc.body.rows.some((row) =>
    row.columns.some((col) => visibilityClass(col.attributes) || col.blocks.some((b) => visibilityClass(b.values))),
  );
  if (hidesOnDevice) headParts.push(VISIBILITY_STYLE);

  if (css) {
    // A literal </mj-style would end the element early; <\/ means the same in CSS
    headParts.push(`    <mj-style>
${css.replace(/<\/mj-style/gi, '<\\/mj-style')}
    </mj-style>`);
  }

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
