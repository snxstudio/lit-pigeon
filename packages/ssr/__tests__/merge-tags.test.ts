import { describe, it, expect } from 'vitest';
import { applyMergeTags, extractMergeTags } from '../src/index.js';

describe('applyMergeTags', () => {
  it('replaces simple placeholders', () => {
    expect(applyMergeTags('Hi {{name}}', { name: 'Sam' })).toBe('Hi Sam');
  });

  it('handles whitespace inside the braces', () => {
    expect(applyMergeTags('Hi {{  name  }}', { name: 'Sam' })).toBe('Hi Sam');
  });

  it('resolves dotted paths against nested values', () => {
    expect(applyMergeTags('{{user.name}}', { user: { name: 'Sam' } })).toBe('Sam');
  });

  it('coerces numbers and booleans', () => {
    expect(applyMergeTags('count={{n}}, ok={{ok}}', { n: 42, ok: true })).toBe('count=42, ok=true');
  });

  it('leaves unknown placeholders intact when no fallback supplied', () => {
    expect(applyMergeTags('Hi {{name}}!', {})).toBe('Hi {{name}}!');
  });

  it('uses fallback when one is supplied', () => {
    expect(applyMergeTags('Hi {{name}}!', {}, { fallback: 'friend' })).toBe('Hi friend!');
  });

  it('escapes HTML in replacements by default', () => {
    expect(applyMergeTags('Hi {{name}}', { name: '<script>x</script>' })).toBe(
      'Hi &lt;script&gt;x&lt;/script&gt;',
    );
  });

  it('skips escaping when escape:false', () => {
    expect(
      applyMergeTags('Hi {{name}}', { name: '<b>x</b>' }, { escape: false }),
    ).toBe('Hi <b>x</b>');
  });

  it('returns "" for null/undefined values without breaking the string', () => {
    expect(applyMergeTags('[{{a}}]', { a: null })).toBe('[]');
  });
});

describe('extractMergeTags', () => {
  it('returns distinct, sorted tag names', () => {
    expect(extractMergeTags('{{b}} {{a}} {{a}} text {{user.name}}')).toEqual([
      'a',
      'b',
      'user.name',
    ]);
  });

  it('returns [] when there are no placeholders', () => {
    expect(extractMergeTags('plain text')).toEqual([]);
  });
});
