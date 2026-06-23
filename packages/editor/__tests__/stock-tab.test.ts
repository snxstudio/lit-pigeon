// packages/editor/__tests__/stock-tab.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { html, render } from 'lit';
import type { StockConfig } from '@lit-pigeon/core';
import '../src/components/asset-manager/pigeon-stock-tab.js';
import type { PigeonStockTab } from '../src/components/asset-manager/pigeon-stock-tab.js';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}
const flush = () => new Promise((r) => setTimeout(r, 0));

const UNSPLASH_BODY = {
  total: 1, total_pages: 1,
  results: [{
    id: 'abc', alt_description: 'a cat', description: null, width: 4000, height: 3000,
    urls: { thumb: 't.jpg', small: 's.jpg', regular: 'r.jpg', full: 'f.jpg' },
    links: { html: 'https://unsplash.com/photos/abc', download_location: 'https://api.unsplash.com/photos/abc/download' },
    user: { name: 'Ada', links: { html: 'https://unsplash.com/@ada' } },
  }],
};

async function mount(config: StockConfig): Promise<PigeonStockTab> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(html`<pigeon-stock-tab .config=${config}></pigeon-stock-tab>`, container);
  const el = container.querySelector('pigeon-stock-tab') as PigeonStockTab;
  await el.updateComplete;
  return el;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('pigeon-stock-tab', () => {
  it('shows the idle hint before any search', async () => {
    const el = await mount({ unsplash: { accessKey: 'u' } });
    expect(el.shadowRoot!.querySelector('.stock-idle')).toBeTruthy();
    expect(el.shadowRoot!.querySelector('.asset-grid')).toBeFalsy();
  });

  it('searches on input and renders results with attribution', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(UNSPLASH_BODY));
    const el = await mount({ unsplash: { accessKey: 'u' }, appName: 'acme' });

    const input = el.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'cats';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300)); // past the 250ms debounce
    await el.updateComplete;
    await flush();
    await el.updateComplete;

    const cards = el.shadowRoot!.querySelectorAll('.asset-card');
    expect(cards.length).toBe(1);
    const credit = el.shadowRoot!.querySelector('.stock-credit')!.textContent!;
    expect(credit).toContain('Ada');
    expect(credit).toContain('Unsplash');
  });

  it('dispatches stock-select with the fullUrl and fires trackDownload on pick', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(UNSPLASH_BODY));
    const el = await mount({ unsplash: { accessKey: 'u' } });
    let picked: string | undefined;
    el.addEventListener('stock-select', (e) => { picked = (e as CustomEvent<{ url: string }>).detail.url; });

    const input = el.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'cats';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    await el.updateComplete;
    await flush();
    await el.updateComplete;

    (el.shadowRoot!.querySelector('.asset-card') as HTMLElement).click();
    await flush();

    expect(picked).toBe('r.jpg');
    // the most recent fetch call hit the download_location (the ping)
    const urls = fetchSpy.mock.calls.map((c) => String(c[0]));
    expect(urls).toContain('https://api.unsplash.com/photos/abc/download');
  });

  it('shows a rate-limit message on 429', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 429));
    const el = await mount({ unsplash: { accessKey: 'u' } });
    const input = el.shadowRoot!.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = 'cats';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    await el.updateComplete;
    await flush();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.error')!.textContent).toContain('Rate limit');
  });

  it('renders the provider switcher only when two providers are configured', async () => {
    const one = await mount({ unsplash: { accessKey: 'u' } });
    expect(one.shadowRoot!.querySelector('.provider-switch')).toBeFalsy();
    const two = await mount({ unsplash: { accessKey: 'u' }, pexels: { apiKey: 'p' } });
    expect(two.shadowRoot!.querySelectorAll('.provider-btn').length).toBe(2);
  });
});
