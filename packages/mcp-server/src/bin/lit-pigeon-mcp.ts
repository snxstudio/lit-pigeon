#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer } from '../server.js';
import { FsTemplateStorage } from '../store/fs-template-storage.js';
import { FsBrandKitStorage } from '../store/fs-brand-kit-storage.js';
import { FsAssetStorage } from '../store/fs-asset-storage.js';

async function main() {
  // Persist templates, brand kits, and assets by default so users keep their
  // saved work across restarts. Override directories per-resource via env vars;
  // unset means `~/.lit-pigeon/<resource>`.
  const tplDir = process.env.LIT_PIGEON_TEMPLATES_DIR;
  const kitDir = process.env.LIT_PIGEON_BRAND_KITS_DIR;
  const assetDir = process.env.LIT_PIGEON_ASSETS_DIR;

  const templateStorage = new FsTemplateStorage(tplDir ? { dir: tplDir } : {});
  const brandKitStorage = new FsBrandKitStorage(kitDir ? { dir: kitDir } : {});
  const assetStorage = new FsAssetStorage(assetDir ? { dir: assetDir } : {});

  const { server } = buildServer({ templateStorage, brandKitStorage, assetStorage });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // stderr because stdout is the MCP framed channel.
  // eslint-disable-next-line no-console
  console.error('[lit-pigeon-mcp] fatal:', err);
  process.exit(1);
});
