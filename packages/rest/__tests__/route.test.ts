import { describe, it, expect } from 'vitest';
import {
  createBlock,
  createColumn,
  createDefaultDocument,
  createRow,
} from '@lit-pigeon/core';
import { handleRequest } from '../src/route.js';

function docWithText(content: string) {
  const doc = createDefaultDocument('Test');
  doc.body.rows.push(createRow([createColumn([createBlock('text', { content })])]));
  return doc;
}

describe('handleRequest', () => {
  it('GET /health returns 200', async () => {
    const res = await handleRequest({ method: 'GET', path: '/health', body: null });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('non-POST on a render route returns 405', async () => {
    const res = await handleRequest({ method: 'GET', path: '/render', body: null });
    expect(res.status).toBe(405);
  });

  it('unknown path returns 404', async () => {
    const res = await handleRequest({ method: 'POST', path: '/nope', body: {} });
    expect(res.status).toBe(404);
  });

  it('POST /render returns html + mjml', async () => {
    const document = docWithText('<p>Hello {{name}}</p>');
    const res = await handleRequest({
      method: 'POST',
      path: '/render',
      body: { document, options: { mergeTags: { name: 'Sam' } } },
    });
    expect(res.status).toBe(200);
    const body = res.body as { html: string; mjml: string; errors: unknown[] };
    expect(body.html).toContain('Hello Sam');
    expect(body.mjml).toContain('<mjml>');
    expect(body.errors).toEqual([]);
  });

  it('POST /render rejects an invalid document with 400 + validationErrors', async () => {
    const res = await handleRequest({
      method: 'POST',
      path: '/render',
      body: { document: { not: 'valid' } },
    });
    expect(res.status).toBe(400);
    const body = res.body as { error: string; validationErrors: unknown[] };
    expect(body.error).toBe('Invalid document');
    expect(Array.isArray(body.validationErrors)).toBe(true);
  });

  it('POST /render/mjml returns text/plain MJML', async () => {
    const document = createDefaultDocument('M');
    const res = await handleRequest({
      method: 'POST',
      path: '/render/mjml',
      body: { document },
    });
    expect(res.status).toBe(200);
    expect(res.contentType).toContain('text/plain');
    expect(typeof res.body).toBe('string');
    expect(res.body as string).toContain('<mjml>');
  });

  it('POST /validate returns the validation verdict', async () => {
    const res = await handleRequest({
      method: 'POST',
      path: '/validate',
      body: { document: createDefaultDocument() },
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: true, errors: [] });
  });

  it('POST /parse converts MJML back to a document', async () => {
    const mjml = `<mjml><mj-body><mj-section><mj-column><mj-text>Hi</mj-text></mj-column></mj-section></mj-body></mjml>`;
    const res = await handleRequest({ method: 'POST', path: '/parse', body: { mjml } });
    expect(res.status).toBe(200);
    const body = res.body as { document: { version: string }; warnings: unknown[] };
    expect(body.document.version).toBe('1.0');
  });

  it('POST /parse rejects non-string mjml with 400', async () => {
    const res = await handleRequest({ method: 'POST', path: '/parse', body: {} });
    expect(res.status).toBe(400);
  });

  it('POST /render rejects an empty body with 400', async () => {
    const res = await handleRequest({ method: 'POST', path: '/render', body: null });
    expect(res.status).toBe(400);
  });

  it('POST /lint returns a lint report for a real document', async () => {
    const document = createDefaultDocument('Hi');
    document.body.rows.push(
      createRow([createColumn([createBlock('image', { src: 'https://x/i.jpg', alt: '' })])]),
    );
    const res = await handleRequest({
      method: 'POST',
      path: '/lint',
      body: { document },
    });
    expect(res.status).toBe(200);
    const body = res.body as { issues: Array<{ rule: string }>; summary: { errors: number } };
    expect(body.summary.errors).toBeGreaterThan(0);
    expect(body.issues.some((i) => i.rule === 'alt-text/missing')).toBe(true);
  });

  it('POST /lint rejects an invalid document with 400', async () => {
    const res = await handleRequest({
      method: 'POST',
      path: '/lint',
      body: { document: { junk: true } },
    });
    expect(res.status).toBe(400);
  });

  it('POST /lint/async runs the async pass and still returns a report', async () => {
    const document = createDefaultDocument('Hi');
    document.body.rows.push(createRow([createColumn([createBlock('text', { content: '<p>hi</p>' })])]));
    const res = await handleRequest({
      method: 'POST',
      path: '/lint/async',
      body: { document },
    });
    expect(res.status).toBe(200);
    expect((res.body as { summary: object }).summary).toBeDefined();
  });
});
