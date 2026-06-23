// packages/editor/src/components/asset-manager/stock/index.ts
import type { StockConfig } from '@lit-pigeon/core';
import type { StockProvider } from './types.js';
import { createUnsplashProvider } from './unsplash.js';
import { createPexelsProvider } from './pexels.js';

export * from './types.js';

/** Build provider adapters from config, in [unsplash, pexels] order. */
export function createProviders(config: StockConfig | undefined): StockProvider[] {
  if (!config) return [];
  const appName = config.appName || 'lit-pigeon';
  const providers: StockProvider[] = [];
  if (config.unsplash?.accessKey) {
    providers.push(createUnsplashProvider(config.unsplash.accessKey, appName));
  }
  if (config.pexels?.apiKey) {
    providers.push(createPexelsProvider(config.pexels.apiKey));
  }
  return providers;
}
