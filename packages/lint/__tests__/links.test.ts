import { describe, it, expect } from 'vitest';
import { linksRule } from '../src/index.js';
import { makeBlock, makeDoc } from './helpers.js';

describe('linksRule', () => {
  it('flags javascript: URLs as errors', () => {
    const doc = makeDoc([makeBlock('button', { href: 'javascript:alert(1)' })]);
    const issues = linksRule.check(doc);
    expect(issues[0].rule).toBe('links/javascript-protocol');
    expect(issues[0].severity).toBe('error');
  });

  it('warns on placeholder "#" hrefs', () => {
    const doc = makeDoc([makeBlock('button', { href: '#' })]);
    expect(linksRule.check(doc)[0].rule).toBe('links/placeholder');
  });

  it('flags missing protocol', () => {
    const doc = makeDoc([makeBlock('button', { href: 'example.com/page' })]);
    expect(linksRule.check(doc)[0].rule).toBe('links/no-scheme');
  });

  it('accepts https/mailto/tel/anchor links', () => {
    const doc = makeDoc([
      makeBlock('button', { href: 'https://example.com' }),
      makeBlock('button', { href: 'mailto:hi@x.io' }),
      makeBlock('button', { href: 'tel:+15551234' }),
      makeBlock('button', { href: '#footer' }),
    ]);
    expect(linksRule.check(doc)).toEqual([]);
  });

  it('accepts merge-tag-driven hrefs', () => {
    const doc = makeDoc([makeBlock('button', { href: '{{unsubscribe_url}}' })]);
    expect(linksRule.check(doc)).toEqual([]);
  });
});
