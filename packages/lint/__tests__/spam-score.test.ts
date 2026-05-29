import { describe, it, expect } from 'vitest';
import { spamScoreRule } from '../src/index.js';
import { makeBlock, makeDoc } from './helpers.js';

describe('spamScoreRule', () => {
  it('flags all-caps subjects', () => {
    const doc = makeDoc([], { name: 'BUY NOW BUY MORE', previewText: 'x' });
    const ids = spamScoreRule.check(doc).map((i) => i.rule);
    expect(ids).toContain('spam-score/all-caps-subject');
  });

  it('flags excessive exclamation marks', () => {
    const doc = makeDoc([], { name: 'Hi!!! buy!!!', previewText: 'x' });
    expect(spamScoreRule.check(doc).some((i) => i.rule === 'spam-score/excessive-exclamation')).toBe(true);
  });

  it('flags spam phrases in the subject', () => {
    const doc = makeDoc([], { name: 'You have been selected', previewText: 'x' });
    expect(spamScoreRule.check(doc).some((i) => i.rule === 'spam-score/spam-phrase')).toBe(true);
  });

  it('flags $$$ runs', () => {
    const doc = makeDoc([], { name: 'Save $$$', previewText: 'x' });
    expect(spamScoreRule.check(doc).some((i) => i.rule === 'spam-score/dollar-runs')).toBe(true);
  });

  it('passes a normal newsletter subject', () => {
    const doc = makeDoc([], { name: "This week's updates", previewText: 'x' });
    expect(spamScoreRule.check(doc)).toEqual([]);
  });

  it('flags body text that hits multiple spam phrases', () => {
    const doc = makeDoc([
      makeBlock('text', {
        content: '<p>Act now and click here to win a free gift, while supplies last!</p>',
      }),
    ]);
    expect(spamScoreRule.check(doc).some((i) => i.rule === 'spam-score/spam-phrases-body')).toBe(true);
  });
});
