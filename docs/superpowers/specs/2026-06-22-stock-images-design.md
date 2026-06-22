# Stock Image Integration (Unsplash / Pexels) — Design Spec

**Issue:** #28 Stock image integration in asset manager (Unsplash/Pexels)
**Date:** 2026-06-22
**Status:** Approved design — ready for implementation plan
**Branch:** `feat/28-stock-images`

## Goal

Add a third **Stock** tab to the editor's asset manager so authors can search
free stock photos from Unsplash and Pexels and insert them into an email,
alongside the existing **Library** and **Upload** tabs. The editor calls the
provider APIs directly from the browser using host-supplied keys; a picked
image is inserted by its provider-hosted (hotlinked) URL.

## Decisions (locked)

- **Provider model:** direct client-side API calls with host-supplied keys, no
  backend proxy. Tradeoff accepted: the key is visible in the browser and
  subject to client rate limits / CORS. Both Unsplash and Pexels support CORS
  browser requests.
- **Providers:** Unsplash **and** Pexels, each behind a small internal
  `StockProvider` adapter. No public custom-provider extension point.
- **On pick:** insert the provider's **hotlinked** `fullUrl` only, funneled
  through the asset manager's existing `_selectAsset(url)` (same path as Upload).
  Nothing is written to `AssetStorage`. Unsplash terms *require* hotlinking
  (re-hosting is prohibited), so this is also the compliant choice.
- **Attribution:** shown **in the picker only** — "Photo by [name] on
  [Unsplash/Pexels]" with UTM-tagged links. No in-email caption, no alt
  propagation to the image block (consumers read only `url` today; the user
  sets alt in the panel as with every other source).
- **Unsplash download ping:** fired on every selection (GET to
  `links.download_location`) — required by the Unsplash API guidelines.
  Fire-and-forget, non-blocking, non-fatal.
- **Packaging:** `pigeon-stock-tab` is a separate, lazy-loaded chunk (mirroring
  `pigeon-brand-tab` / `pigeon-saved-tab`), excluded from the 48 kB core editor
  size budget. Provider code ships only when the tab is opened.

## Component structure

```
packages/editor/src/components/asset-manager/
  pigeon-asset-manager.ts      (modified: add 'stock' tab + lazy-load + funnel)
  pigeon-stock-tab.ts          (NEW — lazy chunk; the Stock UI)
  stock/
    types.ts                   (StockProvider, StockPhoto, StockSearchResult)
    unsplash.ts                (Unsplash adapter)
    pexels.ts                  (Pexels adapter)
```

`pigeon-asset-manager.ts` dynamically imports `./pigeon-stock-tab.js` the first
time the Stock tab is activated, using the cached-promise pattern that
`pigeon-palette.ts` already uses for its brand/saved tabs. `pigeon-stock-tab.js`
is added to the `ignore` list in `.size-limit.json`.

## Config API

In `AssetManagerConfig` (`packages/core/src/types/editor.ts`):

```ts
export interface StockConfig {
  unsplash?: { accessKey: string };
  pexels?: { apiKey: string };
  /**
   * utm_source label for Unsplash attribution links and the download-ping
   * request. Unsplash guidelines require identifying your application.
   * Defaults to "lit-pigeon"; hosts should override with their app name.
   */
  appName?: string;
}

export interface AssetManagerConfig {
  // ...existing fields...
  stock?: StockConfig;
}
```

The **Stock** tab button renders only when `config.stock` has at least one
provider key. The tab list grows from two buttons to three; tabs already render
conditionally on `hasLibrary`, so the existing `_renderTabs()` is extended to
include Stock when `_hasStock` is true. The `Tab` union becomes
`'library' | 'upload' | 'stock'`.

## Provider abstraction — `stock/types.ts`

```ts
export interface StockPhoto {
  /** Namespaced id, e.g. "unsplash:abc123". */
  id: string;
  provider: 'unsplash' | 'pexels';
  /** Small image URL for the result grid. */
  thumbUrl: string;
  /** Hotlinked URL inserted into the email. */
  fullUrl: string;
  width: number;
  height: number;
  /** Description / alt text from the provider (may be empty). */
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
  readonly id: 'unsplash' | 'pexels';
  readonly label: string; // "Unsplash" | "Pexels"
  search(query: string, page: number): Promise<StockSearchResult>;
  /** Unsplash: GET download_location. Pexels: resolved no-op. */
  trackDownload(photo: StockPhoto): Promise<void>;
}
```

`PER_PAGE = 24`. Provider instances are constructed from the config keys
(`createProviders(stockConfig): StockProvider[]`), in the order
`[unsplash?, pexels?]`, filtered to those with a key.

### Unsplash adapter — `stock/unsplash.ts`

- **Search:** `GET https://api.unsplash.com/search/photos?query={q}&page={n}&per_page=24`
  with header `Authorization: Client-ID {accessKey}`.
- **Mapping** (per `results[]`): `id` → `unsplash:{id}`; `urls.small` → `thumbUrl`;
  `urls.regular` → `fullUrl`; `width`/`height`; `alt_description ?? description ?? ''`
  → `alt`; `user.name` → `photographerName`; `user.links.html` + UTM →
  `photographerUrl`; `links.html` + UTM → `providerUrl`; `links.download_location`
  → `downloadLocation`.
- **UTM suffix:** `?utm_source={appName}&utm_medium=referral` (appName defaults
  to `lit-pigeon`).
- **hasMore:** `page < total_pages` (from the response).
- **trackDownload:** `GET {downloadLocation}` with `Authorization: Client-ID {accessKey}`,
  fire-and-forget; swallow errors.

