import type {
  AssetListFilter,
  AssetStorage,
  BrandKitStorage,
  PigeonDocument,
} from '@lit-pigeon/core';
import {
  parseMjml,
  renderDocument,
  renderDocumentToMjml,
  validateDocumentSafe,
  type RenderDocumentOptions,
} from '@lit-pigeon/ssr';
import { lintDocument, lintDocumentAsync } from '@lit-pigeon/lint';

export interface JsonRequest {
  method: string;
  path: string;
  body: unknown;
  /** Parsed `?key=value` query string. Optional — defaults to empty. */
  query?: Record<string, string | string[]>;
}

export interface JsonResponse {
  status: number;
  body: unknown;
  /** Set when the response body should be returned as a non-JSON string. */
  contentType?: string;
}

export interface RouteContext {
  /**
   * When set, the request must include a matching `Authorization: Bearer <token>`
   * header. The handler enforces this — `handleRequest` itself is body-only.
   */
  bearerToken?: string;
  /** Optional persistence for brand kits. Endpoints return 503 when unset. */
  brandKitStorage?: BrandKitStorage;
  /** Optional persistence for assets. Endpoints return 503 when unset. */
  assetStorage?: AssetStorage;
}

/**
 * Pure routing function. Takes a parsed `JsonRequest` and returns the
 * intended response. No HTTP semantics live here — that belongs to the
 * Node `http`-level handler so this stays framework-portable.
 */
export async function handleRequest(req: JsonRequest, ctx: RouteContext = {}): Promise<JsonResponse> {
  // Health is always free.
  if (req.method === 'GET' && req.path === '/health') {
    return json(200, { ok: true });
  }

  // Brand-kit + asset routes (collection + item paths).
  if (req.path === '/brand-kits' || req.path.startsWith('/brand-kits/')) {
    return routeBrandKits(req, ctx);
  }
  if (req.path === '/assets' || req.path.startsWith('/assets/')) {
    return routeAssets(req, ctx);
  }
  if (req.method === 'GET' && req.path === '/asset-folders') {
    if (!ctx.assetStorage) return storageUnavailable('asset');
    return json(200, { folders: await ctx.assetStorage.listFolders() });
  }

  // Render / parse / lint endpoints are all POST-only.
  if (req.method !== 'POST') {
    return json(405, { error: `Method not allowed: ${req.method}` });
  }

  switch (req.path) {
    case '/render':
      return handleRender(req.body);
    case '/render/mjml':
      return handleRenderMjml(req.body);
    case '/validate':
      return handleValidate(req.body);
    case '/parse':
      return handleParse(req.body);
    case '/lint':
      return handleLint(req.body);
    case '/lint/async':
      return handleLintAsync(req.body);
    default:
      return json(404, { error: `No route: ${req.method} ${req.path}` });
  }
}

// ---------------- render / parse / lint --------------------------------------

async function handleRender(body: unknown): Promise<JsonResponse> {
  const parsed = readDocAndOptions(body);
  if ('error' in parsed) return json(400, { error: parsed.error });
  const v = validateDocumentSafe(parsed.document);
  if (!v.valid) return json(400, { error: 'Invalid document', validationErrors: v.errors });
  const result = await renderDocument(parsed.document, parsed.options);
  return json(200, result);
}

async function handleRenderMjml(body: unknown): Promise<JsonResponse> {
  const parsed = readDocAndOptions(body);
  if ('error' in parsed) return json(400, { error: parsed.error });
  const v = validateDocumentSafe(parsed.document);
  if (!v.valid) return json(400, { error: 'Invalid document', validationErrors: v.errors });
  const mjml = renderDocumentToMjml(parsed.document, {
    outlookWorkarounds: parsed.options.outlookWorkarounds,
  });
  return { status: 200, body: mjml, contentType: 'text/plain; charset=utf-8' };
}

async function handleValidate(body: unknown): Promise<JsonResponse> {
  const bag = body as { document?: unknown } | null | undefined;
  return json(200, validateDocumentSafe(bag?.document));
}

async function handleParse(body: unknown): Promise<JsonResponse> {
  const bag = body as { mjml?: unknown } | null | undefined;
  if (!bag || typeof bag.mjml !== 'string') {
    return json(400, { error: 'Expected `{ mjml: string }`' });
  }
  try {
    const result = parseMjml(bag.mjml);
    return json(200, result);
  } catch (err) {
    return json(400, { error: errorMessage(err) });
  }
}

async function handleLint(body: unknown): Promise<JsonResponse> {
  const bag = body as { document?: unknown } | null | undefined;
  if (!bag?.document) return json(400, { error: 'Expected `{ document }`.' });
  const v = validateDocumentSafe(bag.document);
  if (!v.valid) return json(400, { error: 'Invalid document', validationErrors: v.errors });
  return json(200, lintDocument(bag.document as PigeonDocument));
}

