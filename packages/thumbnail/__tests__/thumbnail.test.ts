import { describe, it, expect, vi } from 'vitest';
import { createBlock, createColumn, createDefaultDocument, createRow } from '@lit-pigeon/core';
import { renderThumbnail } from '../src/thumbnail.js';
import { ThumbnailTimeoutError } from '../src/budget.js';
import { BrowserUnavailableError, launchChromium } from '../src/browser.js';
import type { LaunchBrowser, ThumbnailBrowser, ThumbnailPage } from '../src/browser.js';

function doc(content = '<p>Hello</p>') {
  const d = createDefaultDocument('Test');
  d.body.rows.push(createRow([createColumn([createBlock('text', { content })])]));
  return d;
}

const PIXEL = new Uint8Array([137, 80, 78, 71]);

interface Fake {
  launch: LaunchBrowser;
  closed: () => number;
  page: ThumbnailPage;
  newPageOptions: () => unknown;
  setContentHtml: () => string;
  screenshotOptions: () => unknown;
}

function fakeBrowser(overrides: Partial<ThumbnailPage> = {}): Fake {
  let closes = 0;
  let newPageOptions: unknown;
  let setContentHtml = '';
  let screenshotOptions: unknown;

  const page: ThumbnailPage = {
    setContent: async (html) => {
      setContentHtml = html;
    },
    screenshot: async (options) => {
      screenshotOptions = options;
      return PIXEL;
    },
    ...overrides,
  };

  const browser: ThumbnailBrowser = {
    newPage: async (options) => {
      newPageOptions = options;
      return page;
    },
    close: async () => {
      closes += 1;
    },
  };

  return {
    launch: async () => browser,
    closed: () => closes,
    page,
    newPageOptions: () => newPageOptions,
    setContentHtml: () => setContentHtml,
    screenshotOptions: () => screenshotOptions,
  };
}

describe('renderThumbnail', () => {
  it('screenshots the rendered email HTML and returns a PNG data URL', async () => {
    const fake = fakeBrowser();
    const result = await renderThumbnail(doc('<p>Hello thumbnail</p>'), { launch: fake.launch });

    expect(fake.setContentHtml()).toContain('Hello thumbnail');
    expect(fake.setContentHtml()).toContain('<!doctype html');
    expect(result.thumbnail).toBe(`data:image/png;base64,${Buffer.from(PIXEL).toString('base64')}`);
    expect(result.errors).toEqual([]);
  });

  it('defaults to a 600x800 viewport and clips the capture to it', async () => {
    const fake = fakeBrowser();
    const result = await renderThumbnail(doc(), { launch: fake.launch });

    expect(fake.newPageOptions()).toEqual({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1 });
    expect(fake.screenshotOptions()).toMatchObject({
      type: 'png',
      clip: { x: 0, y: 0, width: 600, height: 800 },
    });
    expect(result).toMatchObject({ width: 600, height: 800 });
  });

  it('honours width, height and deviceScaleFactor', async () => {
    const fake = fakeBrowser();
    const result = await renderThumbnail(doc(), {
      launch: fake.launch,
      width: 320,
      height: 240,
      deviceScaleFactor: 2,
    });

    expect(fake.newPageOptions()).toEqual({ viewport: { width: 320, height: 240 }, deviceScaleFactor: 2 });
    expect(result).toMatchObject({ width: 320, height: 240 });
  });

  it('passes quality through for JPEG only', async () => {
    const jpeg = fakeBrowser();
    const jpegResult = await renderThumbnail(doc(), { launch: jpeg.launch, format: 'jpeg', quality: 70 });
    expect(jpeg.screenshotOptions()).toMatchObject({ type: 'jpeg', quality: 70 });
    expect(jpegResult.thumbnail.startsWith('data:image/jpeg;base64,')).toBe(true);

    const png = fakeBrowser();
    await renderThumbnail(doc(), { launch: png.launch, quality: 70 });
    expect(png.screenshotOptions()).not.toHaveProperty('quality');
  });

  it('substitutes merge tags before rasterising', async () => {
    const fake = fakeBrowser();
    await renderThumbnail(doc('<p>Hi {{name}}</p>'), {
      launch: fake.launch,
      mergeTags: { name: 'Sam' },
    });
    expect(fake.setContentHtml()).toContain('Hi Sam');
    expect(fake.setContentHtml()).not.toContain('{{name}}');
  });

  it('closes the browser on the happy path', async () => {
    const fake = fakeBrowser();
    await renderThumbnail(doc(), { launch: fake.launch });
    expect(fake.closed()).toBe(1);
  });

  it('closes the browser when the screenshot throws', async () => {
    const fake = fakeBrowser({
      screenshot: async () => {
        throw new Error('render crashed');
      },
    });
    await expect(renderThumbnail(doc(), { launch: fake.launch })).rejects.toThrow('render crashed');
    expect(fake.closed()).toBe(1);
  });
});

describe('the time budget', () => {
  it('rejects with ThumbnailTimeoutError when a page never loads', async () => {
    const fake = fakeBrowser({ setContent: () => new Promise<void>(() => {}) });
    await expect(renderThumbnail(doc(), { launch: fake.launch, timeoutMs: 20 })).rejects.toBeInstanceOf(
      ThumbnailTimeoutError,
    );
  });

  it('still closes a browser whose page hangs', async () => {
    const fake = fakeBrowser({ setContent: () => new Promise<void>(() => {}) });
    await expect(renderThumbnail(doc(), { launch: fake.launch, timeoutMs: 20 })).rejects.toThrow();
    expect(fake.closed()).toBe(1);
  });

  it('closes a browser whose launch resolves after the deadline', async () => {
    const fake = fakeBrowser();
    let closes = 0;
    const late: LaunchBrowser = async (options) => {
      await new Promise((r) => setTimeout(r, 60));
      const browser = await fake.launch(options);
      return {
        newPage: browser.newPage.bind(browser),
        close: async () => {
          closes += 1;
        },
      };
    };

    await expect(renderThumbnail(doc(), { launch: late, timeoutMs: 20 })).rejects.toBeInstanceOf(
      ThumbnailTimeoutError,
    );
    // The launch is still in flight when we give up; the browser it hands back
    // must not be left running.
    await vi.waitFor(() => expect(closes).toBe(1), { timeout: 1000 });
  });
});

describe('launchChromium', () => {
  it('reports a missing browser as BrowserUnavailableError', async () => {
    await expect(launchChromium({ executablePath: '/nonexistent/chromium' })).rejects.toBeInstanceOf(
      BrowserUnavailableError,
    );
  });

  it('carries a code callers can branch on without importing this package', async () => {
    const err = await launchChromium({ executablePath: '/nonexistent/chromium' }).catch((e) => e);
    expect(err.code).toBe('BROWSER_UNAVAILABLE');
  });
});
