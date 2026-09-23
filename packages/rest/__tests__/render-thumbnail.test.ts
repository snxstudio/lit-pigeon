import { describe, it, expect, vi } from 'vitest';
import { createBlock, createColumn, createDefaultDocument, createRow } from '@lit-pigeon/core';
import { handleRequest, type ThumbnailRenderer } from '../src/route.js';

function document() {
  const doc = createDefaultDocument('Test');
  doc.body.rows.push(createRow([createColumn([createBlock('text', { content: '<p>Hi</p>' })])]));
  return doc;
}

const ok: ThumbnailRenderer = async () => ({
  thumbnail: 'data:image/png;base64,AAAA',
  width: 600,
  height: 800,
});

function post(body: unknown, renderer?: ThumbnailRenderer) {
  return handleRequest(
    { method: 'POST', path: '/render/thumbnail', body },
    renderer ? { thumbnailRenderer: renderer } : {},
  );
}

describe('POST /render/thumbnail', () => {
  it('returns 503 when no renderer is configured', async () => {
    const res = await post({ document: document() });
    expect(res.status).toBe(503);
    expect((res.body as { error: string }).error).toContain('@lit-pigeon/thumbnail');
  });

  it('returns the thumbnail when a renderer is configured', async () => {
    const res = await post({ document: document() }, ok);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ thumbnail: 'data:image/png;base64,AAAA', width: 600, height: 800 });
  });

  it('passes the request options through to the renderer', async () => {
    const renderer = vi.fn<ThumbnailRenderer>(ok);
    await post({ document: document(), options: { width: 320, mergeTags: { name: 'Sam' } } }, renderer);
    expect(renderer.mock.calls[0][1]).toEqual({ width: 320, mergeTags: { name: 'Sam' } });
  });

  it('rejects a missing document with 400 before touching the renderer', async () => {
    const renderer = vi.fn<ThumbnailRenderer>(ok);
    const res = await post({}, renderer);
    expect(res.status).toBe(400);
    expect(renderer).not.toHaveBeenCalled();
  });

  it('rejects an invalid document with 400 + validationErrors', async () => {
    const res = await post({ document: { junk: true } }, ok);
    expect(res.status).toBe(400);
    expect((res.body as { validationErrors: unknown[] }).validationErrors.length).toBeGreaterThan(0);
  });

  it.each(['BROWSER_UNAVAILABLE', 'THUMBNAIL_TIMEOUT'])(
    'reports a %s failure as 503, not 500',
    async (code) => {
      const res = await post({ document: document() }, async () => {
        throw Object.assign(new Error('nope'), { code });
      });
      expect(res.status).toBe(503);
    },
  );

  it('reports any other renderer failure as 500', async () => {
    const res = await post({ document: document() }, async () => {
      throw new Error('something else broke');
    });
    expect(res.status).toBe(500);
    expect((res.body as { error: string }).error).toBe('something else broke');
  });

  it('is POST-only', async () => {
    const res = await handleRequest(
      { method: 'GET', path: '/render/thumbnail', body: null },
      { thumbnailRenderer: ok },
    );
    expect(res.status).toBe(405);
  });
});
