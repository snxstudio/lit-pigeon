import mjml2html from 'mjml';
import type {
  PigeonDocument,
  Renderer,
  RenderOptions,
  RenderResult,
  RenderError,
} from '@lit-pigeon/core';
import { documentToMjml } from './document-to-mjml.js';

/**
 * MJML-based renderer that implements the Pigeon Renderer interface.
 *
 * Converts a PigeonDocument into a full MJML markup string, then uses
 * the mjml library to compile it into responsive HTML email output.
 */
export class MjmlRenderer implements Renderer {
  /**
   * Renders a PigeonDocument to HTML using MJML as the compilation backend.
   *
   * @param doc - The Pigeon email document to render
   * @param options - Optional rendering configuration (minify, beautify, inlineCss)
   * @returns A promise resolving to the rendered HTML and any errors
   */
  async render(doc: PigeonDocument, options?: RenderOptions): Promise<RenderResult> {
    const mjmlMarkup = documentToMjml(doc);

    const mjmlOptions: Record<string, unknown> = {
      // By default MJML inlines CSS; respect the option if provided
      keepComments: false,
    };

    if (options?.minify) {
      mjmlOptions.minify = true;
    }

    if (options?.beautify) {
      mjmlOptions.beautify = true;
    }

    // MJML inlines CSS by default. The inlineCss option is true by default in our interface.
    // There is no direct MJML option to disable inlining, but we note it for completeness.

    try {
      const result = mjml2html(mjmlMarkup, mjmlOptions);

      const errors: RenderError[] = (result.errors || []).map((err) => ({
        message: err.message,
        line: err.line,
        tagName: err.tagName,
      }));

      return {
        html: result.html,
        errors,
      };
    } catch (error) {
      // If MJML throws an unrecoverable error, wrap it as a RenderError
      const message = error instanceof Error ? error.message : String(error);
      return {
        html: '',
        errors: [{ message: `MJML compilation failed: ${message}` }],
      };
    }
  }
}
