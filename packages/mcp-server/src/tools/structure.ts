import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DocumentStore } from '../store/document-store.js';
import { jsonResult, textResult } from './reply.js';

const BlockTypeEnum = z.enum(['text', 'image', 'button', 'divider', 'spacer', 'social', 'html', 'hero', 'navbar']);

export function registerStructureTools(server: McpServer, store: DocumentStore): void {
  server.registerTool(
    'add_row',
    {
      description:
        'Append a new row to the body. Specify either `columnCount` (1-4) for an even split, or `ratios` summing to 12 (e.g. [8,4]). Returns the new row id and the ids of each fresh column.',
      inputSchema: {
        documentId: z.string(),
        columnCount: z.number().int().min(1).max(4).optional(),
        ratios: z.array(z.number().int().min(1).max(12)).min(1).max(4).optional(),
      },
    },
    async ({ documentId, columnCount, ratios }) => {
      const { row, columnIds } = store.addRow(documentId, { columnCount, ratios });
      return jsonResult({ rowId: row.id, columnIds, columnRatios: row.columnRatios });
    },
  );

  server.registerTool(
    'add_block',
    {
      description:
        'Append a new block (text, image, button, divider, spacer, social, html, hero, navbar) to a specific column. `values` may partially override the default values for that block type.',
      inputSchema: {
        documentId: z.string(),
        rowId: z.string(),
        columnId: z.string(),
        blockType: BlockTypeEnum,
        values: z.record(z.string(), z.unknown()).optional(),
      },
    },
    async ({ documentId, rowId, columnId, blockType, values }) => {
      const block = store.addBlock(documentId, rowId, columnId, blockType, values);
      return jsonResult({ blockId: block.id, block });
    },
  );

  server.registerTool(
    'update_block',
    {
      description:
        'Patch a block\'s `values`. Only the fields you pass are changed; everything else is preserved. The resulting document is validated; if invalid, the change is reverted and an error is returned.',
      inputSchema: {
        documentId: z.string(),
        rowId: z.string(),
        columnId: z.string(),
        blockId: z.string(),
        values: z.record(z.string(), z.unknown()),
      },
    },
    async ({ documentId, rowId, columnId, blockId, values }) => {
      const block = store.updateBlock(documentId, rowId, columnId, blockId, values);
      return jsonResult({ block });
    },
  );

  server.registerTool(
    'delete_block',
    {
      description: 'Remove a block from a column.',
      inputSchema: {
        documentId: z.string(),
        rowId: z.string(),
        columnId: z.string(),
        blockId: z.string(),
      },
    },
    async ({ documentId, rowId, columnId, blockId }) => {
      store.deleteBlock(documentId, rowId, columnId, blockId);
      return textResult(`Deleted block ${blockId}.`);
    },
  );
}
