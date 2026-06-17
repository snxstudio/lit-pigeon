/**
 * Built-in English catalog — the source of truth for every editor chrome
 * string and the fallback for any locale. Keys are dotted and grouped by area.
 * Extraction tasks append their area's keys here; each value equals the
 * string the component previously hardcoded.
 */
export const EN_MESSAGES: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Undo',
  'toolbar.redo': 'Redo',
  'toolbar.preview': 'Preview',
};