async function handleLintAsync(body: unknown): Promise<JsonResponse> {
  const bag = body as { document?: unknown } | null | undefined;
  if (!bag?.document) return json(400, { error: 'Expected `{ document }`.' });
  const v = validateDocumentSafe(bag.document);
  if (!v.valid) return json(400, { error: 'Invalid document', validationErrors: v.errors });
  const report = await lintDocumentAsync(bag.document as PigeonDocument);
  return json(200, report);
}

// ---------------- brand kits -------------------------------------------------

async function routeBrandKits(req: JsonRequest, ctx: RouteContext): Promise<JsonResponse> {
  if (!ctx.brandKitStorage) return storageUnavailable('brand-kit');
  const id = req.path === '/brand-kits' ? null : req.path.slice('/brand-kits/'.length);

  if (req.method === 'GET' && !id) {
    return json(200, { brandKits: await ctx.brandKitStorage.list() });
  }
  if (req.method === 'GET' && id) {
    const kit = await ctx.brandKitStorage.get(id);
    return kit ? json(200, { brandKit: kit }) : json(404, { error: `Brand kit not found: ${id}` });
  }
  if (req.method === 'POST' && !id) {
    const bag = req.body as { brandKit?: unknown } | null | undefined;
    if (!bag?.brandKit) return json(400, { error: 'Expected `{ brandKit }`.' });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.brandKitStorage.save(bag.brandKit as any);
      return json(200, { ok: true });
    } catch (err) {
      return json(400, { error: errorMessage(err) });
    }
  }
  if (req.method === 'DELETE' && id) {
    await ctx.brandKitStorage.delete(id);
    return json(200, { ok: true });
  }
  return json(405, { error: `Method not allowed for brand-kit route: ${req.method} ${req.path}` });
}

// ---------------- assets -----------------------------------------------------

async function routeAssets(req: JsonRequest, ctx: RouteContext): Promise<JsonResponse> {
  if (!ctx.assetStorage) return storageUnavailable('asset');
  const id = req.path === '/assets' ? null : req.path.slice('/assets/'.length);

  if (req.method === 'GET' && !id) {
    return json(200, { assets: await ctx.assetStorage.list(parseAssetFilter(req.query)) });
  }
  if (req.method === 'GET' && id) {
    const asset = await ctx.assetStorage.get(id);
    return asset ? json(200, { asset }) : json(404, { error: `Asset not found: ${id}` });
  }
  if (req.method === 'POST' && !id) {
    const bag = req.body as { asset?: unknown } | null | undefined;
    if (!bag?.asset) return json(400, { error: 'Expected `{ asset }`.' });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.assetStorage.save(bag.asset as any);
      return json(200, { ok: true });
    } catch (err) {
      return json(400, { error: errorMessage(err) });
    }
  }
  if (req.method === 'DELETE' && id) {
    await ctx.assetStorage.delete(id);
    return json(200, { ok: true });
  }
  return json(405, { error: `Method not allowed for asset route: ${req.method} ${req.path}` });
}

function parseAssetFilter(query: Record<string, string | string[]> | undefined): AssetListFilter {
  if (!query) return {};
  const filter: AssetListFilter = {};
  if (typeof query.folder === 'string') filter.folder = query.folder;
  if (typeof query.search === 'string') filter.search = query.search;
  if (query.tags) filter.tags = Array.isArray(query.tags) ? query.tags : [query.tags];
  if (typeof query.limit === 'string' && /^\d+$/.test(query.limit)) filter.limit = Number(query.limit);
  if (typeof query.offset === 'string' && /^\d+$/.test(query.offset)) filter.offset = Number(query.offset);
  return filter;
}

// ---------------- helpers ----------------------------------------------------

function readDocAndOptions(
  body: unknown,
):
  | { document: PigeonDocument; options: RenderDocumentOptions }
  | { error: string } {
  if (body === null || typeof body !== 'object') {
    return { error: 'Expected `{ document, options? }` JSON body.' };
  }
  const bag = body as { document?: unknown; options?: unknown };
  if (!bag.document) return { error: 'Missing `document`.' };
  const options =
    bag.options && typeof bag.options === 'object'
      ? (bag.options as RenderDocumentOptions)
      : {};
  return { document: bag.document as PigeonDocument, options };
}

function storageUnavailable(kind: 'brand-kit' | 'asset'): JsonResponse {
  return json(503, {
    error: `${kind} storage is not configured on this server. Construct the handler with \`${kind === 'brand-kit' ? 'brandKitStorage' : 'assetStorage'}\` to enable this endpoint.`,
  });
}

function json(status: number, body: unknown): JsonResponse {
  return { status, body };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
