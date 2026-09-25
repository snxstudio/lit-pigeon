import type { ColumnNode, ContentBlock, PigeonDocument, RowNode } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import type { UnlayerColumn, UnlayerDesign, UnlayerRow } from './types.js';
import type { ImportWarning } from './warnings.js';
import { convertContent, type InheritedStyle } from './blocks/index.js';
import { cellsToRatios, color, dig, parseSpacing, px, str } from './utils/values.js';

export interface ImportOptions {
  /** Name for the imported template. Defaults to `'Imported from Unlayer'`. */
  name?: string;
}

export interface ImportResult {
  document: PigeonDocument;
  warnings: ImportWarning[];
}

const DEFAULT_WIDTH = 600;
const DEFAULT_BACKGROUND = '#f4f4f5';
const DEFAULT_FONT = 'Arial, Helvetica, sans-serif';

/**
 * Converts an Unlayer design JSON export into a `PigeonDocument`.
 *
 * Accepts either the parsed object or the raw JSON string produced by
 * `editor.saveDesign()`. Import is best-effort and never throws on malformed
 * or unsupported input: anything that cannot be represented is dropped and
 * reported through {@link ImportResult.warnings}.
 *
 * @example
 * ```ts
 * const { document, warnings } = unlayerToDocument(designJson);
 * if (warnings.length) console.warn(warnings);
 * ```
 */
export function unlayerToDocument(
  design: UnlayerDesign | string,
  options: ImportOptions = {},
): ImportResult {
  const warnings: ImportWarning[] = [];
  const parsed = coerceDesign(design, warnings);
  const name = options.name ?? 'Imported from Unlayer';

  if (!parsed) return { document: emptyDocument(name), warnings };

  const bodyValues = (parsed.body?.values ?? {}) as Record<string, unknown>;
  const inherited: InheritedStyle = {
    fontFamily: str(dig(bodyValues, 'fontFamily', 'value')) || undefined,
    textColor: color(bodyValues.textColor),
  };

  const sourceRows = Array.isArray(parsed.body?.rows) ? parsed.body!.rows! : [];
  if (sourceRows.length === 0) {
    warnings.push({ code: 'no-rows', message: 'The design contains no rows; imported an empty template.' });
  }

  const rows = sourceRows
    .map((row) => convertRow(row, inherited, warnings))
    .filter((row): row is RowNode => row !== null);

  const now = new Date().toISOString();
  const previewText = str(bodyValues.preheaderText);
  const { language, direction } = readLocale(bodyValues, warnings);

  return {
    document: {
      version: '1.0',
      metadata: {
        name,
        ...(previewText ? { previewText } : {}),
        createdAt: now,
        updatedAt: now,
      },
      body: {
        attributes: {
          width: px(bodyValues.contentWidth, DEFAULT_WIDTH) || DEFAULT_WIDTH,
          backgroundColor: color(bodyValues.backgroundColor) ?? DEFAULT_BACKGROUND,
          fontFamily: inherited.fontFamily ?? DEFAULT_FONT,
          contentAlignment: bodyValues.contentAlign === 'left' ? 'left' : 'center',
          ...(language ? { language } : {}),
          ...(direction ? { direction } : {}),
        },
        rows,
      },
    },
    warnings,
  };
}

/**
 * Unlayer keeps the document language under `language` and its text-direction
 * setting under `textDirection`. `language` is a string on a plain design but an
 * object once the translations feature is in use, where no single tag applies.
 */
function readLocale(
  bodyValues: Record<string, unknown>,
  warnings: ImportWarning[],
): { language?: string; direction?: 'ltr' | 'rtl' } {
  const language = str(bodyValues.language) || undefined;
  const raw = str(bodyValues.textDirection);

  if (!raw) return { language };
  if (raw === 'ltr' || raw === 'rtl') return { language, direction: raw };

  warnings.push({
    code: 'unknown-text-direction',
    message: `Unrecognised text direction "${raw}"; the document falls back to its language's natural direction.`,
  });
  return { language };
}

