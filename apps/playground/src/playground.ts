import '@lit-pigeon/editor';
import {
  createDefaultDocument,
  createRow,
  createColumn,
  createBlock,
  type PigeonDocument,
} from '@lit-pigeon/core';
import type { PigeonEditor } from '@lit-pigeon/editor';

const STORAGE_KEY = 'lit-pigeon-playground-doc';

// Sample templates
const templates: Record<string, { name: string; description: string; create: () => PigeonDocument }> = {
  blank: {
    name: 'Blank',
    description: 'Start from scratch',
    create: () => createDefaultDocument('Blank Email'),
  },
  welcome: {
    name: 'Welcome Email',
    description: 'A welcome email with header, text, and CTA',
    create: () => {
      const doc = createDefaultDocument('Welcome Email');
      doc.body.rows = [
        createRow([
          createColumn([
            createBlock('image', {
              src: 'https://placehold.co/600x120/3b82f6/ffffff?text=Your+Logo',
              alt: 'Logo',
              width: 'auto' as const,
              padding: { top: 20, right: 20, bottom: 20, left: 20 },
              alignment: 'center' as const,
            }),
          ]),
        ]),
        createRow([
          createColumn([
            createBlock('text', {
              content: '<h1 style="text-align: center;">Welcome aboard!</h1><p style="text-align: center; color: #64748b;">We\'re thrilled to have you join us. Here\'s everything you need to get started.</p>',
              padding: { top: 20, right: 40, bottom: 10, left: 40 },
              textAlign: 'center' as const,
              lineHeight: '1.6',
            }),
          ]),
        ]),
        createRow([
          createColumn([
            createBlock('button', {
              text: 'Get Started',
              href: 'https://example.com',
              backgroundColor: '#3b82f6',
              textColor: '#ffffff',
              borderRadius: 8,
              padding: { top: 10, right: 40, bottom: 30, left: 40 },
              innerPadding: { top: 14, right: 32, bottom: 14, left: 32 },
              fontSize: 16,
              fontWeight: '600',
              alignment: 'center' as const,
              fullWidth: false,
            }),
          ]),
        ]),
        createRow([
          createColumn([
            createBlock('divider', {
              borderColor: '#e2e8f0',
              borderWidth: 1,
              borderStyle: 'solid' as const,
              padding: { top: 10, right: 40, bottom: 10, left: 40 },
              width: '100%',
            }),
          ]),
        ]),
        createRow([
          createColumn([
            createBlock('text', {
              content: '<p style="text-align: center; font-size: 12px; color: #94a3b8;">You received this email because you signed up at example.com.<br/>Unsubscribe</p>',
              padding: { top: 10, right: 40, bottom: 20, left: 40 },
              textAlign: 'center' as const,
              lineHeight: '1.5',
            }),
          ]),
        ]),
      ];
      return doc;
    },
  },
  newsletter: {
    name: 'Newsletter',
    description: 'Two-column newsletter layout',
    create: () => {
      const doc = createDefaultDocument('Newsletter');
      doc.body.rows = [
        createRow([
          createColumn([
            createBlock('text', {
              content: '<h2>Weekly Newsletter</h2><p style="color: #64748b;">Issue #42 — Your weekly roundup</p>',
              padding: { top: 20, right: 20, bottom: 10, left: 20 },
              textAlign: 'left' as const,
              lineHeight: '1.5',
            }),
          ]),
        ]),
        createRow(
          [
            createColumn([
              createBlock('image', {
                src: 'https://placehold.co/280x180/e2e8f0/64748b?text=Feature+Story',
                alt: 'Feature story',
                width: 'auto' as const,
                padding: { top: 10, right: 10, bottom: 10, left: 10 },
                alignment: 'center' as const,
              }),
              createBlock('text', {
                content: '<h3>Feature Story</h3><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.</p>',
                padding: { top: 5, right: 10, bottom: 10, left: 10 },
                textAlign: 'left' as const,
                lineHeight: '1.5',
              }),
            ]),
            createColumn([
              createBlock('image', {
                src: 'https://placehold.co/280x180/e2e8f0/64748b?text=Second+Story',
                alt: 'Second story',
                width: 'auto' as const,
                padding: { top: 10, right: 10, bottom: 10, left: 10 },
                alignment: 'center' as const,
              }),
              createBlock('text', {
                content: '<h3>Second Story</h3><p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi.</p>',
                padding: { top: 5, right: 10, bottom: 10, left: 10 },
                textAlign: 'left' as const,
                lineHeight: '1.5',
              }),
            ]),
          ],
          [6, 6],
        ),
        createRow([
          createColumn([
            createBlock('button', {
              text: 'Read More',
              href: 'https://example.com',
              backgroundColor: '#1e293b',
              textColor: '#ffffff',
              borderRadius: 6,
              padding: { top: 10, right: 20, bottom: 20, left: 20 },
              innerPadding: { top: 12, right: 24, bottom: 12, left: 24 },
              fontSize: 14,
              fontWeight: '600',
              alignment: 'center' as const,
              fullWidth: false,
            }),
          ]),
        ]),
      ];
      return doc;
    },
  },
};

