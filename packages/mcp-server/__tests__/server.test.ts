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
        'delete_block',
        'get_document',
        'list_block_types',
        'list_documents',
        'render_to_html',
        'render_to_mjml',
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
});
