import { z } from 'zod';
import { importFromFigma } from '@lit-pigeon/figma-import';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DocumentStore } from '../store/document-store.js';
import { jsonResult } from './reply.js';

export function registerFigmaTools(server: McpServer, store: DocumentStore): void {
  server.registerTool(
    'import_figma_frame',
    {
      description:
        'Fetch a Figma frame via the REST API, convert it into a PigeonDocument, and load it into the server. Returns the new documentId plus any conversion warnings. The Figma access token must be a personal-access token with file:read scope.',
      inputSchema: {
        fileKey: z
          .string()
          .describe('Figma file key — the segment after /file/ or /design/ in the URL.'),
        frameId: z
          .string()
          .describe('Node id of the frame to import — the `node-id` query param in a Figma share URL, URL-decoded.'),
        accessToken: z
          .string()
          .describe('Figma personal-access token. Get one from https://www.figma.com/developers/api#access-tokens.'),
        documentName: z.string().optional(),
        previewText: z.string().optional(),
        canvasWidth: z.number().int().min(300).max(800).optional(),
      },
    },
    async ({ fileKey, frameId, accessToken, documentName, previewText, canvasWidth }) => {
      const { document, warnings } = await importFromFigma(fileKey, frameId, accessToken, {
        documentName,
        previewText,
        canvasWidth,
      });
      const { id } = store.load(document);
      return jsonResult({ documentId: id, warnings, document });
    },
  );
}
