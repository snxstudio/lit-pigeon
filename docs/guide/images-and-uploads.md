# Images and uploads

Image blocks and hero backgrounds get their images from the asset manager, a
dialog with up to three tabs:

- **Upload**: drop or choose a file, or paste an image URL. Always present
  unless uploads are disabled.
- **Library**: browse previously saved assets. Shown when an `AssetStorage` is
  supplied.
- **Stock**: search Unsplash and Pexels. Shown when a stock API key is
  supplied.

Everything is configured through `config.assetManager` (an
`AssetManagerConfig`) and, for the library, `assetStorage`. The behaviour on
this page is pinned by
[`examples/test/images.test.ts`](./examples/test/images.test.ts), which drives
the real `<pigeon-asset-manager>` element.

## `AssetManagerConfig`

From `@lit-pigeon/core` 0.3.3:

```text
interface AssetManagerConfig {
  enabled?: boolean;
  uploadUrl?: string;
  uploadHeaders?: Record<string, string>;
  acceptedTypes?: string[];
  maxFileSize?: number;
  uploadHandler?: (file: File) => Promise<string>;
  presignedUpload?: {
    getUploadParams: (file: File) => Promise<PresignedUploadParams>;
  };
  stock?: StockConfig;
}

interface PresignedUploadParams {
  uploadUrl: string;
  publicUrl: string;
  method?: 'PUT' | 'POST';
  headers?: Record<string, string>;
  fields?: Record<string, string>;
}

interface StockConfig {
  unsplash?: { accessKey: string };
  pexels?: { apiKey: string };
  appName?: string;
}
```

| Field | Default | Behaviour |
|---|---|---|
| `enabled` | `true` | `false` hides the image panel's Upload button and stops the dialog rendering. Users can still type an image URL. The hero panel's Upload button is still shown but does nothing. |
| `acceptedTypes` | JPEG, PNG, GIF, WebP, SVG | MIME types checked against `file.type` before upload. Also used as the file input's `accept`. |
| `maxFileSize` | 5 MB (5 × 1024 × 1024 bytes) | Larger files are rejected before upload with "File too large. Maximum size: 5.0MB". |
| `uploadHandler` | none | Your function; resolves to the URL to store. Takes precedence over everything below. |
| `presignedUpload` | none | Two-step upload direct to object storage. |
| `uploadUrl` | none | Simple endpoint: multipart `POST`, JSON response. |
| `uploadHeaders` | `{}` | Headers for the `uploadUrl` request only. |
| `stock` | none | Enables the Stock tab. |

The first adapter that is set is used: `uploadHandler`, then
`presignedUpload`, then `uploadUrl`. With none of them, the file is read into a
`data:` URL and stored in the document. Do not rely on that in production:
it bloats documents, and many email clients (including Gmail) do not show
`data:` images.

If an upload function throws, or the response is not OK, the dialog shows the
error message (for `uploadHandler`, the thrown `Error`'s `message`) and the
image is not changed.

Consider removing `image/svg+xml` from `acceptedTypes`: SVG is poorly
supported in email clients and can carry script.

## A custom upload function with auth headers

`uploadHandler` is the most flexible option and the right one for an
authenticated API. It is called once per file, so it can read a fresh token
every time:

<!-- snippet: src/images/upload-handler.ts -->
```ts
import type { AssetManagerConfig } from '@lit-pigeon/core';

/** Returns the signed-in user's current access token. */
export type TokenGetter = () => string | Promise<string>;

export function createAssetManagerConfig(getToken: TokenGetter): AssetManagerConfig {
  return {
    acceptedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    maxFileSize: 2 * 1024 * 1024,
    // Called once per file; resolves to the URL stored on the image block.
    uploadHandler: async (file) => {
      const body = new FormData();
      body.append('file', file, file.name);
      const res = await fetch('/api/email-assets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}` },
        body,
      });
      // A thrown Error's message is shown in the upload dialog.
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const { url } = (await res.json()) as { url: string };
      return url;
    },
  };
}
```

Pass it as `config.assetManager`:

<!-- snippet: src/configuration/full-config.ts#asset-manager -->
```ts
assetManager: createAssetManagerConfig(getToken),
```

The URL you return is written into the email and fetched by every recipient's
mail client, so it must be public (or signed for a long time) and served over
HTTPS. The upload progress bar is not tied to real progress with
`uploadHandler`; it shows a fixed midpoint until your promise settles.

An Angular version using an injected API service is in
[Angular](./angular.md#standalone-import).

### A fixed header set: `uploadUrl`

For an endpoint that accepts a static header, `uploadUrl` avoids writing a
function. The editor sends `multipart/form-data` with the file in a field named
`file`, and reads `url`, `src` or `location` from the JSON response:

<!-- snippet: src/images/upload-url.ts -->
```ts
import type { AssetManagerConfig } from '@lit-pigeon/core';

