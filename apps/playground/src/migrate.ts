import '@lit-pigeon/editor';
import { registerStandardBlocks } from '@lit-pigeon/blocks';
import { unlayerToDocument, type ImportWarning } from '@lit-pigeon/import-unlayer';
import type { PigeonEditor } from '@lit-pigeon/editor';
import { unlayerSamples } from './unlayer-samples.js';

registerStandardBlocks();

const editor = document.getElementById('editor') as PigeonEditor;
const input = document.getElementById('design-input') as HTMLTextAreaElement;
const sampleSelect = document.getElementById('sample-select') as HTMLSelectElement;
const status = document.getElementById('status')!;
const warningsBox = document.getElementById('warnings')!;
const warningsTitle = document.getElementById('warnings-title')!;
const warningsList = document.getElementById('warnings-list')!;
const downloadButtons = document.querySelectorAll<HTMLButtonElement>('[data-download]');

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setStatus(text: string, tone: '' | 'ok' | 'error' = '') {
  status.textContent = text;
  status.className = `status ${tone}`;
}

function showWarnings(warnings: ImportWarning[]) {
  warningsBox.hidden = warnings.length === 0;
  warningsTitle.textContent = `${warnings.length} thing${warnings.length === 1 ? '' : 's'} did not convert cleanly`;
  warningsList.innerHTML = warnings
    .map((w) => `<li><code>${esc(w.code)}</code>${esc(w.message)}</li>`)
    .join('');
}

function runImport() {
  const raw = input.value.trim();
  if (!raw) {
    setStatus('Paste a design first, or pick a sample.', 'error');
    return;
  }

  const { document: doc, warnings } = unlayerToDocument(raw);
  showWarnings(warnings);

  if (warnings.some((w) => w.code === 'not-a-design')) {
    setStatus('That does not look like an Unlayer design.', 'error');
    return;
  }

  editor.loadDocument(doc);
  downloadButtons.forEach((btn) => (btn.disabled = false));
  const rows = doc.body.rows.length;
  setStatus(`Imported ${rows} row${rows === 1 ? '' : 's'}.`, 'ok');
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

for (const [key, sample] of Object.entries(unlayerSamples)) {
  sampleSelect.add(new Option(sample.label, key));
}

sampleSelect.addEventListener('change', () => {
  const sample = unlayerSamples[sampleSelect.value as keyof typeof unlayerSamples];
  if (!sample) return;
  input.value = JSON.stringify(sample.design, null, 2);
  runImport();
});

document.getElementById('btn-import')!.addEventListener('click', runImport);

input.addEventListener('dragover', (e) => {
  e.preventDefault();
  input.classList.add('dragging');
});
input.addEventListener('dragleave', () => input.classList.remove('dragging'));
input.addEventListener('drop', async (e) => {
  e.preventDefault();
  input.classList.remove('dragging');
  const file = e.dataTransfer?.files[0];
  if (!file) return;
  input.value = await file.text();
  runImport();
});

async function exportAs(format: string): Promise<{ content: string; ext: string; mime: string }> {
  const doc = editor.getDocument();
  if (format === 'json') {
    return { content: JSON.stringify(doc, null, 2), ext: 'json', mime: 'application/json' };
  }
  const { MjmlRenderer, documentToMjml } = await import('@lit-pigeon/renderer-mjml');
  if (format === 'mjml') {
    return { content: documentToMjml(doc), ext: 'mjml', mime: 'text/plain' };
  }
  const { html } = await new MjmlRenderer().render(doc);
  return { content: html, ext: 'html', mime: 'text/html' };
}

async function download(format: string) {
  try {
    const { content, ext, mime } = await exportAs(format);
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `migrated-from-unlayer.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    setStatus(`Export failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
  }
}

downloadButtons.forEach((btn) => btn.addEventListener('click', () => void download(btn.dataset.download!)));

// The editor's own toolbar Export menu re-dispatches these from <pigeon-editor>.
for (const format of ['html', 'mjml', 'json']) {
  editor.addEventListener(`pigeon:export-${format}`, () => void download(format));
}

// Probe the importer with a one-block design per Unlayer type, so the table
// reports what the installed importer does rather than what we remember.
const probe = (content: Record<string, unknown>, rowValues: Record<string, unknown> = {}) =>
  unlayerToDocument({
    body: { rows: [{ cells: [1], columns: [{ contents: [content], values: {} }], values: rowValues }], values: {} },
  });

const BLOCK_TYPES = ['text', 'heading', 'image', 'button', 'divider', 'html', 'menu', 'social', 'video', 'timer', 'form', 'custom#my_tool'];

document.getElementById('coverage-blocks')!.innerHTML = BLOCK_TYPES.map((type) => {
  const { document: doc, warnings } = probe({ type, values: {} });
  const block = doc.body.rows[0]?.columns[0]?.blocks[0];
  const result = block
    ? `<span class="yes">✓</span> <code>${esc(block.type)}</code> block`
    : `<span class="no">✗</span> dropped, with the <code>${esc(warnings[0]?.code ?? 'warning')}</code> warning`;
  return `<tr><td><code>${esc(type)}</code></td><td>${result}</td></tr>`;
}).join('');

const clamped = probe({ type: 'heading', values: { headingType: 'h5', text: 'x' } });
const conditioned = probe({ type: 'text', values: {} }, { displayCondition: { label: 'x' } });

const settings: Array<[string, boolean, string]> = [
  ['Column widths (<code>cells</code>)', true, 'Converted to the 12-column grid'],
  ['Row background colour and image, padding, full width', true, 'Row attributes'],
  ['Locked rows', true, 'Row <code>locked</code>'],
  ['Column background, padding, vertical alignment', true, 'Column attributes'],
  ['Body width, background, font, alignment, preheader', true, 'Document body and preview text'],
  ['Block font size and colour', true, 'Inlined into the text as a <code>&lt;span style&gt;</code>'],
  [
    'Headings <code>h4</code> to <code>h6</code>',
    true,
    `Imported as <code>h3</code>, with a <code>${esc(clamped.warnings[0]?.code ?? '')}</code> warning`,
  ],
  [
    'Display conditions',
    false,
    `Dropped, with a <code>${esc(conditioned.warnings[0]?.code ?? '')}</code> warning. Unlayer stores raw template fragments, and guessing a translation could change who receives the content.`,
  ],
  ['Mobile overrides (<code>_override</code>)', false, 'Not carried over'],
  ['Hide on desktop / mobile', false, 'Not carried over'],
  ['Button font weight and border', true, 'Button block values'],
  ['Body link colour and underline', true, 'Document <code>linkStyle</code>'],
  ['Link and button hover colours', false, 'Not carried over. <code>:hover</code> is ignored by most email clients, so a control for it would imply a guarantee we cannot make.'],
];

document.getElementById('coverage-settings')!.innerHTML = settings
  .map(
    ([label, ok, result]) =>
      `<tr><td>${label}</td><td><span class="${ok ? 'yes' : 'no'}">${ok ? '✓' : '✗'}</span> ${result}</td></tr>`,
  )
  .join('');