// Initialize
const editor = document.getElementById('editor') as PigeonEditor;

// Restore from localStorage or load welcome template
function loadInitialDocument() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const doc = JSON.parse(saved) as PigeonDocument;
      editor.document = doc;
      return;
    }
  } catch {
    // Invalid data in localStorage, fall through to default
  }
  editor.document = templates.welcome.create();
}

loadInitialDocument();

// Event listeners
editor.addEventListener('pigeon:change', ((e: CustomEvent) => {
  console.log('Document changed:', e.detail);
}) as EventListener);

editor.addEventListener('pigeon:ready', () => {
  console.log('Pigeon editor ready');
});

// Save button
const saveBtn = document.getElementById('btn-save')!;
saveBtn.addEventListener('click', () => {
  const doc = editor.getDocument();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  saveBtn.textContent = 'Saved!';
  saveBtn.classList.add('save-feedback');
  setTimeout(() => {
    saveBtn.textContent = 'Save';
    saveBtn.classList.remove('save-feedback');
  }, 1500);
});

// Export modal
const exportModal = document.getElementById('modal-export')!;
const modalContent = document.getElementById('modal-content')!;
const modalTitle = document.getElementById('modal-title')!;
const modalTabs = document.getElementById('modal-tabs')!;

let currentExportData: { html: string; mjml: string; json: string } = { html: '', mjml: '', json: '' };
let currentActiveTab = 'html';

function showTab(tab: string) {
  currentActiveTab = tab;
  modalTabs.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  modalContent.textContent = currentExportData[tab as keyof typeof currentExportData] || '';
}

modalTabs.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('button');
  if (btn?.dataset.tab) {
    showTab(btn.dataset.tab);
  }
});

document.getElementById('btn-export')!.addEventListener('click', async () => {
  const doc = editor.getDocument();

  let htmlOutput = '';
  let mjmlOutput = '';

  try {
    const { MjmlRenderer, documentToMjml } = await import('@lit-pigeon/renderer-mjml');
    mjmlOutput = documentToMjml(doc);
    const renderer = new MjmlRenderer();
    const result = await renderer.render(doc);
    htmlOutput = result.html;
  } catch (err) {
    console.warn('MJML rendering failed:', err);
    htmlOutput = '<!-- MJML rendering requires a Node.js environment. Use the JSON export and render server-side. -->';
    mjmlOutput = '<!-- MJML generation failed -->';
  }

  currentExportData = {
    html: htmlOutput,
    mjml: mjmlOutput,
    json: JSON.stringify(doc, null, 2),
  };

  modalTitle.textContent = 'Export';
  modalTabs.style.display = 'flex';
  showTab('html');
  exportModal.classList.add('open');
});

document.getElementById('btn-json')!.addEventListener('click', () => {
  const doc = editor.getDocument();
  currentExportData = {
    html: '',
    mjml: '',
    json: JSON.stringify(doc, null, 2),
  };

  modalTitle.textContent = 'Document JSON';
  modalTabs.style.display = 'none';
  modalContent.textContent = currentExportData.json;
  currentActiveTab = 'json';
  exportModal.classList.add('open');
});

