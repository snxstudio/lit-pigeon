import { describe, it, expect } from 'vitest';
import { mergeTagsRule } from '../src/index.js';
import { makeBlock, makeDoc } from './helpers.js';

describe('mergeTagsRule', () => {
  it('flags unbalanced braces', () => {
    const doc = makeDoc([makeBlock('text', { content: '<p>Hi {{name}</p>' })]);
    const issues = mergeTagsRule.check(doc);
    expect(issues[0].rule).toBe('merge-tags/unbalanced');
  });

  it('flags empty placeholders', () => {
    const doc = makeDoc([makeBlock('text', { content: '<p>{{}}</p>' })]);
    const issues = mergeTagsRule.check(doc);
    expect(issues[0].rule).toBe('merge-tags/empty');
  });

  it('warns on placeholders with invalid characters', () => {
    const doc = makeDoc([makeBlock('text', { content: '<p>{{user!name}}</p>' })]);
    const issues = mergeTagsRule.check(doc);
    expect(issues[0].rule).toBe('merge-tags/invalid-name');
  });

  it('passes valid placeholders including dotted paths', () => {
    const doc = makeDoc([makeBlock('text', { content: '<p>Hi {{user.name}} ({{user-id}})</p>' })]);
    expect(mergeTagsRule.check(doc)).toEqual([]);
  });
});
