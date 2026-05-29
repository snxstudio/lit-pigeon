import { describe, it, expect } from 'vitest';
import { contrastRule } from '../src/index.js';
import { makeBlock, makeDoc } from './helpers.js';

describe('contrastRule', () => {
  it('passes high-contrast buttons (black on white)', () => {
    const doc = makeDoc([
      makeBlock('button', { textColor: '#000000', backgroundColor: '#ffffff', fontSize: 16 }),
    ]);
    expect(contrastRule.check(doc)).toEqual([]);
  });

  it('flags low-contrast buttons (light gray on white)', () => {
    const doc = makeDoc([
      makeBlock('button', { textColor: '#cccccc', backgroundColor: '#ffffff', fontSize: 16 }),
    ]);
    const issues = contrastRule.check(doc);
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe('contrast/insufficient');
  });

  it('uses the 3:1 threshold for large bold text', () => {
    // Mid-gray on white is ~3.95:1 — fails 4.5:1 (small) but passes 3:1 (large bold).
    const doc = makeDoc([
      makeBlock('button', {
        textColor: '#888888',
        backgroundColor: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
      }),
    ]);
    expect(contrastRule.check(doc)).toEqual([]);
  });

  it('handles rgb() colors', () => {
    const doc = makeDoc([
      makeBlock('button', {
        textColor: 'rgb(255,255,255)',
        backgroundColor: 'rgb(0,0,0)',
        fontSize: 16,
      }),
    ]);
    expect(contrastRule.check(doc)).toEqual([]);
  });

  it('skips buttons with unparseable colors', () => {
    const doc = makeDoc([
      makeBlock('button', { textColor: 'red', backgroundColor: '#fff', fontSize: 16 }),
    ]);
    expect(contrastRule.check(doc)).toEqual([]);
  });
});
