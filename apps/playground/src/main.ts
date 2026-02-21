// Copy install command
const copyBtn = document.getElementById('copy-install');
if (copyBtn) {
  const copyIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M5 11H3.5A1.5 1.5 0 012 9.5v-7A1.5 1.5 0 013.5 1h7A1.5 1.5 0 0112 2.5V5"/></svg>`;
  const checkIcon = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.5 3.5 6.5-8"/></svg>`;

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('npm install @lit-pigeon/editor');
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = checkIcon;
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = copyIcon;
      }, 2000);
    } catch {
      // Clipboard API not available
    }
  });
}

// Quick Start tab switching
const tabsContainer = document.getElementById('quickstart-tabs');
if (tabsContainer) {
  tabsContainer.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn?.dataset.tab) return;

    tabsContainer.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.quickstart-panel').forEach((panel) => {
      panel.classList.toggle('active', (panel as HTMLElement).dataset.panel === btn.dataset.tab);
    });
  });
}
