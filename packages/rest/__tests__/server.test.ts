import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import {
  createBlock,
  createColumn,
  createDefaultDocument,
  createRow,
} from '@lit-pigeon/core';
import { createServer } from '../src/server.js';

let server: Server;
let baseUrl: string;

beforeEach(async () => {
  const started = createServer();
  server = started.server;
  const { host, port } = await started.ready;
  baseUrl = `http://${host}:${port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('createServer (HTTP end-to-end)', () => {
  it('GET /health returns 200 JSON', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('POST /render with a real document round-trips through the wire', async () => {
    const document = createDefaultDocument('Hi');
    document.body.rows.push(
      createRow([createColumn([createBlock('text', { content: '<p>Hello {{name}}</p>' })])]),
    );
    const res = await fetch(`${baseUrl}/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ document, options: { mergeTags: { name: 'Sam' } } }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { html: string; mjml: string };
    expect(body.html).toContain('Hello Sam');
    expect(body.mjml).toContain('<mjml>');
  });

  it('POST /render/mjml returns text/plain MJML', async () => {
    const res = await fetch(`${baseUrl}/render/mjml`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ document: createDefaultDocument() }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('<mjml>');
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await fetch(`${baseUrl}/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    expect(res.status).toBe(400);
  });

  it('sets CORS headers by default', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('handles preflight OPTIONS with 204', async () => {
    const res = await fetch(`${baseUrl}/render`, { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });
});

describe('createServer auth', () => {
  let authServer: Server;
  let authUrl: string;

  beforeEach(async () => {
    const started = createServer({ bearerToken: 'secret' });
    authServer = started.server;
    const { host, port } = await started.ready;
    authUrl = `http://${host}:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => authServer.close(() => resolve()));
  });

  it('rejects requests without a matching bearer token with 401', async () => {
    const res = await fetch(`${authUrl}/health`);
    expect(res.status).toBe(401);
  });

  it('accepts requests with the matching token', async () => {
    const res = await fetch(`${authUrl}/health`, {
      headers: { authorization: 'Bearer secret' },
    });
    expect(res.status).toBe(200);
  });
});
