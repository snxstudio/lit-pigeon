import { describe, it, expect } from 'vitest';
import {
  createColumn,
  createDefaultDocument,
  createRow,
} from '@lit-pigeon/core';
import { emptyContentRule } from '../src/index.js';
import { makeBlock, makeDoc } from './helpers.js';

describe('emptyContentRule', () => {
  it('errors on a document with no rows', () => {
    const doc = createDefaultDocument('Hi');
    const issues = emptyContentRule.check(doc);
    expect(issues[0].rule).toBe('empty-content/no-rows');
    expect(issues[0].severity).toBe('error');
  });

  it('warns on a row with no blocks', () => {
    const doc = createDefaultDocument('Hi');
    doc.body.rows.push(createRow([createColumn([])]));
    const issues = emptyContentRule.check(doc);
    expect(issues[0].rule).toBe('empty-content/empty-row');
  });

  it('passes a populated document', () => {
    const doc = makeDoc([makeBlock('text', { content: '<p>x</p>' })]);
    expect(emptyContentRule.check(doc)).toEqual([]);
  });
});
