// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import nodemailer from 'nodemailer';
import { createBlock, type ContentBlock } from '@lit-pigeon/core';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { renderDocument } from '@lit-pigeon/ssr';
import { loadForSending, sendTemplate } from '../src/server-side/send-email.js';
import { createApp } from '../src/server-side/rest-server.js';
import { starter } from './helpers.js';
import '../src/custom-blocks/register.js';

function withGreeting() {
  const doc = starter();
  (doc.body.rows[1].columns[0].blocks[0].values as { content: string }).content = '<p>Hello {{first_name}}{{unknown}}</p>';
  return doc;
}

describe('server side: render and send', () => {
  it('rebuilds from MJML or JSON and validates', () => {
    const doc = withGreeting();
    expect(loadForSending({ mjml: documentToMjml(doc) }).body.rows).toHaveLength(doc.body.rows.length);
    expect(loadForSending({ document: doc })).toBe(doc);
    expect(() => loadForSending({ document: { version: '1.0' } })).toThrow(/Invalid template/);
  });

  it('personalises, escapes and sends one message per recipient', async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const sent: string[] = [];
    const original = transport.sendMail.bind(transport);
    transport.sendMail = (async (mail: Parameters<typeof original>[0]) => {
      const info = await original(mail);
      sent.push(JSON.parse((info as unknown as { message: string }).message).html);
      return info;
    }) as typeof transport.sendMail;
    await sendTemplate(transport, withGreeting(), 'Hello', [
      { email: 'ada@example.com', first_name: 'Ada' },
      { email: 'eve@example.com', first_name: '<Eve>' },
    ]);
    expect(sent).toHaveLength(2);
    expect(sent[0]).toContain('Hello Ada</p>');
    expect(sent[1]).toContain('Hello &lt;Eve&gt;</p>');
  });

  it('refuses to send when lint reports errors', async () => {
    const doc = withGreeting();
    (doc.body.rows[1].columns[0].blocks[0].values as { content: string }).content = '<p>Hello {{first_name}</p>';
    const transport = nodemailer.createTransport({ jsonTransport: true });
    await expect(sendTemplate(transport, doc, 's', [{ email: 'a@example.com', first_name: 'A' }])).rejects.toThrow(/`\{\{`/);
  });

  it('leaves unknown tags without a fallback, and mjml omits fonts', async () => {
    const fonts = [{ name: 'Inter', family: 'Inter, Arial', url: 'https://fonts.example.com/inter.css' }];
    const result = await renderDocument(withGreeting(), { mergeTags: { first_name: 'Ada' }, fonts });
    expect(result.html).toContain('Hello Ada{{unknown}}');
    expect(result.html).toContain('https://fonts.example.com/inter.css');
    expect(result.mjml).not.toContain('mj-font');
  });
});

describe('server side: REST handler', () => {
  let server: Server;
  let base: string;
  beforeAll(async () => {
    server = createApp('secret').listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/email`;
  });
  afterAll(() => server.close());

  const post = (path: string, body: unknown, token = 'secret') =>
    fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) });

  it('renders with a bearer token', async () => {
    const res = await post('/render', { document: starter(), options: { mergeTags: { first_name: 'Ada' } } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { html: string; mjml: string; errors: unknown[] };
    expect(body.html).toMatch(/<!doctype html>/i);
    expect(body.errors).toEqual([]);
  });

  it('rejects a wrong token, parses MJML, and rejects custom blocks', async () => {
    expect((await post('/render', { document: starter() }, 'wrong')).status).toBe(401);
    const parsed = await post('/parse', { mjml: documentToMjml(starter()) });
    expect(((await parsed.json()) as { document: { version: string } }).document.version).toBe('1.0');
    const doc = starter();
    doc.body.rows[0].columns[0].blocks = [createBlock('callout') as ContentBlock];
    const res = await post('/render', { document: doc });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe('Invalid document');
  });

  it('returns 503 for storage routes without storage, and MJML as text', async () => {
    const res = await fetch(`${base}/assets`, { headers: { authorization: 'Bearer secret' } });
    expect(res.status).toBe(503);
    const mjml = await post('/render/mjml', { document: starter() });
    expect(mjml.headers.get('content-type')).toContain('text/plain');
  });
});
