import { describe, it, expect } from 'vitest';
import { resolveDirection } from '../src/index.js';

describe('resolveDirection', () => {
  it('derives rtl from a right-to-left language subtag', () => {
    for (const lang of ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'dv', 'yi']) {
      expect(resolveDirection(lang)).toBe('rtl');
    }
  });

  it('derives ltr from everything else', () => {
    expect(resolveDirection('en')).toBe('ltr');
    expect(resolveDirection('pt-BR')).toBe('ltr');
    expect(resolveDirection('ja')).toBe('ltr');
  });

  it('reads the subtag out of a regional or underscored tag', () => {
    expect(resolveDirection('ar-EG')).toBe('rtl');
    expect(resolveDirection('AR-eg')).toBe('rtl');
    expect(resolveDirection('he_IL')).toBe('rtl');
  });

  it('lets an explicit override win', () => {
    expect(resolveDirection('ar', 'ltr')).toBe('ltr');
    expect(resolveDirection('en', 'rtl')).toBe('rtl');
  });

  it('defaults to ltr with no language', () => {
    expect(resolveDirection()).toBe('ltr');
    expect(resolveDirection('')).toBe('ltr');
  });
});
