#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer } from '../server.js';

async function main() {
  const { server } = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // stderr because stdout is the MCP framed channel.
  // eslint-disable-next-line no-console
  console.error('[lit-pigeon-mcp] fatal:', err);
  process.exit(1);
});
