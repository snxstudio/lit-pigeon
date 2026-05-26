import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DocumentStore } from '../store/document-store.js';
import { textResult, jsonResult } from './reply.js';

const BlockTypeEnum = z.enum(['text', 'image', 'button', 'divider', 'spacer', 'social', 'html', 'hero', 'navbar']);

export function registerDocumentTools(server: McpServer, store: DocumentStore): void {
  server.registerTool(
    'create_document',
    {
      description:
        'Create a new, empty PigeonDocument and return its id. Use this id with every subsequent tool call.',
      inputSchema: {
        name: z.string().describe("Human-readable email title shown in the editor UI. Required.").optional(),
        previewText: z.string().describe('Preheader text shown in email-client inboxes (~80 chars).').optional(),
      },
    },
    async ({ name, previewText }) => {
      const { id, document } = store.create(name);
      if (previewText) store.setMetadata(id, { previewText });
      return jsonResult({ documentId: id, document });
    },
  );

  server.registerTool(
    'list_documents',
    {
      description: 'Return the ids, names, and updatedAt of every document held by this server.',
      inputSchema: {},
    },
    async () => jsonResult({ documents: store.list() }),
  );

  server.registerTool(
    'get_document',
    {
      description: 'Return the full JSON of a document by id.',
      inputSchema: { documentId: z.string() },
    },
    async ({ documentId }) => jsonResult({ document: store.get(documentId) }),
  );

  server.registerTool(
    'validate_document',
    {
      description:
        'Run validateDocument(doc) on the stored document. Returns an array of {path, message} errors. Empty array = valid.',
      inputSchema: { documentId: z.string() },
    },
    async ({ documentId }) => jsonResult({ errors: store.validate(documentId) }),
  );

  server.registerTool(
    'set_document_metadata',
    {
      description:
        'Patch the document.metadata (name, previewText). Any field omitted is left unchanged.',
      inputSchema: {
        documentId: z.string(),
        name: z.string().optional(),
        previewText: z.string().optional(),
      },
    },
    async ({ documentId, name, previewText }) => {
      const patch: { name?: string; previewText?: string } = {};
      if (name !== undefined) patch.name = name;
      if (previewText !== undefined) patch.previewText = previewText;
      store.setMetadata(documentId, patch);
      return textResult(`Metadata updated for ${documentId}.`);
    },
  );

  server.registerTool(
    'set_body_attribute',
    {
      description:
        'Update one attribute on body.attributes (width, backgroundColor, fontFamily, contentAlignment).',
      inputSchema: {
        documentId: z.string(),
        attribute: z.enum(['width', 'backgroundColor', 'fontFamily', 'contentAlignment']),
        // Accept either string OR number; the schema constrains downstream
        value: z.union([z.string(), z.number()]),
      },
    },
    async ({ documentId, attribute, value }) => {
      store.setBodyAttribute(documentId, attribute, value);
      return textResult(`Set body.${attribute} = ${JSON.stringify(value)} for ${documentId}.`);
    },
  );

  // Surface the block-type enum so the LLM has a single tool to query it.
  server.registerTool(
    'list_block_types',
    {
      description:
        'Return the set of supported block types. Use the value in `add_block.blockType`.',
      inputSchema: {},
    },
    async () => jsonResult({ blockTypes: BlockTypeEnum.options }),
  );
}
