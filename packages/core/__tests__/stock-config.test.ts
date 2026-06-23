import { describe, it, expect } from 'vitest';
import type { AssetManagerConfig, StockConfig } from '../src/index.js';

describe('StockConfig', () => {
  it('is accepted on AssetManagerConfig and carries provider keys', () => {
    const stock: StockConfig = {
      unsplash: { accessKey: 'u-key' },
      pexels: { apiKey: 'p-key' },
      appName: 'acme',
    };
    const config: AssetManagerConfig = { stock };
    expect(config.stock?.unsplash?.accessKey).toBe('u-key');
    expect(config.stock?.pexels?.apiKey).toBe('p-key');
    expect(config.stock?.appName).toBe('acme');
  });
});
