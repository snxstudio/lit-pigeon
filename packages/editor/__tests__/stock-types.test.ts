import { describe, it, expect } from 'vitest';
import { StockError, STOCK_PER_PAGE } from '../src/components/asset-manager/stock/types.js';

describe('stock types', () => {
  it('STOCK_PER_PAGE is 24', () => {
    expect(STOCK_PER_PAGE).toBe(24);
  });

  it('StockError carries the HTTP status', () => {
    const err = new StockError(429);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(429);
  });
});
