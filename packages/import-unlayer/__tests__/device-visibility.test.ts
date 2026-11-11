import { describe, expect, it } from 'vitest';
import { unlayerToDocument } from '../src/index.js';

const text = { type: 'text', values: { text: '<p>Hi</p>' } };

function design(rowValues: Record<string, unknown>, columnValues: Record<string, unknown> = {}, contentValues: Record<string, unknown> = {}) {
  return {
    body: {
      rows: [
        {
          cells: [1],
          columns: [{ contents: [{ ...text, values: { ...text.values, ...contentValues } }], values: columnValues }],
          values: rowValues,
        },
      ],
      values: {},
    },
    schemaVersion: 16,
  };
}

function firstRow(d: ReturnType<typeof design>) {
  return unlayerToDocument(d as never).document.body.rows[0];
}

describe('Unlayer device visibility', () => {
  it('maps hideDesktop on a row, column and block', () => {
    const row = firstRow(design({ hideDesktop: true }, { hideDesktop: true }, { hideDesktop: true }));
    expect(row.attributes).toMatchObject({ hideOnDesktop: true });
    expect(row.columns[0].attributes).toMatchObject({ hideOnDesktop: true });
    expect(row.columns[0].blocks[0].values).toMatchObject({ hideOnDesktop: true });
  });

  it('reads hide-on-mobile out of the _override.mobile block', () => {
    const override = { _override: { mobile: { hideMobile: true } } };
    const row = firstRow(design(override, override, override));
    expect(row.attributes).toMatchObject({ hideOnMobile: true });
    expect(row.columns[0].attributes).toMatchObject({ hideOnMobile: true });
    expect(row.columns[0].blocks[0].values).toMatchObject({ hideOnMobile: true });
  });

  it('also accepts a top-level hideMobile, as older exports write it', () => {
    expect(firstRow(design({ hideMobile: true })).attributes).toMatchObject({ hideOnMobile: true });
  });

  it('carries both flags at once', () => {
    const row = firstRow(design({ hideDesktop: true, _override: { mobile: { hideMobile: true } } }));
    expect(row.attributes).toMatchObject({ hideOnMobile: true, hideOnDesktop: true });
  });

  it('adds no visibility fields when the design sets none', () => {
    const row = firstRow(design({}, {}, {}));
    expect(row.attributes).not.toHaveProperty('hideOnMobile');
    expect(row.attributes).not.toHaveProperty('hideOnDesktop');
    expect(row.columns[0].attributes).not.toHaveProperty('hideOnMobile');
    expect(row.columns[0].blocks[0].values).not.toHaveProperty('hideOnDesktop');
  });

  it('ignores a falsy or non-boolean flag rather than treating it as set', () => {
    for (const value of [false, 'true', 1, null]) {
      const row = firstRow(design({ hideDesktop: value, _override: { mobile: { hideMobile: value } } }));
      expect(row.attributes).not.toHaveProperty('hideOnDesktop');
      expect(row.attributes).not.toHaveProperty('hideOnMobile');
    }
  });

  it('survives an _override that is not an object', () => {
    expect(() => firstRow(design({ _override: 'mobile' }))).not.toThrow();
    expect(firstRow(design({ _override: 'mobile' })).attributes).not.toHaveProperty('hideOnMobile');
  });
});
