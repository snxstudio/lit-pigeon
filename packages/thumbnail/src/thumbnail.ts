import type { PigeonDocument, RenderError } from '@lit-pigeon/core';
import { renderDocument, type RenderDocumentOptions } from '@lit-pigeon/ssr';
import { launchChromium, type LaunchBrowser } from './browser.js';
import { withBudget } from './budget.js';

export interface RenderThumbnailOptions extends RenderDocumentOptions {
  /** Viewport width in CSS pixels. Default 600 — the usual email body width. */
  width?: number;
  /** Captured height in CSS pixels. Default 800. The page is cropped, not scaled. */
  height?: number;
  /** Pixel density of the capture. Default 1; use 2 for a retina thumbnail. */
  deviceScaleFactor?: number;
  /** Default `png`. `jpeg` is smaller but loses the flat colours emails use. */
  format?: 'png' | 'jpeg';
  /** JPEG quality 0-100. Ignored for PNG. */
  quality?: number;
  /**
   * Budget for the whole launch → load → capture sequence. Default 15000.
   * Exceeding it rejects with `ThumbnailTimeoutError` and closes the browser.
   */
  timeoutMs?: number;
  /** Supply a different browser, e.g. one already running. Default: Chromium via playwright-core. */
  launch?: LaunchBrowser;
  /** Path to the browser binary, passed to the default launcher. */
  executablePath?: string;
  /** Extra browser flags, passed to the default launcher. See `LaunchOptions.args`. */
  browserArgs?: string[];
}

export interface ThumbnailResult {
  /** `data:image/png;base64,…` — the shape `Template.thumbnail` documents. */
  thumbnail: string;
  width: number;
  height: number;
  /** Errors from the HTML render step. The image is still produced. */
  errors: RenderError[];
}

const DEFAULTS = { width: 600, height: 800, deviceScaleFactor: 1, timeoutMs: 15_000 } as const;

/**
 * Rasterise a document to a preview image.
 *
 * Renders the document to email HTML through the normal pipeline, then
 * screenshots it in a headless browser, so the thumbnail shows the same
 * markup a recipient gets rather than a re-drawing of the editor canvas.
 */
export async function renderThumbnail(
  doc: PigeonDocument,
  options: RenderThumbnailOptions = {},
): Promise<ThumbnailResult> {
  const width = options.width ?? DEFAULTS.width;
  const height = options.height ?? DEFAULTS.height;
  const format = options.format ?? 'png';
  const launch = options.launch ?? launchChromium;

  const { html, errors } = await renderDocument(doc, options);

  const bytes = await withBudget(options.timeoutMs ?? DEFAULTS.timeoutMs, async (keep) => {
    const browser = await launch({
      executablePath: options.executablePath,
      args: options.browserArgs,
    });
    keep(() => browser.close());
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: options.deviceScaleFactor ?? DEFAULTS.deviceScaleFactor,
    });
    // `load` rather than `networkidle`: remote images that never answer are
    // ordinary in email markup, and the budget above is the real backstop.
    await page.setContent(html, { waitUntil: 'load' });
    return page.screenshot({
      type: format,
      ...(format === 'jpeg' && options.quality !== undefined ? { quality: options.quality } : {}),
      clip: { x: 0, y: 0, width, height },
    });
  });

  return {
    thumbnail: `data:image/${format};base64,${Buffer.from(bytes).toString('base64')}`,
    width,
    height,
    errors,
  };
}
