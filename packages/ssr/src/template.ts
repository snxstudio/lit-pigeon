import type { Template } from '@lit-pigeon/core';
import { renderDocument, type RenderDocumentOptions, type RenderDocumentResult } from './render.js';

export type RenderTemplateOptions = RenderDocumentOptions;

/**
 * Render a stored `Template` to HTML. Useful when a transactional service
 * loads a template by id from its database and needs to ship the rendered
 * email immediately.
 */
export function renderTemplate(
  template: Template,
  options: RenderTemplateOptions = {},
): Promise<RenderDocumentResult> {
  return renderDocument(template.document, options);
}
