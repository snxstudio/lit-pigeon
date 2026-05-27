import { z } from 'zod';
import { InMemoryTemplateStorage, type Template, type TemplateStorage } from '@lit-pigeon/core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DocumentStore } from '../store/document-store.js';
import { jsonResult, textResult } from './reply.js';

const TemplateCategoryEnum = z.enum([
  'welcome',
  'newsletter',
  'transactional',
  'promo',
  'announcement',
  'other',
]);

export function registerTemplateTools(
  server: McpServer,
  store: DocumentStore,
  storage?: TemplateStorage,
): void {
  // Default to the in-memory implementation so existing embedders keep their
  // session-scoped behaviour. Embedders that want persistence pass an explicit
  // storage (e.g. `FsTemplateStorage`).
  const templates: TemplateStorage = storage ?? new InMemoryTemplateStorage();

  server.registerTool(
    'list_templates',
    {
      description:
        'List every available template — the 4 starters (welcome, newsletter, transactional, promo) plus any saved during this session.',
      inputSchema: {},
    },
    async () => {
      const all = await templates.list();
      // Strip the document from the listing to keep the payload small;
      // load_template returns the full thing.
      const summary = all.map(({ document: _document, ...meta }) => meta);
      return jsonResult({ templates: summary });
    },
  );

  server.registerTool(
    'load_template',
    {
      description:
        'Load a template into the server\'s document store. Returns the new documentId — the original template stays unchanged so subsequent loads of the same template create independent documents.',
      inputSchema: { templateId: z.string() },
    },
    async ({ templateId }) => {
      const tpl = await templates.get(templateId);
      if (!tpl) throw new Error(`Template not found: ${templateId}`);
      const { id, document } = store.load(structuredClone(tpl.document));
      return jsonResult({ documentId: id, template: { id: tpl.id, name: tpl.name }, document });
    },
  );

  server.registerTool(
    'save_template',
    {
      description:
        'Snapshot a stored document as a reusable template. Provide a stable `templateId` (kebab-case slug) to upsert; a fresh id otherwise creates a new entry.',
      inputSchema: {
        documentId: z.string(),
        templateId: z
          .string()
          .regex(/^[a-z0-9][a-z0-9-]*$/i, 'templateId must be kebab-case, alphanumeric + hyphens.'),
        name: z.string(),
        description: z.string().optional(),
        category: TemplateCategoryEnum.optional(),
        thumbnail: z.string().optional(),
      },
    },
    async ({ documentId, templateId, name, description, category, thumbnail }) => {
      const document = store.get(documentId);
      const now = new Date().toISOString();
      const template: Template = {
        id: templateId,
        name,
        description,
        category,
        thumbnail,
        document: structuredClone(document),
        createdAt: now,
        updatedAt: now,
      };
      await templates.save(template);
      return textResult(`Saved template "${name}" (id: ${templateId}).`);
    },
  );

  server.registerTool(
    'delete_template',
    {
      description:
        'Remove a template by id. Starter templates can be deleted from this session\'s storage but will reappear if the server restarts.',
      inputSchema: { templateId: z.string() },
    },
    async ({ templateId }) => {
      await templates.delete(templateId);
      return textResult(`Deleted template ${templateId}.`);
    },
  );
}
