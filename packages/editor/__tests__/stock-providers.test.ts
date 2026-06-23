// packages/editor/__tests__/stock-providers.test.ts
import { describe, it, expect } from 'vitest';
import { createProviders } from '../src/components/asset-manager/stock/index.js';

describe('createProviders', () => {
  it('returns [] for undefined or empty config', () => {
    expect(createProviders(undefined)).toEqual([]);
    expect(createProviders({})).toEqual([]);
  });

  it('includes only configured providers, unsplash first', () => {
    expect(createProviders({ pexels: { apiKey: 'p' } }).map((p) => p.id)).toEqual(['pexels']);
    expect(createProviders({ unsplash: { accessKey: 'u' } }).map((p) => p.id)).toEqual(['unsplash']);
    expect(
      createProviders({ unsplash: { accessKey: 'u' }, pexels: { apiKey: 'p' } }).map((p) => p.id),
    ).toEqual(['unsplash', 'pexels']);
  });
});
