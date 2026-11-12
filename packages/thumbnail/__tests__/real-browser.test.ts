import { describe, it, expect } from 'vitest';
import { createBlock, createColumn, createDefaultDocument, createRow } from '@lit-pigeon/core';
import { renderThumbnail } from '../src/thumbnail.js';
import { launchChromium } from '../src/browser.js';

/**
 * Exercises the real rasterisation path. Skipped where no browser is
 * installed, which is the normal state in CI — the fakes in
 * `thumbnail.test.ts` cover the logic, and this covers the assumption those
 * fakes encode: that a Playwright browser satisfies `ThumbnailBrowser` and
 * produces a PNG of the requested size.
 *
 * Point `LIT_PIGEON_THUMBNAIL_BROWSER` at a Chromium binary to run it.
 */
const executablePath = process.env.LIT_PIGEON_THUMBNAIL_BROWSER;
const browserArgs = ['--no-sandbox'];

const available = await launchChromium({ executablePath, args: browserArgs }).then(
  (browser) => browser.close().then(() => true),
  () => false,
);

function doc(backgroundColor: string) {
  const d = createDefaultDocument('Thumbnail');
  d.body.attributes.backgroundColor = backgroundColor;
  d.body.rows.push(createRow([createColumn([createBlock('text', { content: '<p>Hello</p>' })])]));
  return d;
}

/** PNG stores width and height as big-endian 32-bit ints in the IHDR chunk. */
function pngSize(dataUrl: string) {
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe.skipIf(!available)('rasterising with a real browser', () => {
  it('produces a PNG at the requested pixel size', async () => {
    const result = await renderThumbnail(doc('#ffffff'), {
      executablePath,
      browserArgs,
      width: 300,
      height: 200,
    });
    expect(pngSize(result.thumbnail)).toEqual({ width: 300, height: 200 });
    expect(result).toMatchObject({ width: 300, height: 200, errors: [] });
  });

  it('scales the image by deviceScaleFactor without changing the reported size', async () => {
    const result = await renderThumbnail(doc('#ffffff'), {
      executablePath,
      browserArgs,
      width: 300,
      height: 200,
      deviceScaleFactor: 2,
    });
    expect(pngSize(result.thumbnail)).toEqual({ width: 600, height: 400 });
    expect(result).toMatchObject({ width: 300, height: 200 });
  });

  it('renders the document, not a blank page', async () => {
    const [white, red] = await Promise.all([
      renderThumbnail(doc('#ffffff'), { executablePath, browserArgs, width: 200, height: 150 }),
      renderThumbnail(doc('#ff0000'), { executablePath, browserArgs, width: 200, height: 150 }),
    ]);
    expect(white.thumbnail).not.toBe(red.thumbnail);
  });
});
