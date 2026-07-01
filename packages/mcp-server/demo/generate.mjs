#!/usr/bin/env node
// Reference-clip generator for @lit-pigeon/mcp-server.
//
// Spawns the REAL MCP server over stdio and runs the actual tool-call sequence
// an AI agent would issue to build a transactional order-confirmation email,
// then renders it to HTML. The terminal "demo" is built from that real run —
// the block ids, byte size and error count printed in the cast all come from
// live server responses, so nothing is faked.
//
// Outputs (into demo/out/):
//   order-confirmation.html  — the real rendered email
//   demo.cast                — asciinema v2 recording of the agent session
//
// Convert the cast to a shareable GIF/MP4 (install once: `brew install agg`):
//   agg demo/out/demo.cast demo/out/demo.gif
// or play it locally: `asciinema play demo/out/demo.cast`

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Cast, c } from './cast.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, '..', 'dist', 'bin', 'lit-pigeon-mcp.js');
const OUT = process.argv[2] ? process.argv[2] : join(HERE, 'out');

const PROMPT =
  'Build a transactional order-confirmation email for our store — logo header, ' +
  'a "Your order is confirmed" heading, the order summary, and a "View your order" ' +
  'button in our brand indigo. Then render it to email-safe HTML.';

const INDIGO = '#4f46e5';

