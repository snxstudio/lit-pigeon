import { describe, expect, it } from 'vitest';
import { unlayerToDocument } from '../src/index.js';

function designWithBackground(backgroundImage: unknown) {
  return {
    body: {
      rows: [{
        cells: [1],
        columns: [{ contents: [], values: {} }],
        values: { backgroundImage },
      }],
      values: {},
    },
    schemaVersion: 16,
  };
}

function importRow(backgroundImage: unknown) {
  const { document, warnings } = unlayerToDocument(designWithBackground(backgroundImage) as never);
  return { attributes: document.body.rows[0].attributes, warnings };
}

describe('unlayer row background image', () => {
  it('reads repeat as the CSS keyword newer designs use', () => {
    const { attributes } = importRow({ url: '/tile.png', repeat: 'repeat', size: 'auto' });

    expect(attributes.backgroundImage).toBe('/tile.png');
    expect(attributes.backgroundRepeat).toBe('repeat');
    expect(attributes.backgroundSize).toBe('auto');
  });

  it('reads repeat as the boolean older designs use', () => {
    // Unlayer shipped `repeat` as a boolean for years; both shapes are still
    // found in designs people export today.
    expect(importRow({ url: '/tile.png', repeat: true }).attributes.backgroundRepeat).toBe('repeat');
    expect(importRow({ url: '/tile.png', repeat: false }).attributes.backgroundRepeat).toBe('no-repeat');
  });

  it('takes the position from customPosition when it is set', () => {
    const { attributes } = importRow({ url: '/bg.png', customPosition: ['25%', '75%'] });

    expect(attributes.backgroundPosition).toBe('25% 75%');
  });

  it('falls back to the center flag when there is no customPosition', () => {
    expect(importRow({ url: '/bg.png', center: true }).attributes.backgroundPosition).toBe('center center');
    expect(importRow({ url: '/bg.png', center: false }).attributes.backgroundPosition).toBeUndefined();
  });

  it('warns when a single-axis repeat cannot be expressed', () => {
    const { attributes, warnings } = importRow({ url: '/tile.png', repeat: 'repeat-x' });

    expect(attributes.backgroundRepeat).toBe('repeat');
    expect(warnings.map(w => w.code)).toContain('background-repeat-clamped');
  });

  it('ignores a background object with no url', () => {
    const { attributes } = importRow({ repeat: 'repeat', size: 'cover' });

    expect(attributes.backgroundImage).toBeUndefined();
    expect(attributes.backgroundRepeat).toBeUndefined();
    expect(attributes.backgroundSize).toBeUndefined();
  });
});