function coerceDesign(design: UnlayerDesign | string, warnings: ImportWarning[]): UnlayerDesign | null {
  let value: unknown = design;

  if (typeof design === 'string') {
    try {
      value = JSON.parse(design);
    } catch {
      warnings.push({ code: 'not-a-design', message: 'Input is not valid JSON.' });
      return null;
    }
  }

  if (typeof value !== 'object' || value === null || !('body' in value)) {
    warnings.push({
      code: 'not-a-design',
      message: 'Input does not look like an Unlayer design (no `body` key). Export it with `editor.saveDesign()`.',
    });
    return null;
  }

  return value as UnlayerDesign;
}

function convertRow(row: UnlayerRow, inherited: InheritedStyle, warnings: ImportWarning[]): RowNode | null {
  const v = (row.values ?? {}) as Record<string, unknown>;
  const sourceColumns = Array.isArray(row.columns) ? row.columns : [];

  if (sourceColumns.length === 0) {
    warnings.push({ code: 'empty-row', message: 'Skipped a row with no columns.' });
    return null;
  }

  // Unlayer's displayCondition is a raw before/after template pair (e.g. a
  // Liquid `{% if %}` fragment), not the boolean expression Pigeon's `condition`
  // wraps in `{{#if}}`. Guessing a translation would silently change who
  // receives the content, so it is dropped loudly instead.
  if (v.displayCondition != null) {
    const label = str(dig(v, 'displayCondition', 'label'));
    warnings.push({
      code: 'display-condition-dropped',
      message: `Display condition${label ? ` "${label}"` : ''} was dropped — Unlayer stores raw template fragments that cannot be translated automatically. Re-add it on the row.`,
    });
  }

  const columns = sourceColumns.map((col) => convertColumn(col, inherited, warnings));
  const backgroundImage = str(dig(v, 'backgroundImage', 'url'));

  return {
    id: generateId(),
    type: 'row',
    attributes: {
      ...(color(v.backgroundColor) ?? color(v.columnsBackgroundColor)
        ? { backgroundColor: (color(v.backgroundColor) ?? color(v.columnsBackgroundColor))! }
        : {}),
      ...(backgroundImage ? { backgroundImage } : {}),
      padding: parseSpacing(v.padding, 0),
      fullWidth: v.fullWidth === true || dig(v, 'backgroundImage', 'fullWidth') === true,
    },
    columns,
    columnRatios: cellsToRatios(row.cells, columns.length),
    // Unlayer expresses "locked" as the absence of interaction flags.
    locked: v.locked === true || (v.draggable === false && v.deletable === false),
  };
}

function convertColumn(col: UnlayerColumn, inherited: InheritedStyle, warnings: ImportWarning[]): ColumnNode {
  const v = (col.values ?? {}) as Record<string, unknown>;
  const contents = Array.isArray(col.contents) ? col.contents : [];
  const blocks: ContentBlock[] = [];

  for (const content of contents) {
    const block = convertContent(content, inherited, warnings);
    if (block) {
      blocks.push(block);
      continue;
    }

    const type = str(content.type, 'unknown');
    if (type.startsWith('custom#')) {
      warnings.push({
        code: 'custom-tool',
        contentType: type,
        message: `Custom tool "${type.slice('custom#'.length)}" was dropped — re-create it as a Lit Pigeon plugin block.`,
      });
    } else {
      warnings.push({
        code: 'unsupported-block',
        contentType: type,
        message: `Unsupported Unlayer block "${type}" was dropped.`,
      });
    }
  }

  const bg = color(v.backgroundColor);

  return {
    id: generateId(),
    type: 'column',
    attributes: {
      ...(bg ? { backgroundColor: bg } : {}),
      padding: parseSpacing(v.padding, 0),
      verticalAlign: verticalAlign(v.verticalAlign),
    },
    blocks,
  };
}

function verticalAlign(value: unknown): 'top' | 'middle' | 'bottom' {
  return value === 'middle' || value === 'bottom' ? value : 'top';
}

function emptyDocument(name: string): PigeonDocument {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    metadata: { name, createdAt: now, updatedAt: now },
    body: {
      attributes: {
        width: DEFAULT_WIDTH,
        backgroundColor: DEFAULT_BACKGROUND,
        fontFamily: DEFAULT_FONT,
        contentAlignment: 'center',
      },
      rows: [],
    },
  };
}
