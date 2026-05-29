import { describe, it, expect } from 'vitest';
import { altTextRule } from '../src/index.js';
import { makeBlock, makeDoc } from './helpers.js';

describe('altTextRule', () => {
  it('flags an image with no alt', () => {
    const doc = makeDoc([makeBlock('image', { src: 'https://x/i.jpg', alt: '' })]);
    const issues = altTextRule.check(doc);
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('alt-text/missing');
    expect(issues[0].severity).toBe('error');
  });

  it('accepts an image with alt text', () => {
    const doc = makeDoc([makeBlock('image', { src: 'https://x/i.jpg', alt: 'hello' })]);
    expect(altTextRule.check(doc)).toEqual([]);
  });

  it('warns when alt text is over 125 chars', () => {
    const alt = 'a'.repeat(130);
    const doc = makeDoc([makeBlock('image', { src: 'https://x/i.jpg', alt })]);
    const issues = altTextRule.check(doc);
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('alt-text/too-long');
  });

  it('ignores non-image blocks', () => {
    const doc = makeDoc([makeBlock('button', { href: 'https://x' })]);
    expect(altTextRule.check(doc)).toEqual([]);
  });
});
