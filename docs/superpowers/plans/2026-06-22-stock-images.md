# Stock Image Integration (Unsplash / Pexels) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third "Stock" tab to the editor's asset manager that searches Unsplash and Pexels directly from the browser and inserts a picked photo by its hotlinked URL.

**Architecture:** Provider-specific API calls live behind a tiny `StockProvider` adapter interface (one adapter per provider). A new `pigeon-stock-tab` Lit component renders the search UI and is lazy-loaded by `pigeon-asset-manager` the first time the Stock tab is opened (same cached-`import()` pattern the palette uses for brand/saved tabs), so it stays out of the 48 kB core bundle. Picks funnel through the manager's existing `_selectAsset(url)`.

**Tech Stack:** TypeScript (strict, ESM, `moduleResolution: bundler`), Lit 3 web components, Vitest + happy-dom, pnpm workspaces, changesets, size-limit.

## Global Constraints

- Node `>=18`; package manager pnpm; TypeScript `strict`. Every `.ts` import uses an explicit `.js` extension.
- All new user-facing strings go through `t()` from `../../i18n/index.js`. **`t()` does NOT interpolate** — it is a plain key→string lookup; compose dynamic text (names, queries) in the template, not inside a message.
- Editor core size budget stays at **48 kB** gzip; `pigeon-stock-tab.js` must be a lazy chunk listed in `.size-limit.json`'s `ignore` array so it does not count.
- Unsplash requires hotlinking the returned URL (no re-hosting) and firing its `download_location` endpoint on use; both providers require visible photographer + provider attribution.
- Tests mock network with `vi.spyOn(globalThis, 'fetch').mockResolvedValue(...)`. Mount components with `render(html\`...\`, container)` then `await el.updateComplete`.
- Commits: conventional-commit messages. **Do NOT add a `Co-Authored-By: Claude` trailer** (project rule).
- `STOCK_PER_PAGE = 24`.

---

### Task 1: Core config types (`StockConfig` + `AssetManagerConfig.stock`)

**Files:**
- Modify: `packages/core/src/types/editor.ts` (add `StockConfig`, extend `AssetManagerConfig`)
- Modify: `packages/core/src/index.ts:29-45` (add `StockConfig` to the editor-types export block)
- Test: `packages/core/__tests__/stock-config.test.ts`

**Interfaces:**
- Produces: `StockConfig { unsplash?: { accessKey: string }; pexels?: { apiKey: string }; appName?: string }`; `AssetManagerConfig.stock?: StockConfig`. Both re-exported from `@lit-pigeon/core`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/core/__tests__/stock-config.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lit-pigeon/core exec vitest run __tests__/stock-config.test.ts`
Expected: FAIL — `StockConfig` is not exported / `stock` not on `AssetManagerConfig` (type error at build, test run errors).

- [ ] **Step 3: Add the type and extend `AssetManagerConfig`**

In `packages/core/src/types/editor.ts`, add above `AssetManagerConfig`:

```ts
export interface StockConfig {
  /** Unsplash Access Key (used client-side). Enables the Unsplash source. */
  unsplash?: { accessKey: string };
  /** Pexels API key (used client-side). Enables the Pexels source. */
  pexels?: { apiKey: string };
  /**
   * utm_source label for Unsplash attribution links and the download-ping
   * request. Unsplash guidelines require identifying your application.
   * Defaults to "lit-pigeon" when unset; hosts should override.
   */
  appName?: string;
}
```

Then add one line inside `AssetManagerConfig`:

```ts
  presignedUpload?: {
    getUploadParams: (file: File) => Promise<PresignedUploadParams>;
  };
  stock?: StockConfig;
}
```

- [ ] **Step 4: Export `StockConfig` from the core barrel**

In `packages/core/src/index.ts`, add `StockConfig,` to the existing export block that ends at `} from './types/editor.js';` (alongside `AssetManagerConfig`):

```ts
  AssetManagerConfig,
  StockConfig,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @lit-pigeon/core exec vitest run __tests__/stock-config.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types/editor.ts packages/core/src/index.ts packages/core/__tests__/stock-config.test.ts
git commit -m "feat(core): StockConfig type + AssetManagerConfig.stock (#28)"
```

---

### Task 2: Stock provider interfaces (`stock/types.ts`)

**Files:**
- Create: `packages/editor/src/components/asset-manager/stock/types.ts`
- Test: `packages/editor/__tests__/stock-types.test.ts`

**Interfaces:**
- Produces: `StockPhoto`, `StockSearchResult`, `StockProvider`, `StockError` (carries `status: number`), `STOCK_PER_PAGE = 24`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/stock-types.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-types.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `stock/types.ts`**

```ts
// packages/editor/src/components/asset-manager/stock/types.ts
export const STOCK_PER_PAGE = 24;

