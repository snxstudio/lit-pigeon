# Image-upload polish — design spec

**Date:** 2026-05-25
**Scope:** v0.2 roadmap, single PR
**Status:** Approved for implementation planning

## Problem

The v0.2 roadmap item `[ ] Image upload with configurable adapter (URL, base64, S3 presigned)` reads as not started, but inspection of `packages/editor/src/components/asset-manager/pigeon-asset-manager.ts` shows most of the feature is already shipped:

- URL paste, drag/drop + file picker, size + type validation, progress, error display
- Adapters: `uploadHandler` (custom function), `uploadUrl` (REST POST), base64 fallback

The actual gaps are:

1. **No first-class presigned-upload adapter.** Consumers can implement S3-presigned PUT via `uploadHandler`, but they re-write fetch/PUT/error-handling boilerplate every time.
2. **`AssetManagerConfig.enabled` is dead config.** The field exists in the type but nothing in the editor consumes it — `false` does not disable the upload UI.
3. **Zero test coverage** of `pigeon-asset-manager` despite it being a ~385-line component with branching logic per adapter.
4. **No user-facing documentation** of the `AssetManagerConfig` API.

## Goals

- Add a vendor-neutral presigned-upload adapter that covers S3 PUT, S3 POST presigned-post, R2, GCS, Azure Blob, and MinIO via one code path.
- Make `enabled: false` actually disable the upload UI.
- Bring `pigeon-asset-manager` to test parity with the other components (drop-zones, layers-panel, etc., which all have tests).
- Document `AssetManagerConfig` in the README so adopters can use it without reading source.

## Non-goals

- True byte-level upload progress (would require XHR or fetch streams) — keep coarse 20/40/90/100 markers.
- Retry, cancel, multi-file selection, drag-drop directly onto the image block in the canvas.
- A whole asset library / picker UI — modal stays a single-action picker.
- Migrating any existing `uploadHandler` adopters; the new adapter is additive.

## Design

### 1. API surface

Edit `packages/core/src/types/editor.ts`:

```ts
export interface PresignedUploadParams {
  /** Signed URL the browser uploads the bytes to. */
  uploadUrl: string;
  /** URL that ends up stored on the image block once upload succeeds. */
  publicUrl: string;
  /** HTTP method to use against uploadUrl. Defaults to 'PUT'. */
  method?: 'PUT' | 'POST';
  /** Additional request headers. For PUT, Content-Type defaults to file.type
   *  if not provided. For POST, headers are passed through unchanged and the
   *  browser sets Content-Type for multipart/form-data automatically. */
  headers?: Record<string, string>;
  /** Form fields sent alongside the file for POST presigned-post (S3-style).
   *  Ignored when method is PUT. */
  fields?: Record<string, string>;
}

export interface AssetManagerConfig {
  enabled?: boolean;
  uploadUrl?: string;
  uploadHeaders?: Record<string, string>;
  acceptedTypes?: string[];
  maxFileSize?: number;
  uploadHandler?: (file: File) => Promise<string>;
  /** Two-step presigned upload: ask the consumer's backend for a signed URL,
   *  then PUT (or POST) the file directly to the storage provider. */
  presignedUpload?: {
    getUploadParams: (file: File) => Promise<PresignedUploadParams>;
  };
}
```

Re-export `PresignedUploadParams` from `packages/core/src/index.ts` alongside `AssetManagerConfig`.

### 2. Asset-manager runtime

`_handleFile()` precedence order (first match wins):

1. `uploadHandler` — unchanged
2. `presignedUpload` — **new branch**
3. `uploadUrl` — unchanged
4. Base64 data-URL fallback — unchanged

New branch behavior:

```ts
if (this.config.presignedUpload) {
  try {
    this._uploading = true;
    this._progress = 20;
    const params = await this.config.presignedUpload.getUploadParams(file);
    this._progress = 40;

    const method = params.method ?? 'PUT';
    let body: BodyInit;
    let headers: Record<string, string> = { ...(params.headers ?? {}) };

    if (method === 'POST') {
      const form = new FormData();
      for (const [k, v] of Object.entries(params.fields ?? {})) form.append(k, v);
      form.append('file', file);
      body = form;
      // Don't set Content-Type — browser adds multipart boundary.
    } else {
      body = file;
      if (!('Content-Type' in headers) && !('content-type' in headers)) {
        headers['Content-Type'] = file.type;
      }
    }

    const res = await fetch(params.uploadUrl, { method, headers, body });
    this._progress = 90;
    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    this._progress = 100;
    this._selectAsset(params.publicUrl);
  } catch (err) {
    this._error = err instanceof Error ? err.message : 'Upload failed';
  } finally {
    this._uploading = false;
    this._progress = 0;
  }
  return;
}
```

### 3. `enabled: false` semantics

- Default (`undefined` or `true`): unchanged.
- `enabled === false`:
  - `pigeon-image-panel.ts`: render no "Upload Image" button. The URL `<input>` continues to work — that is not upload.
  - `pigeon-asset-manager.ts`: defensively render nothing in `render()` when `config.enabled === false`, even if `open === true`. Belt-and-braces in case consumers open it directly.