// The editor POSTs multipart/form-data with the file in the "file" field and
// reads `url`, `src` or `location` from the JSON response.
export function uploadUrlConfig(token: string): AssetManagerConfig {
  return {
    uploadUrl: '/api/email-assets',
    // Fixed at the time the config is built. Rebuild the config when the token changes.
    uploadHeaders: { Authorization: `Bearer ${token}` },
  };
}
```

Because `uploadHeaders` is a plain object, a token that expires needs a new
`config` object. Prefer `uploadHandler` for short-lived tokens. Cookies are
sent only for same-origin requests (the request uses `fetch` defaults).

## Presigned uploads

With `presignedUpload`, your API signs an upload URL, and the browser sends the
file straight to object storage (S3, R2, GCS, Azure Blob, MinIO). Your API
only handles the small signing request, which is where the auth header goes.

For a presigned `PUT` (the default method), the editor sends the file as the
request body with `Content-Type` set to the file's type, unless your returned
`headers` include one. Sign the URL for that content type.

<!-- snippet: src/images/presigned.ts#put -->
```ts
/** Your API signs a PUT URL for the bucket and returns where the file will be served from. */
export function presignedPutConfig(getToken: TokenGetter): AssetManagerConfig {
  return {
    presignedUpload: {
      getUploadParams: async (file): Promise<PresignedUploadParams> => {
        const res = await fetch('/api/email-assets/sign', {
          method: 'POST',
          headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
        });
        if (!res.ok) throw new Error(`Could not sign upload (${res.status})`);
        const { uploadUrl, publicUrl } = (await res.json()) as { uploadUrl: string; publicUrl: string };
        // method defaults to PUT; the editor adds Content-Type: file.type unless you set one.
        return { uploadUrl, publicUrl };
      },
    },
  };
}
```

For an S3-style presigned `POST`, return `method: 'POST'` and the signed form
`fields`. The editor appends them in order, then appends the file as `file`:

<!-- snippet: src/images/presigned.ts#post -->
```ts
/** S3-style presigned POST: the form fields come from your API, the file is appended last. */
export function presignedPostConfig(getToken: TokenGetter): AssetManagerConfig {
  return {
    presignedUpload: {
      getUploadParams: async (file): Promise<PresignedUploadParams> => {
        const res = await fetch('/api/email-assets/sign-post', {
          method: 'POST',
          headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type }),
        });
        if (!res.ok) throw new Error(`Could not sign upload (${res.status})`);
        const { url, fields, publicUrl } = (await res.json()) as {
          url: string;
          fields: Record<string, string>;
          publicUrl: string;
        };
        return { uploadUrl: url, publicUrl, method: 'POST', fields };
      },
    },
  };
}
```

The stored URL is `publicUrl`, not `uploadUrl`. The bucket needs a CORS rule
that allows your application's origin to `PUT` or `POST`.

On the server, validate the declared type and size before signing, and
enforce them in the signature (content-length range, content type), because
the browser-side `acceptedTypes` and `maxFileSize` checks are easy to bypass.

## Asset storage and the Library tab

An `AssetStorage` gives users a Library tab of previously saved images, with
folders, search and tag filters:

```text
interface AssetStorage {
  list(filter?: AssetListFilter): Promise<Asset[]>;   // newest first
  get(id: string): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  delete(id: string): Promise<void>;
  listFolders(): Promise<string[]>;
}

interface AssetListFilter { folder?: string; search?: string; tags?: string[]; limit?: number; offset?: number }

interface Asset {
  id: string; name: string; src: string; alt?: string; mimeType?: string;
  sizeBytes?: number; width?: number; height?: number; folder?: string;
  tags?: string[]; createdAt: string; updatedAt: string;
}
```

Supply it as the element's `assetStorage` property or as
`config.assetStorage`; the property wins when both are set. With storage
present, the dialog opens on the Library tab. Choosing an asset stores its
`src`.

A storage backed by your own API:

<!-- snippet: src/images/http-asset-storage.ts -->
```ts
import type { Asset, AssetListFilter, AssetManagerConfig, AssetStorage } from '@lit-pigeon/core';
import type { TokenGetter } from './upload-handler.js';