export type StockProviderId = 'unsplash' | 'pexels';

export interface StockPhoto {
  /** Namespaced id, e.g. "unsplash:abc123". */
  id: string;
  provider: StockProviderId;
  /** Small image URL for the result grid. */
  thumbUrl: string;
  /** Hotlinked URL inserted into the email. */
  fullUrl: string;
  width: number;
  height: number;
  /** Description / alt from the provider (may be empty). */
  alt: string;
  photographerName: string;
  /** UTM-tagged where the provider requires it. */
  photographerUrl: string;
  /** Link to the photo on the provider site (UTM-tagged for Unsplash). */
  providerUrl: string;
  /** Unsplash only: links.download_location, used by trackDownload. */
  downloadLocation?: string;
}

export interface StockSearchResult {
  photos: StockPhoto[];
  page: number;
  hasMore: boolean;
}

export interface StockProvider {
  readonly id: StockProviderId;
  readonly label: string;
  search(query: string, page: number): Promise<StockSearchResult>;
  /** Unsplash: GET download_location. Pexels: resolved no-op. */
  trackDownload(photo: StockPhoto): Promise<void>;
}

/** Thrown by adapters on a non-OK HTTP response; carries the status code. */
export class StockError extends Error {
  constructor(public readonly status: number) {
    super(`Stock request failed: ${status}`);
    this.name = 'StockError';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/asset-manager/stock/types.ts packages/editor/__tests__/stock-types.test.ts
git commit -m "feat(editor): StockProvider interface + StockPhoto/StockError (#28)"
```

---

### Task 3: Unsplash adapter (`stock/unsplash.ts`)

**Files:**
- Create: `packages/editor/src/components/asset-manager/stock/unsplash.ts`
- Test: `packages/editor/__tests__/stock-unsplash.test.ts`

**Interfaces:**
- Consumes: `StockProvider`, `StockPhoto`, `StockSearchResult`, `StockError`, `STOCK_PER_PAGE` from `./types.js`.
- Produces: `createUnsplashProvider(accessKey: string, appName: string): StockProvider`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/stock-unsplash.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createUnsplashProvider } from '../src/components/asset-manager/stock/unsplash.js';
import { StockError } from '../src/components/asset-manager/stock/types.js';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

const SAMPLE = {
  total: 100,
  total_pages: 5,
  results: [
    {
      id: 'abc',
      alt_description: 'a cat',
      description: null,
      width: 4000,
      height: 3000,
      urls: { thumb: 't.jpg', small: 's.jpg', regular: 'r.jpg', full: 'f.jpg' },
      links: { html: 'https://unsplash.com/photos/abc', download_location: 'https://api.unsplash.com/photos/abc/download' },
      user: { name: 'Ada', links: { html: 'https://unsplash.com/@ada' } },
    },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe('unsplash adapter', () => {
  it('searches the correct endpoint with Client-ID auth and maps results', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SAMPLE));
    const provider = createUnsplashProvider('KEY', 'acme');

    const result = await provider.search('cats', 2);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://api.unsplash.com/search/photos?query=cats&page=2&per_page=24');
    expect((init as RequestInit).headers).toEqual({ Authorization: 'Client-ID KEY' });

    const photo = result.photos[0];
    expect(photo.id).toBe('unsplash:abc');
    expect(photo.provider).toBe('unsplash');
    expect(photo.thumbUrl).toBe('s.jpg');
    expect(photo.fullUrl).toBe('r.jpg');
    expect(photo.alt).toBe('a cat');
    expect(photo.photographerName).toBe('Ada');
    expect(photo.photographerUrl).toBe('https://unsplash.com/@ada?utm_source=acme&utm_medium=referral');
    expect(photo.providerUrl).toBe('https://unsplash.com/photos/abc?utm_source=acme&utm_medium=referral');
    expect(photo.downloadLocation).toBe('https://api.unsplash.com/photos/abc/download');
    expect(result.hasMore).toBe(true); // page 2 < total_pages 5
  });

  it('falls back to description for alt and reports hasMore false on the last page', async () => {
    const body = { total: 1, total_pages: 5, results: [{ ...SAMPLE.results[0], alt_description: null, description: 'desc' }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(body));
    const provider = createUnsplashProvider('KEY', 'acme');
    const result = await provider.search('x', 5);
    expect(result.photos[0].alt).toBe('desc');
    expect(result.hasMore).toBe(false);
  });

  it('throws StockError with the status on a non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 429));
    const provider = createUnsplashProvider('KEY', 'acme');
    await expect(provider.search('x', 1)).rejects.toMatchObject({ status: 429 });
    await expect(provider.search('x', 1)).rejects.toBeInstanceOf(StockError);
  });

  it('trackDownload GETs the download_location with auth, swallowing errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}));
    const provider = createUnsplashProvider('KEY', 'acme');
    await provider.trackDownload({
      id: 'unsplash:abc', provider: 'unsplash', thumbUrl: '', fullUrl: '', width: 0, height: 0,
      alt: '', photographerName: '', photographerUrl: '', providerUrl: '',
      downloadLocation: 'https://api.unsplash.com/photos/abc/download',
    });
    expect(String(fetchSpy.mock.calls[0][0])).toBe('https://api.unsplash.com/photos/abc/download');
    expect((fetchSpy.mock.calls[0][1] as RequestInit).headers).toEqual({ Authorization: 'Client-ID KEY' });

    fetchSpy.mockRejectedValueOnce(new Error('network'));
    await expect(provider.trackDownload({ ...({} as any), downloadLocation: 'x' })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-unsplash.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `stock/unsplash.ts`**

```ts
// packages/editor/src/components/asset-manager/stock/unsplash.ts
import type { StockPhoto, StockProvider, StockSearchResult } from './types.js';
import { STOCK_PER_PAGE, StockError } from './types.js';

interface UnsplashResult {
  id: string;
  alt_description: string | null;
  description: string | null;
  width: number;
  height: number;
  urls: { thumb: string; small: string; regular: string; full: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}
interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashResult[];
}

export function createUnsplashProvider(accessKey: string, appName: string): StockProvider {
  const auth = { Authorization: `Client-ID ${accessKey}` };
  const utm = `utm_source=${encodeURIComponent(appName)}&utm_medium=referral`;
  const withUtm = (url: string) => url + (url.includes('?') ? '&' : '?') + utm;

  return {
    id: 'unsplash',
    label: 'Unsplash',
    async search(query: string, page: number): Promise<StockSearchResult> {
      const url =
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
        `&page=${page}&per_page=${STOCK_PER_PAGE}`;
      const res = await fetch(url, { headers: auth });
      if (!res.ok) throw new StockError(res.status);
      const data = (await res.json()) as UnsplashSearchResponse;
      const photos: StockPhoto[] = data.results.map((r) => ({
        id: `unsplash:${r.id}`,
        provider: 'unsplash',
        thumbUrl: r.urls.small,
        fullUrl: r.urls.regular,
        width: r.width,
        height: r.height,
        alt: r.alt_description ?? r.description ?? '',
        photographerName: r.user.name,
        photographerUrl: withUtm(r.user.links.html),
        providerUrl: withUtm(r.links.html),
        downloadLocation: r.links.download_location,
      }));
      return { photos, page, hasMore: page < data.total_pages };
    },
    async trackDownload(photo: StockPhoto): Promise<void> {
      if (!photo.downloadLocation) return;
      try {
        await fetch(photo.downloadLocation, { headers: auth });
      } catch {
        // Best-effort ping; failure must never block insertion.
      }
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-unsplash.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/asset-manager/stock/unsplash.ts packages/editor/__tests__/stock-unsplash.test.ts
git commit -m "feat(editor): Unsplash stock adapter + download ping (#28)"
```

---

### Task 4: Pexels adapter (`stock/pexels.ts`)

**Files:**
- Create: `packages/editor/src/components/asset-manager/stock/pexels.ts`
- Test: `packages/editor/__tests__/stock-pexels.test.ts`

**Interfaces:**
- Consumes: `StockProvider`, `StockPhoto`, `StockSearchResult`, `StockError`, `STOCK_PER_PAGE` from `./types.js`.
- Produces: `createPexelsProvider(apiKey: string): StockProvider`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/editor/__tests__/stock-pexels.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPexelsProvider } from '../src/components/asset-manager/stock/pexels.js';

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

const SAMPLE = {
  next_page: 'https://api.pexels.com/v1/search?page=3',
  photos: [
    {
      id: 123,
      width: 2000,
      height: 1500,
      url: 'https://www.pexels.com/photo/123/',
      photographer: 'Bo',
      photographer_url: 'https://www.pexels.com/@bo',
      alt: 'a dog',
      src: { tiny: 'ti.jpg', medium: 'm.jpg', large: 'l.jpg', large2x: 'l2.jpg', original: 'o.jpg' },
    },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe('pexels adapter', () => {
  it('searches the correct endpoint with bare-key auth and maps results', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(SAMPLE));
    const provider = createPexelsProvider('PKEY');

    const result = await provider.search('dogs', 1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://api.pexels.com/v1/search?query=dogs&page=1&per_page=24');
    expect((init as RequestInit).headers).toEqual({ Authorization: 'PKEY' });

    const photo = result.photos[0];
    expect(photo.id).toBe('pexels:123');
    expect(photo.provider).toBe('pexels');
    expect(photo.thumbUrl).toBe('m.jpg');
    expect(photo.fullUrl).toBe('l.jpg');
    expect(photo.alt).toBe('a dog');
    expect(photo.photographerName).toBe('Bo');
    expect(photo.photographerUrl).toBe('https://www.pexels.com/@bo');
    expect(photo.providerUrl).toBe('https://www.pexels.com/photo/123/');
    expect(photo.downloadLocation).toBeUndefined();
    expect(result.hasMore).toBe(true); // next_page present
  });

  it('reports hasMore false when next_page is absent and empty alt → ""', async () => {
    const body = { photos: [{ ...SAMPLE.photos[0], alt: null }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(body));
    const provider = createPexelsProvider('PKEY');
    const result = await provider.search('x', 1);
    expect(result.photos[0].alt).toBe('');
    expect(result.hasMore).toBe(false);
  });

  it('throws StockError on non-OK, and trackDownload is a no-op', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 401));
    const provider = createPexelsProvider('PKEY');
    await expect(provider.search('x', 1)).rejects.toMatchObject({ status: 401 });
    await expect(provider.trackDownload({} as any)).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-pexels.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `stock/pexels.ts`**

```ts
// packages/editor/src/components/asset-manager/stock/pexels.ts
import type { StockPhoto, StockProvider, StockSearchResult } from './types.js';
import { STOCK_PER_PAGE, StockError } from './types.js';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  alt: string | null;
  src: { tiny: string; medium: string; large: string; large2x: string; original: string };
}
interface PexelsSearchResponse {
  photos: PexelsPhoto[];
  next_page?: string;
}

export function createPexelsProvider(apiKey: string): StockProvider {
  return {
    id: 'pexels',
    label: 'Pexels',
    async search(query: string, page: number): Promise<StockSearchResult> {
      const url =
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
        `&page=${page}&per_page=${STOCK_PER_PAGE}`;
      const res = await fetch(url, { headers: { Authorization: apiKey } });
      if (!res.ok) throw new StockError(res.status);
      const data = (await res.json()) as PexelsSearchResponse;
      const photos: StockPhoto[] = data.photos.map((p) => ({
        id: `pexels:${p.id}`,
        provider: 'pexels',
        thumbUrl: p.src.medium,
        fullUrl: p.src.large,
        width: p.width,
        height: p.height,
        alt: p.alt ?? '',
        photographerName: p.photographer,
        photographerUrl: p.photographer_url,
        providerUrl: p.url,
      }));
      return { photos, page, hasMore: Boolean(data.next_page) };
    },
    async trackDownload(): Promise<void> {
      // Pexels has no download-tracking endpoint.
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-pexels.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/asset-manager/stock/pexels.ts packages/editor/__tests__/stock-pexels.test.ts
git commit -m "feat(editor): Pexels stock adapter (#28)"
```

---

### Task 5: Provider factory (`stock/index.ts`)

**Files:**
- Create: `packages/editor/src/components/asset-manager/stock/index.ts`
- Test: `packages/editor/__tests__/stock-providers.test.ts`

**Interfaces:**
- Consumes: `StockConfig` from `@lit-pigeon/core`; `createUnsplashProvider`, `createPexelsProvider`; `StockProvider`.
- Produces: `createProviders(config: StockConfig | undefined): StockProvider[]` (order `[unsplash?, pexels?]`, only configured keys); re-exports everything from `./types.js`.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-providers.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `stock/index.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-providers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/components/asset-manager/stock/index.ts packages/editor/__tests__/stock-providers.test.ts
git commit -m "feat(editor): stock provider factory (#28)"
```

---

### Task 6: `pigeon-stock-tab` component + i18n keys

**Files:**
- Modify: `packages/editor/src/i18n/en.ts` (insert `asset.stock.*` keys after `asset.url.use`)
- Create: `packages/editor/src/components/asset-manager/pigeon-stock-tab.ts`
- Test: `packages/editor/__tests__/stock-tab.test.ts`

**Interfaces:**
- Consumes: `createProviders`, `StockPhoto`, `StockProvider`, `StockError` from `./stock/index.js`; `StockConfig` from `@lit-pigeon/core`; `t` from `../../i18n/index.js`.
- Produces: `<pigeon-stock-tab>` with `@property({attribute:false}) config: StockConfig`; dispatches `stock-select` `CustomEvent<{ url: string }>` (`bubbles`, `composed`) on pick.

- [ ] **Step 1: Add i18n keys**

In `packages/editor/src/i18n/en.ts`, immediately after the line `'asset.url.use': 'Use URL',` insert:

```ts
  // asset manager — stock tab
  'asset.tab.stock': 'Stock',
  'asset.stock.search': 'Search free photos…',
  'asset.stock.idle': 'Search Unsplash and Pexels for free photos.',
  'asset.stock.empty': 'No photos found. Try another search.',
  'asset.stock.load-more': 'Load more',
  'asset.stock.photo-by': 'Photo by',
  'asset.stock.on': 'on',
  'asset.stock.error': 'Couldn’t load photos. Check the API key or try again.',
  'asset.stock.rate-limited': 'Rate limit reached. Try again shortly.',
```

- [ ] **Step 2: Write the failing test**

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-tab.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `pigeon-stock-tab.ts`**

```ts
// packages/editor/src/components/asset-manager/pigeon-stock-tab.ts
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { StockConfig } from '@lit-pigeon/core';
import { t } from '../../i18n/index.js';
import { createProviders, StockError } from './stock/index.js';
import type { StockPhoto, StockProvider } from './stock/index.js';

const SEARCH_DEBOUNCE_MS = 250;

@customElement('pigeon-stock-tab')
export class PigeonStockTab extends LitElement {
  @property({ attribute: false })
  config: StockConfig = {};

  @state() private _providers: StockProvider[] = [];
  @state() private _providerIndex = 0;
  @state() private _query = '';
  @state() private _photos: StockPhoto[] = [];
  @state() private _page = 1;
  @state() private _hasMore = false;
  @state() private _loading = false;
  @state() private _errorKey = '';

  private _token = 0;
  private _timer: ReturnType<typeof setTimeout> | null = null;

  static styles = css`
    :host { display: block; }
    .controls { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
    input[type='search'] {
      flex: 1; height: 32px; box-sizing: border-box;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 10px; font-family: var(--pigeon-font); font-size: 13px;
      color: var(--pigeon-text, #1e293b); background: var(--pigeon-bg, #ffffff); outline: none;
    }
    input[type='search']:focus { border-color: var(--pigeon-border-focus, #3b82f6); }
    .provider-switch { display: flex; gap: 4px; }
    .provider-btn {
      height: 32px; padding: 0 10px; cursor: pointer; font-size: 12px; font-weight: 500;
      font-family: var(--pigeon-font); color: var(--pigeon-text-secondary, #64748b);
      background: var(--pigeon-surface, #f1f5f9);
      border: 1px solid var(--pigeon-border, #e2e8f0); border-radius: var(--pigeon-radius-sm, 4px);
    }
    .provider-btn.active {
      background: var(--pigeon-primary, #3b82f6); color: var(--pigeon-primary-foreground, #fff);
      border-color: var(--pigeon-primary, #3b82f6);
    }
    .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .asset-card {
      cursor: pointer; border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px); overflow: hidden; padding: 0;
      background: var(--pigeon-bg, #ffffff); display: flex; flex-direction: column;
      text-align: left; font-family: inherit;
    }
    .asset-card:hover, .asset-card:focus-visible {
      border-color: var(--pigeon-primary, #3b82f6); box-shadow: var(--pigeon-ring-shadow); outline: none;
    }
    .asset-thumb {
      width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block;
      background: var(--pigeon-surface, #f1f5f9);
    }
    .stock-credit {
      padding: 5px 8px; font-size: 11px; line-height: 1.3;
      color: var(--pigeon-text-secondary, #64748b);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .stock-credit a { color: inherit; text-decoration: underline; }
    .stock-idle, .empty-library, .library-spinner {
      padding: 32px 16px; text-align: center; font-size: 13px;
      color: var(--pigeon-text-secondary, #64748b);
    }
    .error { color: var(--pigeon-danger, #ef4444); font-size: 13px; margin: 8px 0; }
    .load-more {
      display: block; margin: 14px auto 0; height: 32px; padding: 0 16px; cursor: pointer;
      font-family: var(--pigeon-font); font-size: 13px; font-weight: 500;
      color: var(--pigeon-text, #1e293b); background: var(--pigeon-surface, #f1f5f9);
      border: 1px solid var(--pigeon-border, #e2e8f0); border-radius: var(--pigeon-radius-sm, 4px);
    }
  `;

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('config')) {
      this._providers = createProviders(this.config);
      if (this._providerIndex >= this._providers.length) this._providerIndex = 0;
    }
  }

  private get _provider(): StockProvider | undefined {
    return this._providers[this._providerIndex];
  }

  render() {
    return html`
      <div class="controls">
        ${this._providers.length > 1
          ? html`<div class="provider-switch" role="group">
              ${this._providers.map(
                (p, i) => html`<button
                  class="provider-btn ${i === this._providerIndex ? 'active' : ''}"
                  @click=${() => this._switchProvider(i)}
                >${p.label}</button>`,
              )}
            </div>`
          : nothing}
        <input
          type="search"
          placeholder=${t('asset.stock.search')}
          aria-label=${t('asset.stock.search')}
          .value=${this._query}
          @input=${this._onInput}
        />
      </div>
      ${this._renderBody()}
    `;
  }

  private _renderBody() {
    if (this._errorKey) return html`<div class="error">${t(this._errorKey)}</div>`;
    if (this._loading && this._photos.length === 0)
      return html`<div class="library-spinner">${t('asset.loading')}</div>`;
    if (!this._query.trim()) return html`<div class="stock-idle">${t('asset.stock.idle')}</div>`;
    if (this._photos.length === 0) return html`<div class="empty-library">${t('asset.stock.empty')}</div>`;
    return html`
      <div class="asset-grid">${this._photos.map((p) => this._renderCard(p))}</div>
      ${this._hasMore
        ? html`<button class="load-more" @click=${this._loadMore}>${t('asset.stock.load-more')}</button>`
        : nothing}
    `;
  }

  private _renderCard(photo: StockPhoto) {
    const label = this._providers.find((p) => p.id === photo.provider)?.label ?? photo.provider;
    return html`<button class="asset-card" type="button" @click=${() => this._pick(photo)}>
      <img class="asset-thumb" src=${photo.thumbUrl} alt=${photo.alt} loading="lazy" />
      <div class="stock-credit">
        ${t('asset.stock.photo-by')}
        <a href=${photo.photographerUrl} target="_blank" rel="noopener"
          @click=${(e: Event) => e.stopPropagation()}>${photo.photographerName}</a>
        ${t('asset.stock.on')}
        <a href=${photo.providerUrl} target="_blank" rel="noopener"
          @click=${(e: Event) => e.stopPropagation()}>${label}</a>
      </div>
    </button>`;
  }

  private _onInput(e: Event) {
    this._query = (e.target as HTMLInputElement).value;
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this._runSearch(1, false), SEARCH_DEBOUNCE_MS);
  }

  private async _runSearch(page: number, append: boolean) {
    const provider = this._provider;
    const q = this._query.trim();
    if (!provider || !q) {
      this._photos = [];
      this._hasMore = false;
      this._errorKey = '';
      return;
    }
    const token = ++this._token;
    this._loading = true;
    this._errorKey = '';
    try {
      const result = await provider.search(q, page);
      if (token !== this._token) return;
      this._photos = append ? [...this._photos, ...result.photos] : result.photos;
      this._page = result.page;
      this._hasMore = result.hasMore;
    } catch (err) {
      if (token !== this._token) return;
      const status = err instanceof StockError ? err.status : 0;
      this._errorKey = status === 429 || status === 403 ? 'asset.stock.rate-limited' : 'asset.stock.error';
      if (!append) this._photos = [];
    } finally {
      if (token === this._token) this._loading = false;
    }
  }

  private _loadMore() {
    this._runSearch(this._page + 1, true);
  }

  private _switchProvider(index: number) {
    if (index === this._providerIndex) return;
    this._providerIndex = index;
    this._photos = [];
    this._errorKey = '';
    this._runSearch(1, false);
  }

  private _pick(photo: StockPhoto) {
    void this._provider?.trackDownload(photo);
    this.dispatchEvent(
      new CustomEvent('stock-select', {
        detail: { url: photo.fullUrl },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-stock-tab': PigeonStockTab;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/stock-tab.test.ts`
Expected: PASS (all 5 cases)

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/i18n/en.ts packages/editor/src/components/asset-manager/pigeon-stock-tab.ts packages/editor/__tests__/stock-tab.test.ts
git commit -m "feat(editor): pigeon-stock-tab search UI + i18n (#28)"
```

---

### Task 7: Asset-manager integration + size budget

**Files:**
- Modify: `packages/editor/src/components/asset-manager/pigeon-asset-manager.ts` (Tab union, `_hasStock`, lazy load, render, funnel `stock-select` → `_selectAsset`)
- Modify: `.size-limit.json` (add `./pigeon-stock-tab.js` to the editor `ignore` array)
- Test: `packages/editor/__tests__/asset-manager-stock.test.ts`

**Interfaces:**
- Consumes: `<pigeon-stock-tab>`'s `stock-select` `CustomEvent<{ url: string }>`; the existing `_selectAsset(url: string)` and `asset-selected` event.
- Produces: a third tab button rendered only when `config.stock` has a key; on `stock-select`, dispatches the existing `asset-selected { url }` and closes.

- [ ] **Step 1: Write the failing test**

```ts
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
    const el = await mount({ stock: { unsplash: { accessKey: 'u' } } });
    let selectedUrl: string | undefined;
    el.addEventListener('asset-selected', (e) => {
      selectedUrl = (e as CustomEvent<{ url: string }>).detail.url;
    });

    const stockTabBtn = Array.from(el.shadowRoot!.querySelectorAll('.tab'))
      .find((b) => b.textContent!.trim() === 'Stock') as HTMLElement;
    stockTabBtn.click();
    await flush();              // resolve the dynamic import
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/asset-manager-stock.test.ts`
Expected: FAIL — no Stock tab / `pigeon-stock-tab` never rendered.

- [ ] **Step 3: Wire the stock tab into `pigeon-asset-manager.ts`**

3a. Add the lazy-loader (module scope, after the imports near the top of the file):

```ts
let _stockTabPromise: Promise<unknown> | null = null;
function loadStockTab(): Promise<unknown> {
  if (!_stockTabPromise) _stockTabPromise = import('./pigeon-stock-tab.js');
  return _stockTabPromise;
}
```

3b. Widen the `Tab` type:

```ts
type Tab = 'library' | 'upload' | 'stock';
```

3c. Add a loaded-state flag next to the other `@state()` fields:

```ts
  @state()
  private _stockTabLoaded = false;
```

3d. Add a `_hasStock` getter (config-only — must NOT import stock code, to keep the chunk lazy):

```ts
  private get _hasStock(): boolean {
    const s = this.config.stock;
    return !!(s?.unsplash?.accessKey || s?.pexels?.apiKey);
  }
```

3e. In `render()`, the tab row currently shows only when `hasLibrary`. Show the tab row when there is a library **or** stock, and pass both flags to `_renderTabs()`. Replace:

```ts
    if (this.config.enabled === false) return html``;
    const hasLibrary = !!this.storage;
    return html`
      ...
        ${hasLibrary ? this._renderTabs() : nothing}
        <div class="body">
          ${hasLibrary && this._activeTab === 'library'
            ? this._renderLibrary()
            : this._renderUpload()}
        </div>
```

with:

```ts
    if (this.config.enabled === false) return html``;
    const hasLibrary = !!this.storage;
    const showTabs = hasLibrary || this._hasStock;
    return html`
      ...
        ${showTabs ? this._renderTabs(hasLibrary) : nothing}
        <div class="body">
          ${this._activeTab === 'stock' && this._hasStock
            ? this._renderStock()
            : hasLibrary && this._activeTab === 'library'
              ? this._renderLibrary()
              : this._renderUpload()}
        </div>
```

(The `...` lines — the `<div class="overlay">`, modal header, and `<h3>` — are unchanged.)

3f. Extend `_renderTabs()` to accept `hasLibrary` and append the Stock button. Replace the method signature `private _renderTabs() {` with `private _renderTabs(hasLibrary: boolean) {`, wrap the existing **Library** button so it only renders when `hasLibrary`, and add the Stock button after the Upload button (still inside the same `<div class="tabs">`):

```ts
        ${hasLibrary
          ? html`<button
              class="tab ${active === 'library' ? 'active' : ''}"
              role="tab"
              aria-selected=${active === 'library'}
              @click=${() => (this._tab = 'library')}
            >${t('asset.tab.library')}</button>`
          : nothing}
```

```ts
        ${this._hasStock
          ? html`<button
              class="tab ${active === 'stock' ? 'active' : ''}"
              role="tab"
              aria-selected=${active === 'stock'}
              @click=${this._handleStockTabClick}
            >${t('asset.tab.stock')}</button>`
          : nothing}
```

3g. Update the `_activeTab` getter so the default tab still works when only stock is configured (no storage):

```ts
  private get _activeTab(): Tab {
    return this._tab ?? (this.storage ? 'library' : 'upload');
  }
```

(Unchanged — Upload remains the default when there is no library; the user reaches Stock by clicking its tab. Keep as-is.)

3h. Add the click handler + render method (place near the other private methods):

```ts
  private _handleStockTabClick = async () => {
    this._tab = 'stock';
    if (!this._stockTabLoaded) {
      await loadStockTab();
      this._stockTabLoaded = true;
    }
  };

  private _renderStock() {
    if (!this._stockTabLoaded) return html`<div class="library-spinner">${t('asset.loading')}</div>`;
    return html`<pigeon-stock-tab
      .config=${this.config.stock ?? {}}
      @stock-select=${(e: CustomEvent<{ url: string }>) => this._selectAsset(e.detail.url)}
    ></pigeon-stock-tab>`;
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @lit-pigeon/editor exec vitest run __tests__/asset-manager-stock.test.ts`
Expected: PASS (all 3 cases)

- [ ] **Step 5: Run the full editor test suite + typecheck (no regressions)**

Run: `pnpm --filter @lit-pigeon/editor test && pnpm typecheck`
Expected: PASS — existing asset-manager tests still green; all packages tsc-clean.

- [ ] **Step 6: Add the lazy chunk to the size budget and verify**

In `.size-limit.json`, add `"./pigeon-stock-tab.js"` to the `ignore` array of the `@lit-pigeon/editor (ESM, excluding lit)` entry (alongside `./pigeon-brand-tab.js`, `./pigeon-saved-tab.js`).

Run: `pnpm build && pnpm size`
Expected: PASS — the editor core entry stays ≤ 48 kB; `dist/pigeon-stock-tab.js` is emitted as its own chunk and excluded.

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/components/asset-manager/pigeon-asset-manager.ts .size-limit.json packages/editor/__tests__/asset-manager-stock.test.ts
git commit -m "feat(editor): wire Stock tab into asset manager, lazy-loaded (#28)"
```

---

### Task 8: Changeset + docs

**Files:**
- Create: `.changeset/stock-images.md`

**Interfaces:** none.

- [ ] **Step 1: Write the changeset**

```md
---
"@lit-pigeon/editor": minor
"@lit-pigeon/core": minor
---

Stock image integration in the asset manager. A new **Stock** tab searches Unsplash and Pexels directly (host supplies API keys via `AssetManagerConfig.stock`) and inserts a photo by its hotlinked URL, with in-picker photographer/provider attribution and the required Unsplash download-ping. The tab is lazy-loaded so it adds nothing to the core editor bundle.
```

- [ ] **Step 2: Validate**

Run: `npx changeset status`
Expected: editor + core listed under minor.

- [ ] **Step 3: Commit**

```bash
git add .changeset/stock-images.md
git commit -m "chore: changeset for stock images (#28)"
```

---

## Self-Review

**1. Spec coverage:**
- Provider model (direct client key) → Tasks 3/4 (adapters call `fetch` with host keys). ✓
- Providers Unsplash + Pexels → Tasks 3/4/5. ✓
- Insert hotlinked URL only, funnel through `_selectAsset` → Task 7 (`stock-select` → `_selectAsset(url)`); no `AssetStorage` call anywhere. ✓
- Attribution in-picker only → Task 6 (`.stock-credit` links, `stopPropagation`). ✓
- Unsplash download ping → Task 3 (`trackDownload`) + Task 6 (`_pick` fires it). ✓
- Lazy chunk, 48 kB budget → Task 7 (loader + `.size-limit.json` + `pnpm size`). ✓
- Config under `AssetManagerConfig.stock` → Task 1. ✓
- `StockProvider` abstraction → Task 2. ✓
- i18n keys → Task 6 Step 1. ✓
- Error handling (rate-limit vs generic, stale-token, non-fatal ping, empty query) → Task 6 (`_runSearch`, `_token`, `_errorKey`). ✓
- Testing (adapter unit, component, integration, size) → Tasks 3/4/6/7. ✓
- Out-of-scope items are simply absent (no rehosting, no AssetStorage save, no caption, no custom-provider API, no infinite scroll). ✓

**2. Placeholder scan:** No TBD/TODO; every code step has full code; every command has expected output. ✓

**3. Type consistency:** `StockConfig`, `StockPhoto`, `StockProvider`, `StockError`, `STOCK_PER_PAGE`, `createProviders`, `createUnsplashProvider(accessKey, appName)`, `createPexelsProvider(apiKey)`, and the `stock-select` `CustomEvent<{ url: string }>` are used identically across tasks. The component reads `config: StockConfig`; the manager passes `this.config.stock ?? {}`. ✓