### Pexels adapter — `stock/pexels.ts`

- **Search:** `GET https://api.pexels.com/v1/search?query={q}&page={n}&per_page=24`
  with header `Authorization: {apiKey}`.
- **Mapping** (per `photos[]`): `id` → `pexels:{id}`; `src.medium` → `thumbUrl`;
  `src.large` → `fullUrl`; `width`/`height`; `alt ?? ''` → `alt`; `photographer`
  → `photographerName`; `photographer_url` → `photographerUrl`; `url` →
  `providerUrl`; `downloadLocation` omitted.
- **hasMore:** `Boolean(next_page)` (from the response).
- **trackDownload:** resolved no-op (Pexels has no download endpoint).

## Data flow on pick

1. User opens the asset manager and clicks **Stock**.
2. The manager lazy-imports `pigeon-stock-tab` and renders it, passing
   `config.stock`.
3. The tab builds its provider list; if more than one, a provider switcher
   shows (default: first = Unsplash when both present).
4. User types a query (debounced 250 ms — same mechanism as the Library tab) →
   `provider.search(query, 1)`.
5. Results render in a grid; each card shows the thumbnail and an attribution
   line with links.
6. **Load more** (visible while `hasMore`) calls `search(query, page + 1)` and
   appends.
7. On card click the tab fires `void provider.trackDownload(photo)`
   (fire-and-forget; Unsplash ping) and immediately dispatches a
   `stock-select` `CustomEvent` `{ detail: { url: photo.fullUrl } }`
   (`bubbles`, `composed`).
8. `pigeon-asset-manager` listens (`@stock-select`) and calls its existing
   `_selectAsset(url)`, which dispatches `asset-selected { url }` and closes the
   modal — identical to the Upload path. No `AssetStorage` write.

## UI / states

Reuses existing asset-manager styles (`.asset-grid`, `.asset-card`,
`.asset-thumb`, `.library-spinner`, `.error`, `.empty-library`).

- **Search bar** + optional **provider switcher** (segmented buttons; rendered
  only when ≥ 2 providers configured).
- **Result card:** thumbnail (`aspect-ratio` cover) + attribution line
  "Photo by **[name]** on **[Unsplash/Pexels]**". The two links open in a new
  tab (`target="_blank" rel="noopener"`) and call `stopPropagation()` so they
  don't trigger the card's select.
- **States:** idle (hint to search), loading (spinner), empty
  ("No results for …"), error (friendly message). A **monotonic request token**
  (mirroring the Library tab's `_libraryToken`) discards stale responses so a
  slow page-1 can't overwrite a faster newer query.
- **Load-more** button at the grid foot while `hasMore`; appends to the list.

## i18n

All user-facing strings go through `t()` (i18n shipped in #21). New keys under
the `asset.stock.*` namespace, added to every locale catalog:

```
asset.tab.stock          "Stock"
asset.stock.search       "Search free photos…"
asset.stock.idle         "Search Unsplash and Pexels for free photos."
asset.stock.empty        "No results for “{query}”."
asset.stock.load-more    "Load more"
asset.stock.by           "Photo by {name} on {provider}"
asset.stock.error        "Couldn’t load photos. Check the API key or try again."
asset.stock.rate-limited "Rate limit reached. Try again shortly."
```

## Size budget

- Add `"./pigeon-stock-tab.js"` to the `ignore` array of the
  `@lit-pigeon/editor (ESM, excluding lit)` entry in `.size-limit.json`.
- Optionally add a tracked size entry for the lazy chunk itself.
- The core editor budget stays at **48 kB**; CI `pnpm size` must still pass.

## Error handling

- **Invalid key (401) / forbidden (403) / rate limit (429):** show a friendly
  message via the existing `.error` style; distinguish rate-limit. Never throw
  to the host.
- **Network failure:** generic error message; the user can retry.
- **Stale responses:** dropped via the request token.
- **trackDownload failure:** swallowed; must never block or fail insertion.
- **Empty/whitespace query:** no request; show the idle hint.

## Testing

- **Adapter unit tests** (mock `fetch`): correct endpoint + auth header per
  provider; field mapping (thumb/full/dimensions/alt/attribution); UTM tagging
  for Unsplash; `hasMore` logic; Unsplash `trackDownload` issues a GET to
  `download_location` and is non-fatal on failure; Pexels `trackDownload` is a
  no-op.
- **Component tests** (`pigeon-stock-tab`): debounced search calls the active
  provider; results + attribution render; attribution-link clicks don't select;
  Load-more appends; idle/loading/empty/error states; provider switcher visible
  only with ≥ 2 providers; selecting a card fires `trackDownload` and dispatches
  `stock-select` with the `fullUrl`.
- **Integration** (`pigeon-asset-manager`): Stock tab button visible only when
  `config.stock` has a key; activating it lazy-loads and renders the tab;
  `stock-select` funnels to `asset-selected { url }` and closes; existing
  Library/Upload behavior unchanged.
- **Size:** `pnpm size` confirms the core editor stays ≤ 48 kB (stock chunk
  excluded).

## Out of scope (YAGNI)

- Host-provided `search()` callback / backend proxy (direct client key chosen).
- Re-hosting images or writing picks into `AssetStorage`.
- In-email attribution caption blocks.
- Propagating provider `alt` into the inserted image block (consumers read only
  `url` today; unchanged).
- Public custom-`StockProvider` registration.
- Infinite scroll (Load-more chosen).
- Collections / favorites / orientation & color filters.
