import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ROOT = process.argv[2];
const PORT = Number(process.env.PORT ?? 4310);
const CSP = process.env.CSP;
const log = [];
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon', '.png': 'image/png' };
const TEMPLATE = `<mjml><mj-head><mj-preview>Hi there</mj-preview></mj-head><mj-body>
<mj-wrapper padding="20px" background-color="#eeeeee"><mj-section><mj-column>
<mj-text>Hello {{first_name}}</mj-text>
<mj-image src="/uploads/logo.png" alt="Logo" />
<mj-button href="https://example.com">Go</mj-button>
</mj-column></mj-section></mj-wrapper></mj-body></mjml>`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const body = (req) => new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const auth = req.headers.authorization ?? null;
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/_log') return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(log));
    const entry = { method: req.method, path: url.pathname, auth };
    log.push(entry);
    if (auth !== 'Bearer test-token') return res.writeHead(401).end();
    if (url.pathname.startsWith('/api/email-templates/')) {
      if (req.method === 'GET') return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ mjml: TEMPLATE, html: '' }));
      const saved = JSON.parse((await body(req)).toString());
      entry.mjmlLength = saved.mjml.length; entry.htmlLength = saved.html.length;
      entry.hasDivider = saved.mjml.includes('<mj-divider'); entry.htmlDoctype = /<!doctype html>/i.test(saved.html);
      return res.writeHead(204).end();
    }
    if (url.pathname === '/api/merge-tags') return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify([{ name: '{{first_name}}', label: 'First name', sample: 'Ada' }]));
    if (url.pathname === '/api/email-assets') {
      const raw = await body(req);
      entry.multipart = /name="file"/.test(raw.toString('latin1'));
      return res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ url: `http://localhost:${PORT}/uploads/pixel.png` }));
    }
    return res.writeHead(404).end();
  }
  if (url.pathname.startsWith('/uploads/')) return res.writeHead(200, { 'content-type': 'image/png' }).end(PNG);
  const headers = CSP ? { 'content-security-policy': CSP } : {};
  let file = join(ROOT, url.pathname);
  let data;
  try { data = await readFile(file); } catch { file = join(ROOT, 'index.html'); data = await readFile(file); }
  res.writeHead(200, { ...headers, 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(data);
}).listen(PORT, () => console.log(`serving ${ROOT} on ${PORT}`));
