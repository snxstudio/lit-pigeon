/**
 * The slice of a headless browser this package drives.
 *
 * Deliberately structural and small: a real Playwright `Browser` satisfies
 * `ThumbnailBrowser` as-is and tests can pass a fake. Any other driver has to
 * supply request interception that can fetch without following redirects. Nothing here imports a browser driver — the default
 * launcher below is the only place `playwright-core` is named, and it is
 * imported dynamically so hosts that never take a thumbnail never load it.
 */

export interface ThumbnailResponse {
  status(): number;
  headers(): Record<string, string>;
}

export interface ThumbnailRoute {
  request(): { url(): string; isNavigationRequest(): boolean };
  abort(): Promise<void>;
  fetch(options?: { url?: string; maxRedirects?: number }): Promise<ThumbnailResponse>;
  fulfill(options?: { response?: ThumbnailResponse }): Promise<void>;
}

export interface ThumbnailPage {
  route(url: string, handler: (route: ThumbnailRoute) => Promise<void>): Promise<unknown>;
  setContent(html: string, options?: { waitUntil?: 'load' | 'domcontentloaded' }): Promise<void>;
  screenshot(options?: {
    type?: 'png' | 'jpeg';
    quality?: number;
    clip?: { x: number; y: number; width: number; height: number };
  }): Promise<Uint8Array>;
}

export interface ThumbnailBrowser {
  newPage(options?: {
    viewport?: { width: number; height: number };
    deviceScaleFactor?: number;
    javaScriptEnabled?: boolean;
  }): Promise<ThumbnailPage>;
  close(): Promise<void>;
}

export interface LaunchOptions {
  /** Path to the browser binary. Required where it is not on the default path. */
  executablePath?: string;
  /**
   * Extra browser flags. Empty by default: the sandbox stays on, because the
   * HTML being rasterised comes from a document the service did not write.
   * Containers that run as root typically need `--no-sandbox` here, which is
   * a decision for whoever owns the container, not for this package.
   */
  args?: string[];
}

export type LaunchBrowser = (options: LaunchOptions) => Promise<ThumbnailBrowser>;

/** Thrown when no usable browser is installed, so callers can answer 503 rather than 500. */
export class BrowserUnavailableError extends Error {
  readonly code = 'BROWSER_UNAVAILABLE';

  constructor(cause?: unknown) {
    super(
      'No headless browser available. Install the optional peer dependency ' +
        '`playwright-core` and a Chromium build, or pass your own `launch`.',
    );
    this.name = 'BrowserUnavailableError';
    this.cause = cause;
  }
}

/** Default launcher: Chromium via `playwright-core`, if the host installed it. */
export const launchChromium: LaunchBrowser = async (options) => {
  let chromium: typeof import('playwright-core').chromium;
  try {
    ({ chromium } = await import('playwright-core'));
  } catch (err) {
    throw new BrowserUnavailableError(err);
  }
  try {
    return await chromium.launch({
      executablePath: options.executablePath,
      args: options.args ?? [],
    });
  } catch (err) {
    throw new BrowserUnavailableError(err);
  }
};