### 4. Tests

**New file:** `packages/editor/__tests__/asset-manager.test.ts`

Setup: mount `<pigeon-asset-manager>` with happy-dom. Stub `global.fetch` per test with `vi.spyOn(globalThis, 'fetch')`. Each test asserts:
- Whether `asset-selected` was emitted, and with what URL
- Whether the error state populated

Cases:

| # | Scenario | Expectation |
|---|---|---|
| 1 | URL paste → "Use URL" click | emit URL, modal closes |
| 2 | URL paste → Enter keypress | emit URL, modal closes |
| 3 | File over `maxFileSize` | error shown, no emit |
| 4 | File mime not in `acceptedTypes` | error shown, no emit |
| 5 | `uploadHandler` resolves | emit returned URL |
| 6 | `uploadHandler` rejects | error shown, no emit |
| 7 | `uploadUrl` 200 with `{ url }` | emit `url` |
| 8 | `uploadUrl` 200 with `{ src }` / `{ location }` | emit accordingly (covers all three fallback keys) |
| 9 | `uploadUrl` 500 | error shown, no emit |
| 10 | No adapter configured | base64 data-URL emitted |
| 11 | `presignedUpload` PUT 200 | `getUploadParams` called with file; fetch called with `method: 'PUT'`, body === file, `Content-Type` defaulted from `file.type`; emit `publicUrl` |
| 12 | `presignedUpload` PUT 200 with custom Content-Type header | fetch called with that header (no override) |
| 13 | `presignedUpload` POST | fetch called with FormData containing `fields` + `file`, no Content-Type header set explicitly |
| 14 | `presignedUpload` `getUploadParams` rejects | error shown, no emit |
| 15 | `presignedUpload` PUT 500 | error shown, no emit |
| 16 | `enabled: false` with `open: true` | shadow DOM renders no `.modal` |

**New file:** `packages/editor/__tests__/image-panel.test.ts`

| # | Scenario | Expectation |
|---|---|---|
| 1 | Default `assetManagerConfig` | "Upload Image" button present |
| 2 | `assetManagerConfig.enabled === false` | "Upload Image" button absent |
| 3 | URL input change emits `property-change` with new `src` | (existing-style coverage, smoke test) |

### 5. Documentation

Insert a new section into `README.md` between the existing usage sections and the roadmap:

```
## Asset manager / image upload

The editor includes a built-in asset picker that handles file selection,
validation, progress, and four upload strategies. Configure it via
`assetManager` on the editor config.

### Config fields
[fields table — enabled, uploadUrl, uploadHeaders, uploadHandler,
 presignedUpload, acceptedTypes, maxFileSize]

### Recipes
1. URL only (`enabled: false`)
2. Simple REST endpoint (`uploadUrl`)
3. Custom handler (full control)
4. S3 presigned PUT
5. S3 POST presigned-post
```

Each recipe is a 5–10 line code block. Total docs addition target: ~100 lines.

Update the v0.2 roadmap line:
- Check off: `[x] Image upload with configurable adapter (URL, base64, presigned PUT/POST)`
- Restore the unchecked: `[ ] Arrow-key row navigation` (block-nav landed; row-nav did not)

### Files touched

| File | Change |
|---|---|
| `packages/core/src/types/editor.ts` | Add `PresignedUploadParams`; extend `AssetManagerConfig` |
| `packages/core/src/index.ts` | Re-export `PresignedUploadParams` |
| `packages/editor/src/components/asset-manager/pigeon-asset-manager.ts` | New `presignedUpload` branch; `enabled === false` early-return in `render()` |
| `packages/editor/src/components/properties/panels/image-panel.ts` | Hide "Upload Image" button when `enabled === false` |
| `packages/editor/__tests__/asset-manager.test.ts` | NEW — 16 tests |
| `packages/editor/__tests__/image-panel.test.ts` | NEW — 3 tests |
| `README.md` | New asset-manager section; roadmap corrections |

### Resolution order rationale

`uploadHandler` stays first because it is the explicit "I want full control" escape hatch — adopters with that set have opted out of asset-manager's mechanics. `presignedUpload` is second because, when both are configured, treating presigned as the more specific intent is unintuitive — if a consumer wires a custom handler, that wins. This matches the existing precedence pattern (`uploadHandler` already outranks `uploadUrl`).

## Verification

- `pnpm --filter @lit-pigeon/editor test` → all new tests pass
- `pnpm test` (workspace) → 150 + 19 = 169 tests pass
- `pnpm lint` → clean
- `pnpm --filter @lit-pigeon/editor build` → clean type emit (the new `PresignedUploadParams` appears in the published `.d.ts`)

## Open questions

None at design time. Defer the following to future slices, not this PR:
- Byte-level progress (XHR migration)
- Retry / cancel
- Image library browse (multi-asset picker)
- Drop-on-canvas direct upload
