import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '@lit-pigeon/core';
import { validateDocumentSafe } from '../src/index.js';

describe('validateDocumentSafe', () => {
  it('returns valid:true for a good document', () => {
    const result = validateDocumentSafe(createDefaultDocument());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('returns valid:false for a non-object', () => {
    const result = validateDocumentSafe(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('flags missing version', () => {
    const result = validateDocumentSafe({ metadata: { name: 'x' }, body: { attributes: {}, rows: [] } });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'version')).toBe(true);
  });
});