/** An AssetStorage backed by your own API, so the Library tab lists the user's images. */
export class HttpAssetStorage implements AssetStorage {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: TokenGetter,
  ) {}

  async list(filter: AssetListFilter = {}): Promise<Asset[]> {
    const query = new URLSearchParams();
    if (filter.folder) query.set('folder', filter.folder);
    if (filter.search) query.set('search', filter.search);
    for (const tag of filter.tags ?? []) query.append('tags', tag);
    if (filter.limit !== undefined) query.set('limit', String(filter.limit));
    if (filter.offset !== undefined) query.set('offset', String(filter.offset));
    return this.request<Asset[]>(`?${query}`);
  }

  async get(id: string): Promise<Asset | null> {
    return this.request<Asset | null>(`/${encodeURIComponent(id)}`).catch(() => null);
  }

  async save(asset: Asset): Promise<void> {
    await this.request(`/${encodeURIComponent(asset.id)}`, { method: 'PUT', body: JSON.stringify(asset) });
  }

  async delete(id: string): Promise<void> {
    await this.request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async listFolders(): Promise<string[]> {
    return this.request<string[]>('/folders');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${await this.getToken()}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }
}

// #region upload-into-library
/** Uploads are not added to the library automatically; record them yourself. */
export function uploadIntoLibrary(
  storage: AssetStorage,
  upload: (file: File) => Promise<string>,
): AssetManagerConfig {
  return {
    uploadHandler: async (file) => {
      const src = await upload(file);
      const now = new Date().toISOString();
      await storage.save({
        id: crypto.randomUUID(),
        name: file.name,
        src,
        mimeType: file.type,
        sizeBytes: file.size,
        folder: '/',
        createdAt: now,
        updatedAt: now,
      });
      return src;
    },
  };
}
// #endregion upload-into-library
```

The editor never writes to the storage: a file uploaded through the Upload tab
does not appear in the Library unless you save it, as `uploadIntoLibrary`
above does (or your upload endpoint records it server-side). The library is
reloaded every time the dialog opens.

Ready-made implementations: `InMemoryAssetStorage` in `@lit-pigeon/core` (for
tests and demos) and `FsAssetStorage` in `@lit-pigeon/mcp-server` (Node.js,
filesystem). `@lit-pigeon/rest` can expose any `AssetStorage` as `/assets`
endpoints; see [Server-side](./server-side.md#rest-api).

## Stock images

<!-- snippet: src/images/stock.ts -->
```ts
import type { AssetManagerConfig } from '@lit-pigeon/core';

export const stockConfig: AssetManagerConfig = {
  stock: {
    // Both keys are used from the browser and are visible to your users.
    unsplash: { accessKey: 'YOUR_UNSPLASH_ACCESS_KEY' },
    pexels: { apiKey: 'YOUR_PEXELS_API_KEY' },
    // Used as utm_source on Unsplash attribution links; set it to your application's name.
    appName: 'your-app',
  },
};
```

- The Stock tab appears when either key is set. The stock code is loaded only
  when the tab is opened.
- Requests go from the browser straight to `api.unsplash.com` and
  `api.pexels.com`, so the keys are exposed to anyone who can open the editor.
  Use keys issued for client-side use, and check each provider's terms.
- The chosen photo is **hotlinked**: its provider URL (on `images.unsplash.com`
  or `images.pexels.com`) is stored in the email, not copied to your storage.
  For Unsplash, the editor sends the required download ping when a photo is
  chosen.
- Photographer attribution is shown in the picker only. Add attribution to the
  email yourself if your use requires it.

## Disabling uploads

<!-- snippet: src/images/disabled.ts -->
```ts
import type { EditorConfig } from '@lit-pigeon/core';

// Hide the Upload button; users can still paste an image URL.
export const urlOnly: Partial<EditorConfig> = { assetManager: { enabled: false } };
```

## Content Security Policy

Allow the hosts the editor talks to: your upload API and bucket in
`connect-src`, your image CDN (and `images.unsplash.com`,
`images.pexels.com` if stock is on) in `img-src`, and `api.unsplash.com` or
`api.pexels.com` in `connect-src`. See [Security](./security.md#content-security-policy).
