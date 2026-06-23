// packages/editor/__tests__/asset-manager-stock.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { AssetManagerConfig } from '@lit-pigeon/core';
import '../src/components/asset-manager/pigeon-asset-manager.js';
import type { PigeonAssetManager } from '../src/components/asset-manager/pigeon-asset-manager.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function mount(config: AssetManagerConfig): Promise<PigeonAssetManager> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-asset-manager .config=${config} ?open=${true}></pigeon-asset-manager>`, container);
  const el = container.querySelector('pigeon-asset-manager') as PigeonAssetManager;
  await el.updateComplete;
  return el;
}

function tabLabels(el: PigeonAssetManager): string[] {
  return Array.from(el.shadowRoot!.querySelectorAll('.tab')).map((b) => b.textContent!.trim());
}

afterEach(() => { document.body.innerHTML = ''; });

describe('asset-manager stock tab', () => {
  it('hides the Stock tab when no stock config is present', async () => {
    const el = await mount({ uploadHandler: async () => 'x' });
    expect(tabLabels(el)).not.toContain('Stock');
  });

  it('shows the Stock tab when a provider key is configured', async () => {
    const el = await mount({ stock: { unsplash: { accessKey: 'u' } } });
    expect(tabLabels(el)).toContain('Stock');
  });

  it('lazy-loads the stock tab and funnels stock-select to asset-selected, then closes', async () => {
    // Pre-import the chunk so loadStockTab()'s import() resolves from cache immediately.
    await import('../src/components/asset-manager/pigeon-stock-tab.js');

    const el = await mount({ stock: { unsplash: { accessKey: 'u' } } });
    let selectedUrl: string | undefined;
    el.addEventListener('asset-selected', (e) => {
      selectedUrl = (e as CustomEvent<{ url: string }>).detail.url;
    });

    const stockTabBtn = Array.from(el.shadowRoot!.querySelectorAll('.tab'))
      .find((b) => b.textContent!.trim() === 'Stock') as HTMLElement;
    stockTabBtn.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0)); // allow post-await flag set to settle
    await el.updateComplete;

    const stockTab = el.shadowRoot!.querySelector('pigeon-stock-tab')!;
    expect(stockTab).toBeTruthy();

    stockTab.dispatchEvent(
      new CustomEvent('stock-select', { detail: { url: 'r.jpg' }, bubbles: true, composed: true }),
    );
    await el.updateComplete;

    expect(selectedUrl).toBe('r.jpg');
    expect(el.open).toBe(false); // _selectAsset closes the modal
  });
});