// Unwrap a callTool result whose payload is JSON in content[0].text.
function payload(res) {
  const text = res?.content?.find((p) => p.type === 'text')?.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

async function run() {
  const transport = new StdioClientTransport({ command: 'node', args: [SERVER] });
  const client = new Client({ name: 'lit-pigeon-demo', version: '1.0.0' });
  await client.connect(transport);

  const steps = [];
  const call = async (label, name, args) => {
    const res = await client.callTool({ name, arguments: args });
    const data = payload(res);
    steps.push({ label, name, data });
    return data;
  };

  // 1. New document
  const doc = await call('Creating the email document', 'create_document', {
    name: 'Order #10482 — Confirmed',
    previewText: 'Thanks for your order — here are the details.',
  });
  const documentId = doc.documentId;

  await call('Setting body width to 600px', 'set_body_attribute', {
    documentId,
    attribute: 'width',
    value: 600,
  });

  // 2. Header row — logo + heading + intro
  const header = await call('Adding the header row', 'add_row', { documentId, columnCount: 1 });
  const hcol = header.columnIds[0];
  await call('Logo image', 'add_block', {
    documentId,
    rowId: header.rowId,
    columnId: hcol,
    blockType: 'image',
    values: { src: 'https://lit-pigeon.wearesnx.studio/lit-pigeon.png', alt: 'Acme', width: 120 },
  });
  await call('Heading: "Your order is confirmed"', 'add_block', {
    documentId,
    rowId: header.rowId,
    columnId: hcol,
    blockType: 'text',
    values: { content: '<h1>Your order is confirmed 🎉</h1>' },
  });
  await call('Intro line', 'add_block', {
    documentId,
    rowId: header.rowId,
    columnId: hcol,
    blockType: 'text',
    values: { content: '<p>Hi Alex, thanks for shopping with us. Order <strong>#10482</strong> is on its way.</p>' },
  });

  // 3. Order summary row — summary + CTA button
  const body = await call('Adding the order-summary row', 'add_row', { documentId, columnCount: 1 });
  const bcol = body.columnIds[0];
  await call('Order summary', 'add_block', {
    documentId,
    rowId: body.rowId,
    columnId: bcol,
    blockType: 'text',
    values: {
      content:
        '<p><strong>1× Aeropress Go</strong> — $39.00<br/>' +
        '<strong>1× Filter pack (350)</strong> — $12.00<br/>' +
        'Shipping — $0.00<br/><strong>Total — $51.00</strong></p>',
    },
  });
  await call('"View your order" button', 'add_block', {
    documentId,
    rowId: body.rowId,
    columnId: bcol,
    blockType: 'button',
    values: { content: '<p>View your order</p>', href: 'https://shop.example.com/orders/10482', backgroundColor: INDIGO },
  });

  // 4. Footer row — divider + fine print
  const footer = await call('Adding the footer row', 'add_row', { documentId, columnCount: 1 });
  const fcol = footer.columnIds[0];
  await call('Divider', 'add_block', {
    documentId,
    rowId: footer.rowId,
    columnId: fcol,
    blockType: 'divider',
    values: {},
  });
  await call('Footer fine print', 'add_block', {
    documentId,
    rowId: footer.rowId,
    columnId: fcol,
    blockType: 'text',
    values: { content: "<p style=\"font-size:12px;color:#666\">Questions? Reply to this email or contact support@example.com.</p>" },
  });

  // 5. Render
  const rendered = await call('Rendering to email-safe HTML', 'render_to_html', {
    documentId,
    inlineCss: true,
  });

  await client.close();

  return { steps, html: rendered.html, errors: rendered.errors ?? [], documentId };
}

function buildCast({ steps, html, errors }) {
  const cast = new Cast({ width: 96, height: 32, title: 'Build a transactional email with @lit-pigeon/mcp-server' });
  const bytes = Buffer.byteLength(html, 'utf-8');
  const toolCalls = steps.length;

  // Scene: a Cursor-style agent session in the terminal.
  cast.line(`${c.gray}# Cursor — MCP server "lit-pigeon" connected (27 tools)${c.reset}`, 0.4);
  cast.line();
  cast.out(`${c.cyan}${c.bold}you ${c.reset}${c.dim}›${c.reset} `, 0.3);
  cast.type(PROMPT, { cps: 42 });
  cast.line('', 0.1).line();
  cast.pause(0.5);
  cast.line(`${c.magenta}${c.bold}lit-pigeon${c.reset} ${c.dim}is building your email…${c.reset}`, 0.2);
  cast.line();

  for (const s of steps) {
    const id =
      s.data.documentId || s.data.rowId || s.data.blockId || (s.data.html ? 'rendered' : 'ok');
    cast.out(`  ${c.yellow}⏺${c.reset} ${c.bold}${s.name}${c.reset}  ${c.gray}${s.label}${c.reset}`, 0.18);
    cast.line('', 0.12);
    cast.line(`    ${c.green}✓${c.reset} ${c.dim}${id}${c.reset}`, 0.18);
  }

  cast.line();
  const status =
    errors.length === 0
      ? `${c.green}${c.bold}✓ rendered cleanly${c.reset}`
      : `${c.red}${c.bold}⚠ ${errors.length} error(s)${c.reset}`;
  cast.line(
    `  ${status} ${c.dim}—${c.reset} ${c.bold}${(bytes / 1024).toFixed(1)} kB${c.reset} ${c.dim}email-safe HTML, ${toolCalls} MCP calls${c.reset} ${c.dim}→${c.reset} ${c.cyan}order-confirmation.html${c.reset}`,
    0.4,
  );
  cast.line();
  cast.line(`${c.gray}# Drop it into Litmus, or send via any ESP. No editor, no lock-in.${c.reset}`, 0.3);
  cast.pause(2.5);
  return cast;
}

const result = await run();
await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'order-confirmation.html'), result.html, 'utf-8');
await writeFile(join(OUT, 'demo.cast'), buildCast(result).serialize(), 'utf-8');

const bytes = Buffer.byteLength(result.html, 'utf-8');
console.log(`✓ ${result.steps.length} MCP calls · ${(bytes / 1024).toFixed(1)} kB HTML · ${result.errors.length} render error(s)`);
console.log(`  → ${join(OUT, 'order-confirmation.html')}`);
console.log(`  → ${join(OUT, 'demo.cast')}`);
console.log(`\nConvert to GIF:  agg ${join(OUT, 'demo.cast')} ${join(OUT, 'demo.gif')}`);
console.log(`Play locally:    asciinema play ${join(OUT, 'demo.cast')}`);
