import { lookup } from 'node:dns/promises';
import { BlockList } from 'node:net';
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

const PRIVATE_NETWORKS = new BlockList();
PRIVATE_NETWORKS.addSubnet('0.0.0.0', 8);
PRIVATE_NETWORKS.addSubnet('10.0.0.0', 8);
PRIVATE_NETWORKS.addSubnet('100.64.0.0', 10);
PRIVATE_NETWORKS.addSubnet('127.0.0.0', 8);
PRIVATE_NETWORKS.addSubnet('169.254.0.0', 16);
PRIVATE_NETWORKS.addSubnet('172.16.0.0', 12);
PRIVATE_NETWORKS.addSubnet('192.168.0.0', 16);
PRIVATE_NETWORKS.addAddress('::', 'ipv6');
PRIVATE_NETWORKS.addAddress('::1', 'ipv6');
PRIVATE_NETWORKS.addSubnet('fc00::', 7, 'ipv6');
PRIVATE_NETWORKS.addSubnet('fe80::', 10, 'ipv6');

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
      javaScriptEnabled: false,
    });
    await page.route('**/*', async (route) => {
      // Can outlive the budget closing the page; a rejection here would be unhandled.
      try {
        const request = route.request();
        if (request.isNavigationRequest()) {
          await route.abort();
          return;
        }
        let url = new URL(request.url());
        // The browser follows redirects without asking again, so each hop is checked here.
        for (let hop = 0; hop < 5; hop += 1) {
          if (url.protocol !== 'http:' && url.protocol !== 'https:') break;
          const addresses = await lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true });
          if (addresses.some((a) => PRIVATE_NETWORKS.check(a.address, a.family === 6 ? 'ipv6' : 'ipv4'))) break;
          const response = await route.fetch({ url: url.href, maxRedirects: 0 });
          const location = response.headers().location;
          if (response.status() < 300 || response.status() > 399 || !location) {
            await route.fulfill({ response });
            return;
          }
          url = new URL(location, url);
        }
        await route.abort();
      } catch {
        await route.abort().catch(() => {});
      }
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
