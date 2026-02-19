import { describe, it, expect } from 'vitest';
import {
  validateDocument,
  isValidDocument,
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  getDefaultValues,
  defaultSpacing,
  getAllBlockDefinitions,
  getBlockDefinition,
  isKnownBlockType,
} from '../src/index.js';

describe('Document Validation', () => {
  it('should validate a valid document', () => {
    const doc = createDefaultDocument('Test');
    const errors = validateDocument(doc);
    expect(errors).toHaveLength(0);
    expect(isValidDocument(doc)).toBe(true);
  });

  it('should validate document with rows and blocks', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [
      createRow([createColumn([createBlock('text')])]),
    ];
    const errors = validateDocument(doc);
    expect(errors).toHaveLength(0);
  });

  it('should reject null document', () => {
    const errors = validateDocument(null);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject document without version', () => {
    const errors = validateDocument({ metadata: { name: 'Test' }, body: { attributes: {}, rows: [] } });
    expect(errors.some((e) => e.path === 'version')).toBe(true);
  });

  it('should reject document without metadata', () => {
    const errors = validateDocument({ version: '1.0', body: { attributes: {}, rows: [] } });
    expect(errors.some((e) => e.path === 'metadata')).toBe(true);
  });

  it('should reject document without body', () => {
    const errors = validateDocument({ version: '1.0', metadata: { name: 'Test' } });
    expect(errors.some((e) => e.path === 'body')).toBe(true);
  });

  it('should reject row without id', () => {
    const doc = createDefaultDocument('Test');
    doc.body.rows = [{
      id: '',
      type: 'row',
      attributes: { padding: defaultSpacing(), fullWidth: false },
      columns: [],
      columnRatios: [],
      locked: false,
    }];
    const errors = validateDocument(doc);
    expect(errors.some((e) => e.message.includes('id'))).toBe(true);
  });
});

describe('Defaults', () => {
  it('should create default spacing', () => {
    const spacing = defaultSpacing(10);
    expect(spacing).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
  });

  it('should create default spacing with 0', () => {
    const spacing = defaultSpacing();
    expect(spacing).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('should get default values for all block types', () => {
    const types = ['text', 'image', 'button', 'divider', 'spacer', 'social', 'html'] as const;
    for (const type of types) {
      const values = getDefaultValues(type);
      expect(values).toBeDefined();
    }
  });

  it('should throw for unknown block type', () => {
    expect(() => getDefaultValues('unknown' as any)).toThrow();
  });

  it('should create block with ID', () => {
    const block = createBlock('text');
    expect(block.id).toBeTruthy();
    expect(block.type).toBe('text');
    expect(block.values).toBeDefined();
  });

  it('should create block with overrides', () => {
    const block = createBlock('text', { content: '<p>Custom</p>' });
    expect((block as any).values.content).toBe('<p>Custom</p>');
  });

  it('should create row with default column', () => {
    const row = createRow();
    expect(row.id).toBeTruthy();
    expect(row.columns).toHaveLength(1);
    expect(row.columnRatios).toEqual([12]);
  });

  it('should create row with custom columns', () => {
    const row = createRow([createColumn(), createColumn()], [6, 6]);
    expect(row.columns).toHaveLength(2);
    expect(row.columnRatios).toEqual([6, 6]);
  });
});

describe('Block Registry', () => {
  it('should have all built-in block types', () => {
    const defs = getAllBlockDefinitions();
    expect(defs.length).toBeGreaterThanOrEqual(7);
  });

  it('should get block definition by type', () => {
    const def = getBlockDefinition('text');
    expect(def).toBeDefined();
    expect(def!.label).toBe('Text');
  });

  it('should check known block types', () => {
    expect(isKnownBlockType('text')).toBe(true);
    expect(isKnownBlockType('image')).toBe(true);
    expect(isKnownBlockType('unknown')).toBe(false);
  });
});
