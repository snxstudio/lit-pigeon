// Loads docs/guide/examples/src/theming/theme.css into the running verification
// app and checks that its tokens and parts take effect in Chromium.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:4310';
const css = readFileSync(process.env.THEME_CSS, 'utf8');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
const context = await browser.newContext({ colorScheme: 'dark' });
await context.addInitScript(() => { if (window === window.top) sessionStorage.setItem('access_token', 'test-token'); });
const page = await context.newPage();
await page.goto(`${BASE}/templates/welcome/edit`);
await page.waitForSelector('pigeon-text-block');
await page.addStyleTag({ content: `body { --pigeon-primary: #111111; }\n${css}` });
const token = () => page.evaluate(() => getComputedStyle(document.querySelector('pigeon-editor')).getPropertyValue('--pigeon-primary').trim());
const setTheme = (t) => page.evaluate((t) => { document.querySelector('pigeon-editor').theme = t; }, t);
const results = { light: await token() };
await setTheme('dark'); await page.waitForTimeout(50); results.dark = await token();
await setTheme('auto'); await page.waitForTimeout(50); results.autoInDarkScheme = await token();
results.toolbarButtonRadius = await page.evaluate(() => {
  const btn = document.querySelector('pigeon-editor').shadowRoot.querySelector('pigeon-toolbar').shadowRoot.querySelector('[part~="toolbar-button"]');
  return getComputedStyle(btn).borderTopLeftRadius;
});
const expected = { light: '#0f766e', dark: '#2dd4bf', autoInDarkScheme: '#2dd4bf', toolbarButtonRadius: '0px' };
console.log(JSON.stringify(results));
await browser.close();
process.exit(JSON.stringify(results) === JSON.stringify(expected) ? 0 : 1);
