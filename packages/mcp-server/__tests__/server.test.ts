import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../src/server.js';

interface ContentItem {
  type: string;
  text?: string;
}

/** Pull the JSON payload out of a tool reply (each tool returns one text item). */
function parseReply<T>(reply: { content?: ContentItem[] }): T {
  const text = reply.content?.[0]?.text ?? '';
  return JSON.parse(text) as T;
}

function rawText(reply: { content?: ContentItem[] }): string {
  return reply.content?.[0]?.text ?? '';
}

async function newClientPair() {
  const { server } = buildServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '0.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, server };
}

describe('@lit-pigeon/mcp-server', () => {
  let client: Client;

  beforeEach(async () => {
    const pair = await newClientPair();
    client = pair.client;
  });

  it('listTools returns the documented surface', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(
      [
        'add_block',
        'add_row',
        'create_document',
        'delete_asset',
        'delete_block',
        'delete_brand_kit',
        'delete_template',
        'get_asset',
        'get_brand_kit',
        'get_document',
        'import_figma_frame',
        'list_asset_folders',
        'list_assets',
        'list_block_types',
        'list_brand_kits',
        'list_documents',
        'list_templates',
        'load_template',
        'render_to_html',
        'render_to_mjml',
        'save_asset',
        'save_brand_kit',
        'save_template',
        'set_body_attribute',
        'set_document_metadata',
        'update_block',
        'validate_document',
      ].sort(),
    );
  });

  it('create_document → list_documents → get_document round-trips', async () => {
    const created = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'create_document', arguments: { name: 'Hello' } }),
    );
    expect(created.documentId).toBeTruthy();

    const list = parseReply<{ documents: Array<{ id: string; name: string }> }>(
      await client.callTool({ name: 'list_documents', arguments: {} }),
    );
    expect(list.documents).toHaveLength(1);
    expect(list.documents[0]).toMatchObject({ id: created.documentId, name: 'Hello' });

    const fetched = parseReply<{ document: { metadata: { name: string } } }>(
      await client.callTool({ name: 'get_document', arguments: { documentId: created.documentId } }),
    );
    expect(fetched.document.metadata.name).toBe('Hello');
  });

  it('end-to-end: build a doc → render to MJML and HTML', async () => {
    const { documentId } = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'create_document', arguments: { name: 'Welcome' } }),
    );
    const { rowId, columnIds } = parseReply<{ rowId: string; columnIds: string[] }>(
      await client.callTool({ name: 'add_row', arguments: { documentId, columnCount: 1 } }),
    );
    await client.callTool({
      name: 'add_block',
      arguments: {
        documentId, rowId, columnId: columnIds[0],
        blockType: 'text',
        values: { content: '<p>Hello, {{firstName}}.</p>' },
      },
    });
    await client.callTool({
      name: 'add_block',
      arguments: {
        documentId, rowId, columnId: columnIds[0],
        blockType: 'button',
        values: { content: '<p>Get started</p>', href: 'https://example.com/start' },
      },
    });

    const mjml = rawText(
      await client.callTool({ name: 'render_to_mjml', arguments: { documentId } }),
    );
    expect(mjml).toContain('<mjml>');
    expect(mjml).toContain('{{firstName}}');
    expect(mjml).toContain('Get started');

    const renderResult = parseReply<{ html: string; errors: unknown[] }>(
      await client.callTool({ name: 'render_to_html', arguments: { documentId } }),
    );
    expect(renderResult.errors).toEqual([]);
    expect(renderResult.html).toContain('<!doctype html>');
    expect(renderResult.html).toContain('Get started');
  });

  it('update_block patches values and the result re-validates', async () => {
    const { documentId } = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'create_document', arguments: {} }),
    );
    const { rowId, columnIds } = parseReply<{ rowId: string; columnIds: string[] }>(
      await client.callTool({ name: 'add_row', arguments: { documentId, columnCount: 1 } }),
    );
    const { blockId } = parseReply<{ blockId: string }>(
      await client.callTool({
        name: 'add_block',
        arguments: { documentId, rowId, columnId: columnIds[0], blockType: 'text' },
      }),
    );

    const updated = parseReply<{ block: { values: { content: string } } }>(
      await client.callTool({
        name: 'update_block',
        arguments: {
          documentId, rowId, columnId: columnIds[0], blockId,
          values: { content: '<p>Hi</p>' },
        },
      }),
    );
    expect(updated.block.values.content).toBe('<p>Hi</p>');

    const validation = parseReply<{ errors: unknown[] }>(
      await client.callTool({ name: 'validate_document', arguments: { documentId } }),
    );
    expect(validation.errors).toEqual([]);
  });

  it('add_row with ratios accepts a 2-column split', async () => {
    const { documentId } = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'create_document', arguments: {} }),
    );
    const { columnIds } = parseReply<{ rowId: string; columnIds: string[]; columnRatios: number[] }>(
      await client.callTool({ name: 'add_row', arguments: { documentId, ratios: [8, 4] } }),
    );
    expect(columnIds).toHaveLength(2);
  });

  it('add_row rejects ratios that do not sum to 12', async () => {
    const { documentId } = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'create_document', arguments: {} }),
    );
    const result = await client.callTool({
      name: 'add_row',
      arguments: { documentId, ratios: [4, 4] },
    });
    // Errors from tool callbacks surface as isError: true on the result.
    expect(result.isError).toBe(true);
  });

  it('list_block_types enumerates the supported types', async () => {
    const { blockTypes } = parseReply<{ blockTypes: string[] }>(
      await client.callTool({ name: 'list_block_types', arguments: {} }),
    );
    expect(blockTypes.sort()).toEqual(
      ['text', 'image', 'button', 'divider', 'spacer', 'social', 'html', 'hero', 'navbar'].sort(),
    );
  });

  it('list_templates returns the 4 starters with no document payload', async () => {
    const { templates } = parseReply<{ templates: Array<{ id: string; name: string; document?: unknown }> }>(
      await client.callTool({ name: 'list_templates', arguments: {} }),
    );
    expect(templates.map((t) => t.id).sort()).toEqual(
      ['starter-newsletter', 'starter-promo', 'starter-transactional', 'starter-welcome'].sort(),
    );
    // Listing must NOT carry the full document — keep payloads small.
    expect(templates[0].document).toBeUndefined();
  });

  it('load_template hydrates a starter into the store and renders cleanly', async () => {
    const loaded = parseReply<{ documentId: string; template: { id: string; name: string } }>(
      await client.callTool({ name: 'load_template', arguments: { templateId: 'starter-welcome' } }),
    );
    expect(loaded.template.id).toBe('starter-welcome');
    expect(loaded.documentId).toBeTruthy();

    const rendered = parseReply<{ html: string; errors: unknown[] }>(
      await client.callTool({ name: 'render_to_html', arguments: { documentId: loaded.documentId } }),
    );
    expect(rendered.errors).toEqual([]);
    expect(rendered.html).toContain('Welcome');
  });

  it('save_template snapshots a stored document and load_template recreates it', async () => {
    // Build a tiny document
    const { documentId } = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'create_document', arguments: { name: 'Source' } }),
    );
    const { rowId, columnIds } = parseReply<{ rowId: string; columnIds: string[] }>(
      await client.callTool({ name: 'add_row', arguments: { documentId, columnCount: 1 } }),
    );
    await client.callTool({
      name: 'add_block',
      arguments: {
        documentId, rowId, columnId: columnIds[0],
        blockType: 'text',
        values: { content: '<p>Snapshot me</p>' },
      },
    });

    await client.callTool({
      name: 'save_template',
      arguments: {
        documentId, templateId: 'my-custom', name: 'My custom template', category: 'other',
      },
    });

    const { documentId: loadedDocId } = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'load_template', arguments: { templateId: 'my-custom' } }),
    );
    expect(loadedDocId).not.toBe(documentId); // a fresh doc, not the original

    const html = parseReply<{ html: string }>(
      await client.callTool({ name: 'render_to_html', arguments: { documentId: loadedDocId } }),
    );
    expect(html.html).toContain('Snapshot me');
  });

  it('save_template rejects a non-kebab-case templateId', async () => {
    const { documentId } = parseReply<{ documentId: string }>(
      await client.callTool({ name: 'create_document', arguments: {} }),
    );
    const result = await client.callTool({
      name: 'save_template',
      arguments: { documentId, templateId: 'Has Spaces!', name: 'x' },
    });
    expect(result.isError).toBe(true);
  });

  it('load_template returns an error for unknown ids', async () => {
    const result = await client.callTool({ name: 'load_template', arguments: { templateId: 'nope' } });
    expect(result.isError).toBe(true);
  });

  it('import_figma_frame imports a frame (via globally-mocked fetch) and loads it into the store', async () => {
    // Mock the global fetch for the duration of this test.
    const realFetch = globalThis.fetch;
    const figmaFrame = {
      id: '0:1',
      name: 'Mocked frame',
      type: 'FRAME',
      absoluteBoundingBox: { x: 0, y: 0, width: 600, height: 400 },
      layoutMode: 'VERTICAL',
      children: [
        {
          id: '1:1',
          type: 'TEXT',
          name: 'Headline',
          characters: 'Hi from Figma',
          fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
          style: { fontSize: 24, fontWeight: 700, textAlignHorizontal: 'CENTER' },
        },
      ],
    };
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      if (url.includes('/nodes?')) {
        return new Response(JSON.stringify({ nodes: { '0:1': { document: figmaFrame } } }), { status: 200 });
      }
      if (url.endsWith('/images')) {
        return new Response(JSON.stringify({ meta: { images: {} } }), { status: 200 });
      }
      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    try {
      const result = parseReply<{ documentId: string; warnings: string[]; document: { metadata: { name: string } } }>(
        await client.callTool({
          name: 'import_figma_frame',
          arguments: { fileKey: 'FILE_KEY', frameId: '0:1', accessToken: 'tok' },
        }),
      );
      expect(result.documentId).toBeTruthy();
      expect(result.document.metadata.name).toBe('Mocked frame');
      expect(result.warnings).toEqual([]);

      // Doc is now in the store; we can render it.
      const rendered = parseReply<{ html: string; errors: unknown[] }>(
        await client.callTool({ name: 'render_to_html', arguments: { documentId: result.documentId } }),
      );
      expect(rendered.errors).toEqual([]);
      expect(rendered.html).toContain('Hi from Figma');
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
