import { describe, expect, it } from 'vitest';
import { createRow, resolveRowBackground } from '../src/index.js';

describe('resolveRowBackground', () => {
  it('returns undefined when the row has no background image', () => {
    expect(resolveRowBackground(createRow())).toBeUndefined();
  });

  it('resolves each attribute the row sets', () => {
    const row = createRow();
    Object.assign(row.attributes, {
      backgroundImage: '/bg.png',
      backgroundRepeat: 'repeat' as const,
      backgroundSize: 'contain',
      backgroundPosition: 'bottom right',
    });

    expect(resolveRowBackground(row)).toEqual({
      url: '/bg.png',
      repeat: 'repeat',
      size: 'contain',
      position: 'bottom right',
    });
  });

  it('fills the pre-attribute meaning in for each field left unset', () => {
    const row = createRow();
    row.attributes.backgroundImage = '/bg.png';

    expect(resolveRowBackground(row)).toEqual({
      url: '/bg.png',
      repeat: 'no-repeat',
      size: 'cover',
      position: 'top center',
    });
  });
});