// Copy export content
document.getElementById('btn-copy-export')!.addEventListener('click', async () => {
  const content = currentExportData[currentActiveTab as keyof typeof currentExportData] || '';
  try {
    await navigator.clipboard.writeText(content);
    const btn = document.getElementById('btn-copy-export')!;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  } catch {
    // Clipboard API not available
  }
});

// Download export content
document.getElementById('btn-download-export')!.addEventListener('click', () => {
  const content = currentExportData[currentActiveTab as keyof typeof currentExportData] || '';
  const extensions: Record<string, string> = { html: '.html', mjml: '.mjml', json: '.json' };
  const mimeTypes: Record<string, string> = { html: 'text/html', mjml: 'text/plain', json: 'application/json' };
  const ext = extensions[currentActiveTab] || '.txt';
  const mime = mimeTypes[currentActiveTab] || 'text/plain';

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `email-export${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.getElementById('modal-close')!.addEventListener('click', () => {
  exportModal.classList.remove('open');
});

exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) exportModal.classList.remove('open');
});

// Import MJML modal
const importMjmlModal = document.getElementById('modal-import-mjml')!;
const importTextarea = document.getElementById('import-mjml-textarea') as HTMLTextAreaElement;
const importWarnings = document.getElementById('import-warnings')!;

document.getElementById('btn-import-mjml')!.addEventListener('click', () => {
  importTextarea.value = '';
  importWarnings.textContent = '';
  importWarnings.classList.remove('visible');
  importMjmlModal.classList.add('open');
});

document.getElementById('import-mjml-cancel')!.addEventListener('click', () => {
  importMjmlModal.classList.remove('open');
});

document.getElementById('import-mjml-close')!.addEventListener('click', () => {
  importMjmlModal.classList.remove('open');
});

importMjmlModal.addEventListener('click', (e) => {
  if (e.target === importMjmlModal) importMjmlModal.classList.remove('open');
});

document.getElementById('import-mjml-confirm')!.addEventListener('click', async () => {
  const mjml = importTextarea.value.trim();
  if (!mjml) return;

  try {
    const { mjmlToDocument } = await import('@lit-pigeon/parser-mjml');
    const result = mjmlToDocument(mjml);

    if (result.warnings.length > 0) {
      importWarnings.textContent = result.warnings.map((w) => w.message).join('\n');
      importWarnings.classList.add('visible');
    }

    editor.loadDocument(result.document);
    importMjmlModal.classList.remove('open');
  } catch (err) {
    importWarnings.textContent = `Parse error: ${err instanceof Error ? err.message : String(err)}`;
    importWarnings.classList.add('visible');
  }
});

// Templates modal
const templatesModal = document.getElementById('modal-templates')!;
const templateGrid = document.getElementById('template-grid')!;

function renderTemplateGrid() {
  templateGrid.innerHTML = '';
  for (const [, tmpl] of Object.entries(templates)) {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `<h3>${tmpl.name}</h3><p>${tmpl.description}</p>`;
    card.addEventListener('click', () => {
      editor.loadDocument(tmpl.create());
      templatesModal.classList.remove('open');
    });
    templateGrid.appendChild(card);
  }
}

document.getElementById('btn-templates')!.addEventListener('click', () => {
  renderTemplateGrid();
  templatesModal.classList.add('open');
});

document.getElementById('templates-close')!.addEventListener('click', () => {
  templatesModal.classList.remove('open');
});

templatesModal.addEventListener('click', (e) => {
  if (e.target === templatesModal) templatesModal.classList.remove('open');
});

// Mobile hamburger toggle
const hamburgerBtn = document.getElementById('hamburger-btn');
const headerActions = document.getElementById('header-actions');

if (hamburgerBtn && headerActions) {
  hamburgerBtn.addEventListener('click', () => {
    headerActions.classList.toggle('open');
  });

  // Close menu when a button is clicked
  headerActions.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      headerActions.classList.remove('open');
    }
  });
}
