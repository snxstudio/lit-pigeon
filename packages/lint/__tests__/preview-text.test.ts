import { describe, it, expect } from 'vitest';
import { previewTextRule } from '../src/index.js';
import { makeDoc } from './helpers.js';

describe('previewTextRule', () => {
  it('warns when no preview text is set', () => {
    const doc = makeDoc([]);
    const issues = previewTextRule.check(doc);
    expect(issues.find((i) => i.rule === 'preview-text/missing')).toBeDefined();
  });

  it('passes a comfortable-length preview', () => {
    const doc = makeDoc([], {
      name: 'Hello',
      previewText: 'A reasonably long previewText that lands in the inbox snippet area.',
    });
    expect(previewTextRule.check(doc).filter((i) => i.rule.startsWith('preview-text/'))).toEqual([]);
  });

  it('emits an info issue for too-short preview', () => {
    const doc = makeDoc([], { name: 'Hello', previewText: 'Too short' });
    const issues = previewTextRule.check(doc);
    expect(issues.find((i) => i.rule === 'preview-text/too-short')).toBeDefined();
  });

  it('emits an info issue for too-long preview', () => {
    const doc = makeDoc([], { name: 'Hello', previewText: 'a'.repeat(120) });
    const issues = previewTextRule.check(doc);
    expect(issues.find((i) => i.rule === 'preview-text/too-long')).toBeDefined();
  });

  it('errors when subject is empty', () => {
    const doc = makeDoc([], { name: '', previewText: 'A reasonable previewText that fills the inbox snippet.' });
    const issues = previewTextRule.check(doc);
    expect(issues.find((i) => i.rule === 'preview-text/missing-subject')?.severity).toBe('error');
  });
});
