import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DocumentStore } from './store/document-store.js';
import { registerDocumentTools } from './tools/document.js';
import { registerStructureTools } from './tools/structure.js';
import { registerRenderTools } from './tools/render.js';
import { registerFigmaTools } from './tools/figma.js';

export interface BuildServerOptions {
  /** Override the default in-memory store (e.g. for tests or persistence). */
  store?: DocumentStore;
  /** Server name reported in initialize. Default: `lit-pigeon`. */
  name?: string;
  /** Server version reported in initialize. Default: package version. */
  version?: string;
}

/**
 * Construct a fully-wired Lit Pigeon MCP server. The returned `McpServer`
 * is unconnected — call `.connect(transport)` to start serving.
 */
export function buildServer(opts: BuildServerOptions = {}): { server: McpServer; store: DocumentStore } {
  const store = opts.store ?? new DocumentStore();
  const server = new McpServer({
    name: opts.name ?? 'lit-pigeon',
    version: opts.version ?? '0.1.0',
  });

  registerDocumentTools(server, store);
  registerStructureTools(server, store);
  registerRenderTools(server, store);
  registerFigmaTools(server, store);

  return { server, store };
}
