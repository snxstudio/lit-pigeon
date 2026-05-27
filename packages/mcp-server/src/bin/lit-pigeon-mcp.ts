#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer } from '../server.js';
import { FsTemplateStorage } from '../store/fs-template-storage.js';

async function main() {
  // Persist templates by default so users keep their saved work across
  // restarts. The directory can be overridden via $LIT_PIGEON_TEMPLATES_DIR;
  // unset means `~/.lit-pigeon/templates`.
  const dir = process.env.LIT_PIGEON_TEMPLATES_DIR;
  const templateStorage = new FsTemplateStorage(dir ? { dir } : {});

  const { server } = buildServer({ templateStorage });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // stderr because stdout is the MCP framed channel.
  // eslint-disable-next-line no-console
  console.error('[lit-pigeon-mcp] fatal:', err);
  process.exit(1);
});
