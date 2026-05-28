import { z } from 'zod';
import {
  InMemoryBrandKitStorage,
  type BrandKit,
  type BrandKitStorage,
} from '@lit-pigeon/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { jsonResult, textResult } from './reply.js';

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/i, 'id must be kebab-case.');

const colorSchema = z.object({
  id: idSchema,
  name: z.string(),
  value: z.string(),
});
const fontSchema = z.object({
  id: idSchema,
  name: z.string(),
  family: z.string(),
  weights: z.array(z.number().int()).optional(),
  url: z.string().optional(),
});
const logoSchema = z.object({
  id: idSchema,
  name: z.string(),
  src: z.string(),
  width: z.number().int().positive().optional(),
});

export function registerBrandKitTools(
  server: McpServer,
  storage?: BrandKitStorage,
): void {
  const kits: BrandKitStorage = storage ?? new InMemoryBrandKitStorage();

  server.registerTool(
    'list_brand_kits',
    {
      description: 'List every saved brand kit (id, name, counts only — call get_brand_kit for full content).',
      inputSchema: {},
    },
    async () => {
      const all = await kits.list();
      const summary = all.map((k) => ({
        id: k.id,
        name: k.name,
        description: k.description,
        colors: k.colors.length,
        fonts: k.fonts.length,
        logos: k.logos.length,
        updatedAt: k.updatedAt,
      }));
      return jsonResult({ brandKits: summary });
    },
  );

  server.registerTool(
    'get_brand_kit',
    {
      description: 'Return the full content of a brand kit by id.',
      inputSchema: { brandKitId: idSchema },
    },
    async ({ brandKitId }) => {
      const kit = await kits.get(brandKitId);
      if (!kit) throw new Error(`Brand kit not found: ${brandKitId}`);
      return jsonResult({ brandKit: kit });
    },
  );

  server.registerTool(
    'save_brand_kit',
    {
      description: 'Upsert a brand kit. Pass the same `brandKitId` to update an existing one.',
      inputSchema: {
        brandKitId: idSchema,
        name: z.string(),
        description: z.string().optional(),
        colors: z.array(colorSchema).default([]),
        fonts: z.array(fontSchema).default([]),
        logos: z.array(logoSchema).default([]),
      },
    },
    async ({ brandKitId, name, description, colors, fonts, logos }) => {
      const now = new Date().toISOString();
      const kit: BrandKit = {
        id: brandKitId,
        name,
        description,
        colors,
        fonts,
        logos,
        createdAt: now,
        updatedAt: now,
      };
      await kits.save(kit);
      return textResult(`Saved brand kit "${name}" (id: ${brandKitId}).`);
    },
  );

  server.registerTool(
    'delete_brand_kit',
    {
      description: 'Remove a brand kit by id.',
      inputSchema: { brandKitId: idSchema },
    },
    async ({ brandKitId }) => {
      await kits.delete(brandKitId);
      return textResult(`Deleted brand kit ${brandKitId}.`);
    },
  );
}
