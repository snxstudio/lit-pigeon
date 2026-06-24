import { getStarterTemplates } from '@lit-pigeon/core';
import { renderTemplate } from './dist/index.js';
import { mkdir, writeFile } from 'node:fs/promises';

// Sample merge-tag values so transactional/promo placeholders render real-looking text.
const SAMPLE_TAGS = {
  firstName: 'Alex',
  lastName: 'Rivera',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  company: 'Lit Pigeon',
  orderNumber: '10482',
  orderId: '10482',
  total: '$84.00',
  amount: '$84.00',
  date: 'June 24, 2026',
  unsubscribeUrl: 'https://example.com/unsubscribe',
};

const OUT_DIR = process.argv[2] || '/tmp/lit-pigeon-email-proof';

const order = ['starter-welcome', 'starter-newsletter', 'starter-transactional', 'starter-promo'];
const templates = getStarterTemplates().sort(
  (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
);

await mkdir(OUT_DIR, { recursive: true });

let ok = 0;
for (const tpl of templates) {
  const result = await renderTemplate(tpl, { mergeTags: SAMPLE_TAGS, mergeTagFallback: '' });
  const file = `${OUT_DIR}/${tpl.id}.html`;
  await writeFile(file, result.html, 'utf-8');
  const bytes = Buffer.byteLength(result.html, 'utf-8');
  const errs = result.errors?.length ?? 0;
  console.log(
    `${errs ? '⚠' : '✓'} ${tpl.id.padEnd(22)} ${(bytes / 1024).toFixed(1)} kB` +
      (errs ? `  (${errs} error(s): ${result.errors.map((e) => e.message || e).join('; ')})` : ''),
  );
  if (!errs) ok++;
}
console.log(`\n${ok}/${templates.length} rendered cleanly → ${OUT_DIR}`);
