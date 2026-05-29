import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import type {
  Asset,
  AssetListFilter,
  AssetStorage,
} from '@lit-pigeon/core';
import '../src/components/asset-manager/pigeon-asset-manager.js';
import type { PigeonAssetManager } from '../src/components/asset-manager/pigeon-asset-manager.js';

function makeAsset(id: string, overrides: Partial<Asset> = {}): Asset {
  const now = '2026-05-29T00:00:00.000Z';
  return {
    id,
    name: id,
    src: `https://cdn.example/${id}.png`,
    folder: '/',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeStorage(initialAssets: Asset[] = []): {
  storage: AssetStorage;
  listCalls: AssetListFilter[];
  listSpy: ReturnType<typeof vi.fn>;
} {
  const assets = [...initialAssets];
  const listCalls: AssetListFilter[] = [];
  const list = vi.fn(async (filter?: AssetListFilter): Promise<Asset[]> => {
    listCalls.push(filter ?? {});
    let result = assets;
    if (filter?.folder) result = result.filter((a) => a.folder === filter.folder);
    if (filter?.tags && filter.tags.length > 0) {
      result = result.filter((a) =>
        filter.tags!.every((t) => (a.tags ?? []).includes(t)),
      );
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.alt ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  });
  const storage: AssetStorage = {
    list,
    get: async (id) => assets.find((a) => a.id === id) ?? null,
    save: async (asset) => {
      const idx = assets.findIndex((a) => a.id === asset.id);
      if (idx >= 0) assets[idx] = asset;
      else assets.push(asset);
    },
    delete: async (id) => {
      const idx = assets.findIndex((a) => a.id === id);
      if (idx >= 0) assets.splice(idx, 1);
    },
    listFolders: async () => Array.from(new Set(assets.map((a) => a.folder ?? '/'))),
  };
  return { storage, listCalls, listSpy: list };
}

async function mount(
  storage: AssetStorage | undefined,
  open = true,
): Promise<PigeonAssetManager> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-asset-manager
      .config=${{}}
      .storage=${storage}
      ?open=${open}
    ></pigeon-asset-manager>`,
    container,
  );
  const el = container.querySelector('pigeon-asset-manager') as PigeonAssetManager;
  await el.updateComplete;
  // Allow the initial _loadAssets()/_loadFolders() promise to resolve.
  await new Promise((r) => setTimeout(r, 0));
  await el.updateComplete;
  return el;
}

describe('pigeon-asset-manager — library mode', () => {
  let selected: CustomEvent<{ url: string; asset?: Asset }>[] = [];
  const handler = (e: Event) => {
    selected.push(e as CustomEvent<{ url: string; asset?: Asset }>);
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    selected = [];
    document.addEventListener('asset-selected', handler);
  });

  afterEach(() => {
    document.removeEventListener('asset-selected', handler);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    // Guard against a test failing before it could restore real timers — left
    // fake timers cause the next test's setTimeout-based flush to hang.
    vi.useRealTimers();
  });

  it('hides tabs and shows upload UI when no storage is set', async () => {
    const el = await mount(undefined);
    expect(el.shadowRoot!.querySelector('.tabs')).toBeNull();
    expect(el.shadowRoot!.querySelector('.drop-zone')).not.toBeNull();
  });

  it('shows tabs and defaults to library when storage is set', async () => {
    const { storage } = makeStorage([makeAsset('one')]);
    const el = await mount(storage);
    const tabs = el.shadowRoot!.querySelectorAll('.tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent?.trim()).toBe('Library');
    expect(tabs[0].classList.contains('active')).toBe(true);
    expect(el.shadowRoot!.querySelector('.asset-grid')).not.toBeNull();
  });

  it('renders one card per asset and emits the asset on click', async () => {
    const a = makeAsset('a', { name: 'logo' });
    const b = makeAsset('b', { name: 'hero' });
    const { storage } = makeStorage([a, b]);
    const el = await mount(storage);

    const cards = el.shadowRoot!.querySelectorAll('.asset-card');
    expect(cards).toHaveLength(2);

    (cards[1] as HTMLButtonElement).click();
    await el.updateComplete;

    expect(selected).toHaveLength(1);
    expect(selected[0].detail.url).toBe(b.src);
    expect(selected[0].detail.asset?.id).toBe('b');
    expect(el.open).toBe(false);
  });

  it('shows the empty-library hint when storage has nothing', async () => {
    const { storage } = makeStorage([]);
    const el = await mount(storage);
    expect(el.shadowRoot!.querySelector('.empty-library')?.textContent).toMatch(
      /no saved assets/i,
    );
  });

  it('re-queries with a folder filter when the dropdown changes', async () => {
    const a = makeAsset('a', { folder: '/marketing' });
    const b = makeAsset('b', { folder: '/transactional' });
    const { storage, listCalls } = makeStorage([a, b]);
    const el = await mount(storage);

    const select = el.shadowRoot!.querySelector('select') as HTMLSelectElement;
    select.value = '/marketing';
    select.dispatchEvent(new Event('change'));
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    expect(listCalls.at(-1)?.folder).toBe('/marketing');
    const cards = el.shadowRoot!.querySelectorAll('.asset-card');
    expect(cards).toHaveLength(1);
  });

  it('re-queries with a search filter after debounce', async () => {
    const a = makeAsset('a', { name: 'red-hero' });
    const b = makeAsset('b', { name: 'blue-hero' });
    const { storage, listCalls } = makeStorage([a, b]);
    const el = await mount(storage);

    // Install fake timers *after* mount so its real-timer microtask flush ran.
    vi.useFakeTimers();
    const search = el.shadowRoot!.querySelector('input[type=search]') as HTMLInputElement;
    search.value = 'red';
    search.dispatchEvent(new Event('input'));
    expect(listCalls.at(-1)?.search).toBeUndefined();

    await vi.advanceTimersByTimeAsync(260);
    vi.useRealTimers();
    await el.updateComplete;
    expect(listCalls.at(-1)?.search).toBe('red');
  });

  it('toggles tag filters via tag chips', async () => {
    const a = makeAsset('a', { tags: ['logo', 'brand'] });
    const b = makeAsset('b', { tags: ['hero'] });
    const { storage, listCalls } = makeStorage([a, b]);
    const el = await mount(storage);

    const chips = el.shadowRoot!.querySelectorAll('.tag-chip') as NodeListOf<HTMLButtonElement>;
    const logoChip = Array.from(chips).find((c) => c.textContent?.trim() === 'logo')!;
    logoChip.click();
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await el.updateComplete;

    expect(listCalls.at(-1)?.tags).toEqual(['logo']);
    expect(el.shadowRoot!.querySelectorAll('.asset-card')).toHaveLength(1);
  });

  it('switches to upload tab when the upload tab button is clicked', async () => {
    const { storage } = makeStorage([makeAsset('a')]);
    const el = await mount(storage);

    const uploadTab = el.shadowRoot!.querySelectorAll('.tab')[1] as HTMLButtonElement;
    uploadTab.click();
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('.drop-zone')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.asset-grid')).toBeNull();
  });

  it('surfaces a storage error as a visible message', async () => {
    const failingStorage: AssetStorage = {
      list: vi.fn().mockRejectedValue(new Error('db unreachable')),
      get: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      listFolders: vi.fn().mockResolvedValue([]),
    };
    const el = await mount(failingStorage);
    expect(el.shadowRoot!.querySelector('.error')?.textContent).toMatch(/db unreachable/);
  });
});
