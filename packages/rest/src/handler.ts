import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AssetStorage, BrandKitStorage } from '@lit-pigeon/core';
import { handleRequest, type RouteContext } from './route.js';

export interface CreateHandlerOptions {
  /** Require this exact bearer token on every request. */
  bearerToken?: string;
  /**
   * Max request body size in bytes. Bodies larger than this return 413.
   * Default 5 MB — large enough for a sizeable email JSON.
   */
  maxBodyBytes?: number;
  /**
   * CORS `Access-Control-Allow-Origin` value. Default `*`. Set `false` to
   * disable CORS headers entirely.
   */
  cors?: string | false;
  /**
   * Optional brand-kit persistence. When supplied, `/brand-kits` endpoints
   * are enabled; otherwise they 503.
   */
  brandKitStorage?: BrandKitStorage;
  /**
   * Optional asset-library persistence. When supplied, `/assets` endpoints
   * are enabled; otherwise they 503.
   */
  assetStorage?: AssetStorage;
}

/**
 * Node `http`-compatible request handler — works with `http.createServer`,
 * Express (`app.use(handler)`), Fastify (via `fastify.use`), and Connect.
 */
export type RestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void>;

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Build a Node HTTP handler that serves the Lit Pigeon REST API. Stateless
 * and zero-config — pass it to `http.createServer(handler)` or `app.use()`.
 */
export function createHandler(options: CreateHandlerOptions = {}): RestHandler {
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BYTES;
  const cors = options.cors ?? '*';
  const ctx: RouteContext = {
    ...(options.bearerToken ? { bearerToken: options.bearerToken } : {}),
    ...(options.brandKitStorage ? { brandKitStorage: options.brandKitStorage } : {}),
    ...(options.assetStorage ? { assetStorage: options.assetStorage } : {}),
  };

  return async function handler(req, res) {
    if (cors !== false) applyCorsHeaders(res, cors);

    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }

    if (options.bearerToken) {
      const auth = req.headers['authorization'];
      if (auth !== `Bearer ${options.bearerToken}`) {
        return writeJson(res, 401, { error: 'Unauthorized' });
      }
    }

    const method = (req.method ?? 'GET').toUpperCase();
    const [rawPath, rawQuery] = (req.url ?? '/').split('?');
    const path = rawPath;
    const query = parseQuery(rawQuery);

    let body: unknown = null;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
      try {
        body = await readJsonBody(req, maxBodyBytes);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const status = message.startsWith('Payload too large') ? 413 : 400;
        return writeJson(res, status, { error: message });
      }
    }

    try {
      const result = await handleRequest({ method, path, body, query }, ctx);
      writeResponse(res, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      writeJson(res, 500, { error: message });
    }
  };
}

function parseQuery(raw: string | undefined): Record<string, string | string[]> {
  if (!raw) return {};
  const out: Record<string, string | string[]> = {};
  for (const pair of raw.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    const key = decodeURIComponent(eq >= 0 ? pair.slice(0, eq) : pair);
    const value = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : '';
    if (key in out) {
      const existing = out[key];
      out[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      out[key] = value;
    }
  }
  return out;
}

function applyCorsHeaders(res: ServerResponse, origin: string): void {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function writeResponse(
  res: ServerResponse,
  result: { status: number; body: unknown; contentType?: string },
): void {
  if (result.contentType) {
    res.writeHead(result.status, { 'content-type': result.contentType });
    res.end(typeof result.body === 'string' ? result.body : String(result.body));
    return;
  }
  writeJson(res, result.status, result.body);
}

function readJsonBody(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    req.on('data', (chunk: Buffer) => {
      received += chunk.length;
      if (received > maxBytes) {
        req.destroy();
        reject(new Error(`Payload too large (>${maxBytes} bytes)`));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error(`Invalid JSON: ${(err as Error).message}`));
      }
    });
    req.on('error', reject);
  });
}
