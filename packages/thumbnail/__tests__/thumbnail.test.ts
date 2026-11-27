import { describe, it, expect, vi } from 'vitest';
import { createBlock, createColumn, createDefaultDocument, createRow } from '@lit-pigeon/core';
import { renderThumbnail } from '../src/thumbnail.js';
import { ThumbnailTimeoutError } from '../src/budget.js';
import { BrowserUnavailableError, launchChromium } from '../src/browser.js';
import type { LaunchBrowser, ThumbnailBrowser, ThumbnailPage, ThumbnailRoute } from '../src/browser.js';

vi.mock('node:dns/promises', async (importOriginal) => {
  const dns = await importOriginal<typeof import('node:dns/promises')>();
  return {
    ...dns,
    lookup: async (hostname: string, options: object) =>
      hostname === 'assets.example.com'
        ? [{ address: '127.0.0.1', family: 4 }]
        : dns.lookup(hostname, options),
  };
});

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
  routeHandler: () => (route: ThumbnailRoute) => Promise<void>;
}

function fakeBrowser(overrides: Partial<ThumbnailPage> = {}): Fake {
  let closes = 0;
  let newPageOptions: unknown;
  let setContentHtml = '';
  let screenshotOptions: unknown;
  let routeHandler: (route: ThumbnailRoute) => Promise<void> = async () => {};

  const page: ThumbnailPage = {
    route: async (_url, handler) => {
      routeHandler = handler;
    },
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
    routeHandler: () => routeHandler,
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

    expect(fake.newPageOptions()).toEqual({
      viewport: { width: 600, height: 800 },
      deviceScaleFactor: 1,
      javaScriptEnabled: false,
    });
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

    expect(fake.newPageOptions()).toMatchObject({ viewport: { width: 320, height: 240 }, deviceScaleFactor: 2 });
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

describe('the network policy', () => {
  const PUBLIC = 'http://93.184.216.34/logo.png';

  async function send(
    url: string,
    responses: Array<{ status: number; location?: string }> = [{ status: 200 }],
    navigation = false,
  ) {
    const fake = fakeBrowser();
    await renderThumbnail(doc(), { launch: fake.launch });
    const fetched: string[] = [];
    let outcome = '';
    await fake.routeHandler()({
      request: () => ({ url: () => url, isNavigationRequest: () => navigation }),
      abort: async () => {
        outcome = 'aborted';
      },
      fetch: async (options) => {
        fetched.push(options?.url ?? '');
        const { status, location } = responses[fetched.length - 1];
        return { status: () => status, headers: () => (location ? { location } : {}) };
      },
      fulfill: async () => {
        outcome = 'fulfilled';
      },
    });
    return { outcome, fetched };
  }

  it.each([
    'http://127.0.0.1:8080/admin',
    'http://localhost/admin',
    'http://10.0.0.5/',
    'http://172.16.0.1/',
    'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://100.100.100.200/latest/meta-data/',
    'http://0.0.0.0/',
    'http://2130706433/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[fe80::1]/',
    'http://[fd00::1]/',
    'file:///etc/passwd',
    'ftp://93.184.216.34/logo.png',
  ])('blocks %s without requesting it', async (url) => {
    expect(await send(url)).toEqual({ outcome: 'aborted', fetched: [] });
  });

  it('blocks a public-looking hostname that resolves to a loopback address', async () => {
    expect(await send('https://assets.example.com/logo.png')).toEqual({ outcome: 'aborted', fetched: [] });
  });

  it('allows an image on a public address', async () => {
    expect(await send(PUBLIC)).toEqual({ outcome: 'fulfilled', fetched: [PUBLIC] });
  });

  it('follows a redirect between public addresses', async () => {
    const result = await send(PUBLIC, [{ status: 302, location: '/moved.png' }, { status: 200 }]);
    expect(result).toEqual({ outcome: 'fulfilled', fetched: [PUBLIC, 'http://93.184.216.34/moved.png'] });
  });

  it('blocks a redirect from a public address to a private one', async () => {
    const result = await send(PUBLIC, [{ status: 302, location: 'http://169.254.169.254/latest/meta-data/' }]);
    expect(result).toEqual({ outcome: 'aborted', fetched: [PUBLIC] });
  });

  it('gives up on a redirect loop', async () => {
    const result = await send(PUBLIC, Array(5).fill({ status: 302, location: PUBLIC }));
    expect(result.outcome).toBe('aborted');
    expect(result.fetched).toHaveLength(5);
  });

  it('blocks frame navigations, even to a public address', async () => {
    expect(await send(PUBLIC, [{ status: 200 }], true)).toEqual({ outcome: 'aborted', fetched: [] });
  });

  it('aborts rather than rejecting when the request fails', async () => {
    const fake = fakeBrowser();
    await renderThumbnail(doc(), { launch: fake.launch });
    const abort = vi.fn(async () => {});
    await fake.routeHandler()({
      request: () => ({ url: () => PUBLIC, isNavigationRequest: () => false }),
      abort,
      fetch: async () => {
        throw new Error('connection reset');
      },
      fulfill: async () => {},
    });
    expect(abort).toHaveBeenCalledTimes(1);
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
