import type { PigeonDocument, RowNode, ColumnNode, ContentBlock, BlockType } from '../types/document.js';

const VALID_BLOCK_TYPES: BlockType[] = ['text', 'image', 'button', 'divider', 'spacer', 'social', 'html'];

export interface ValidationError {
  path: string;
  message: string;
}

export function validateDocument(doc: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!doc || typeof doc !== 'object') {
    errors.push({ path: '', message: 'Document must be an object' });
    return errors;
  }

  const d = doc as Record<string, unknown>;

  if (d.version !== '1.0') {
    errors.push({ path: 'version', message: 'Version must be "1.0"' });
  }

  if (!d.metadata || typeof d.metadata !== 'object') {
    errors.push({ path: 'metadata', message: 'Metadata is required' });
  } else {
    const meta = d.metadata as Record<string, unknown>;
    if (typeof meta.name !== 'string') {
      errors.push({ path: 'metadata.name', message: 'Name must be a string' });
    }
  }

  if (!d.body || typeof d.body !== 'object') {
    errors.push({ path: 'body', message: 'Body is required' });
    return errors;
  }

  const body = d.body as Record<string, unknown>;

  if (!body.attributes || typeof body.attributes !== 'object') {
    errors.push({ path: 'body.attributes', message: 'Body attributes are required' });
  }

  if (!Array.isArray(body.rows)) {
    errors.push({ path: 'body.rows', message: 'Rows must be an array' });
    return errors;
  }

  (body.rows as RowNode[]).forEach((row, ri) => {
    errors.push(...validateRow(row, `body.rows[${ri}]`));
  });

  return errors;
}

function validateRow(row: RowNode, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!row.id) {
    errors.push({ path: `${path}.id`, message: 'Row must have an id' });
  }

  if (row.type !== 'row') {
    errors.push({ path: `${path}.type`, message: 'Row type must be "row"' });
  }

  if (!Array.isArray(row.columns)) {
    errors.push({ path: `${path}.columns`, message: 'Columns must be an array' });
    return errors;
  }

  if (!Array.isArray(row.columnRatios)) {
    errors.push({ path: `${path}.columnRatios`, message: 'Column ratios must be an array' });
  } else if (row.columnRatios.length !== row.columns.length) {
    errors.push({
      path: `${path}.columnRatios`,
      message: 'Column ratios length must match columns length',
    });
  }

  row.columns.forEach((col, ci) => {
    errors.push(...validateColumn(col, `${path}.columns[${ci}]`));
  });

  return errors;
}

function validateColumn(col: ColumnNode, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!col.id) {
    errors.push({ path: `${path}.id`, message: 'Column must have an id' });
  }

  if (!Array.isArray(col.blocks)) {
    errors.push({ path: `${path}.blocks`, message: 'Blocks must be an array' });
    return errors;
  }

  col.blocks.forEach((block, bi) => {
    errors.push(...validateBlock(block, `${path}.blocks[${bi}]`));
  });

  return errors;
}

function validateBlock(block: ContentBlock, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!block.id) {
    errors.push({ path: `${path}.id`, message: 'Block must have an id' });
  }

  if (!VALID_BLOCK_TYPES.includes(block.type)) {
    errors.push({ path: `${path}.type`, message: `Invalid block type: ${block.type}` });
  }

  if (!block.values || typeof block.values !== 'object') {
    errors.push({ path: `${path}.values`, message: 'Block must have values' });
  }

  return errors;
}

export function isValidDocument(doc: unknown): doc is PigeonDocument {
  return validateDocument(doc).length === 0;
}
