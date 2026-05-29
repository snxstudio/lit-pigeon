import { z } from 'zod';
import {
  InMemoryAssetStorage,
  type Asset,
  type AssetStorage,
} from '@lit-pigeon/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { jsonResult, textResult } from './reply.js';

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/i, 'id must be kebab-case.');

export function registerAssetTools(
  server: McpServer,
  storage?: AssetStorage,
): void {
  const assets: AssetStorage = storage ?? new InMemoryAssetStorage();

  server.registerTool(
    'list_assets',
    {
      description:
        'List managed assets newest-first. Optional filters narrow by folder, tag, free-text search, or pagination.',
      inputSchema: {
        folder: z.string().optional(),
        search: z.string().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().optional(),
      },
    },
    async (filter) => {
      const list = await assets.list(filter);
      return jsonResult({ assets: list });
    },
  );

  server.registerTool(
    'get_asset',
    {
      description: 'Return the metadata for one asset.',
      inputSchema: { assetId: idSchema },
    },
    async ({ assetId }) => {
      const asset = await assets.get(assetId);
      if (!asset) throw new Error(`Asset not found: ${assetId}`);
      return jsonResult({ asset });
    },
  );

  server.registerTool(
    'save_asset',
    {
      description:
        'Upsert an asset record. The `src` URL points at the actual file (S3, CDN, etc.) — this catalog only stores metadata.',
      inputSchema: {
        assetId: idSchema,
        name: z.string(),
        src: z.string(),
        alt: z.string().optional(),
        mimeType: z.string().optional(),
        sizeBytes: z.number().int().nonnegative().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        folder: z.string().optional(),
        tags: z.array(z.string()).optional(),
      },
    },
    async (input) => {
      const now = new Date().toISOString();
      const asset: Asset = {
        id: input.assetId,
        name: input.name,
        src: input.src,
        alt: input.alt,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        folder: input.folder ?? '/',
        tags: input.tags ?? [],
        createdAt: now,
        updatedAt: now,
      };
      await assets.save(asset);
      return textResult(`Saved asset "${input.name}" (id: ${input.assetId}).`);
    },
  );

  server.registerTool(
    'delete_asset',
    {
      description: 'Remove one asset metadata record by id. Does not touch the underlying file.',
      inputSchema: { assetId: idSchema },
    },
    async ({ assetId }) => {
      await assets.delete(assetId);
      return textResult(`Deleted asset ${assetId}.`);
    },
  );

  server.registerTool(
    'list_asset_folders',
    {
      description: 'List every folder path used across saved assets.',
      inputSchema: {},
    },
    async () => jsonResult({ folders: await assets.listFolders() }),
  );
}
