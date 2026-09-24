import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:4310';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const apiLog = async () => (await fetch(`${BASE}/api/_log`)).json();
const waitFor = async (fn, ms = 10000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 100)); } return null; };

const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
await context.addInitScript(() => { if (window === window.top) sessionStorage.setItem('access_token', 'test-token'); });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const onlySuite = process.env.ONLY;

const docRows = () => page.evaluate(() => document.querySelector('pigeon-editor')?.getDocument()?.body.rows.length ?? -1);
const blockCount = () => page.evaluate(() => document.querySelector('pigeon-editor')?.getDocument()?.body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks)).length ?? -1);

// 1. Template editor route: load MJML from the API, edit, save, upload, merge tags.
await page.goto(`${BASE}/templates/welcome/edit`);
await page.waitForSelector('pigeon-editor');
check('lazy route renders <pigeon-editor>', true);
await waitFor(async () => (await blockCount()) >= 3);
check('MJML template loaded through EmailApi with bearer token', (await blockCount()) === 3, `blocks=${await blockCount()}`);
check('parse warning for mj-wrapper shown', await page.locator('.warnings li').first().textContent().then((t) => /mj-wrapper/.test(t ?? '')).catch(() => false));
check('initial status is "Saved" (load does not count as an edit)', (await page.locator('.status').textContent()) === 'Saved');
if (onlySuite !== 'smoke') {
  await page.locator('pigeon-palette-item[label="Divider"]').click();
  check('palette click adds a block', (await blockCount()) === 4);
  await waitFor(async () => (await page.locator('.status').textContent()) === 'Unsaved changes', 3000);
  check('OnPush + zoneless view updates from pigeonChange', (await page.locator('.status').textContent()) === 'Unsaved changes');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const put = await waitFor(async () => (await apiLog()).find((e) => e.method === 'PUT'));
  check('Save sends { mjml, html } with Authorization', put && put.auth === 'Bearer test-token' && put.hasDivider && put.htmlDoctype, JSON.stringify(put));
  await waitFor(async () => (await page.locator('.status').textContent()) === 'Saved', 3000);
  check('status returns to "Saved" after save', (await page.locator('.status').textContent()) === 'Saved');

  // Upload through the asset manager.
  await page.locator('pigeon-image-block').first().click();
  await page.locator('pigeon-image-panel .upload-btn').click();
  await page.locator('pigeon-asset-manager #file-input').setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
  const upload = await waitFor(async () => (await apiLog()).find((e) => e.path === '/api/email-assets'));
  check('uploadHandler POSTs multipart with Authorization', upload && upload.auth === 'Bearer test-token' && upload.multipart, JSON.stringify(upload));
  const src = await waitFor(() => page.evaluate(() => document.querySelector('pigeon-editor').getDocument().body.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks)).find((b) => b.type === 'image')?.values.src?.includes('/uploads/pixel.png')));
  check('uploaded URL stored on the image block', src);

  // Lazy merge tags.
  await page.locator('pigeon-text-block').first().click();
  await page.locator('pigeon-text-panel .tag-btn').click();
  const mt = await waitFor(async () => (await apiLog()).find((e) => e.path === '/api/merge-tags'));
  check('Tag button fires pigeon:merge-tag-request → host loads tags', mt && mt.auth === 'Bearer test-token');
  await page.waitForTimeout(200);
  await page.locator('pigeon-text-panel .tag-btn').click();
  const picker = await waitFor(() => page.locator('pigeon-merge-tag-picker').getByText('First name').isVisible().catch(() => false), 3000);
  check('second click opens the picker with the loaded tags', picker);

  // 2. Tabs: preserveContent keeps the editor state.
  await page.goto(`${BASE}/tabs`);
  await page.waitForSelector('pigeon-editor');
  await page.waitForTimeout(300);
  const before = await docRows();
  await page.locator('pigeon-palette-item[label="Text"]').click();
  const afterAdd = await docRows();
  await page.getByRole('tab', { name: 'Settings' }).click();
  await page.waitForTimeout(400);
  const changesText = await page.getByText(/Changes this session:/).textContent();
  await page.getByRole('tab', { name: 'Design' }).click();
  await page.waitForTimeout(400);
  const afterSwitch = await docRows();
  const canUndo = await page.evaluate(() => document.querySelector('pigeon-editor').undo());
  check('mat-tab-group: document and undo history survive tab switches', afterAdd === before + 1 && afterSwitch === afterAdd && canUndo, `rows ${before}→${afterAdd}→${afterSwitch}, undo=${canUndo}, "${changesText}"`);

  // 3. Dialog.
  await page.goto(`${BASE}/`);
  await page.locator('#open-dialog').click();
  await page.waitForSelector('mat-dialog-container pigeon-editor');
  await page.waitForTimeout(500);
  const dialogBlocks = await blockCount();
  await page.locator('mat-dialog-container pigeon-text-block').first().click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Escape in the editor does not close the dialog (disableClose)', await page.locator('mat-dialog-container').isVisible(), `blocks=${dialogBlocks}`);
  await page.evaluate(() => document.querySelector('pigeon-editor').addEventListener('pigeon:select', (e) => { window.__sel = e.detail.selection?.type; }));
  await page.locator('mat-dialog-container pigeon-text-block').first().click();
  const sel = await page.evaluate(() => window.__sel);
  check('editor inside dialog receives selection', sel === 'block', `selection=${sel}`);
  const box = await page.locator('mat-dialog-container pigeon-editor').boundingBox();
  check('editor fills the dialog', box && box.height > 500, JSON.stringify(box));
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.waitForSelector('mat-dialog-container', { state: 'detached' });
  const result = await page.locator('#dialog-result').textContent();
  check('dialog closes with { mjml, html }', /^mjml:\d+ html:\d+$/.test(result ?? ''), result);

  // 4. Echo binding: same object back into [document] keeps history.
  await page.goto(`${BASE}/echo`);
  await page.waitForSelector('pigeon-editor');
  await page.waitForTimeout(300);
  await page.locator('pigeon-palette-item[label="Text"]').click();
  await page.waitForTimeout(300);
  const echoUndo = await page.evaluate(() => document.querySelector('pigeon-editor').undo());
  check('echoing $event.document into [document] does not reset history', echoUndo);
}

const relevant = errors.filter((e) => !/favicon/.test(e));
check('no console errors or page errors', relevant.length === 0, relevant.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
