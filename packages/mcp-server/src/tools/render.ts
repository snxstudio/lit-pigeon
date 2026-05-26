import { z } from 'zod';
import { documentToMjml, MjmlRenderer } from '@lit-pigeon/renderer-mjml';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DocumentStore } from '../store/document-store.js';
import { jsonResult, textResult } from './reply.js';

export function registerRenderTools(server: McpServer, store: DocumentStore): void {
  const renderer = new MjmlRenderer();

  server.registerTool(
    'render_to_mjml',
    {
      description: 'Serialize the stored document to MJML markup. Returns the MJML string.',
      inputSchema: { documentId: z.string() },
    },
    async ({ documentId }) => {
      const doc = store.get(documentId);
      const mjml = documentToMjml(doc);
      return textResult(mjml);
    },
  );

  server.registerTool(
    'render_to_html',
    {
      description:
        'Render the stored document to email-client-safe HTML (via MJML). Returns the HTML string plus any renderer errors as JSON: { html, errors }.',
      inputSchema: {
        documentId: z.string(),
        minify: z.boolean().optional(),
        beautify: z.boolean().optional(),
        inlineCss: z.boolean().optional(),
      },
    },
    async ({ documentId, minify, beautify, inlineCss }) => {
      const doc = store.get(documentId);
      const result = await renderer.render(doc, { minify, beautify, inlineCss });
      return jsonResult({ html: result.html, errors: result.errors });
    },
  );
}
