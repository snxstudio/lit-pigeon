import type { PigeonDocument, RenderError, RenderOptions } from '@lit-pigeon/core';
import { documentToMjml, MjmlRenderer } from '@lit-pigeon/renderer-mjml';
import { applyMergeTags, type MergeTagValues } from './merge-tags.js';

export interface RenderDocumentOptions extends RenderOptions {
  /**
   * Merge-tag values to substitute into the rendered HTML.
   * Keys map `{{key}}` placeholders; missing keys are left intact (or replaced
   * via `mergeTagFallback`).
   */
  mergeTags?: MergeTagValues;
  /**
   * Value used when a placeholder has no entry in `mergeTags`. Default: leave
   * the `{{key}}` placeholder untouched, which is useful for downstream ESP
   * substitution.
   */
  mergeTagFallback?: string;
}

export interface RenderDocumentResult {
  /** Email-client-safe HTML, already merge-tag substituted if values were supplied. */
  html: string;
  /** The intermediate MJML markup, exposed for debugging and snapshot tests. */
  mjml: string;
  /** Renderer errors (empty array on success). */
  errors: RenderError[];
}

const renderer = new MjmlRenderer();

/**
 * Render a `PigeonDocument` to email HTML. Stateless and safe to call from
 * any server context — no DOM, no globals, no editor instance required.
 */
export async function renderDocument(
  doc: PigeonDocument,
  options: RenderDocumentOptions = {},
): Promise<RenderDocumentResult> {
  const mjml = documentToMjml(doc, { outlookWorkarounds: options.outlookWorkarounds });
  const result = await renderer.render(doc, options);
  const html =
    options.mergeTags && Object.keys(options.mergeTags).length > 0
      ? applyMergeTags(result.html, options.mergeTags, { fallback: options.mergeTagFallback })
      : result.html;
  return { html, mjml, errors: result.errors };
}

/** Render a document straight to MJML markup (no `mjml2html` pass). */
export function renderDocumentToMjml(
  doc: PigeonDocument,
  options: Pick<RenderOptions, 'outlookWorkarounds'> = {},
): string {
  return documentToMjml(doc, { outlookWorkarounds: options.outlookWorkarounds });
}
