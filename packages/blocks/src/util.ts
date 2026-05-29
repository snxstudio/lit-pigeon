/** HTML-escape arbitrary user text before inserting into markup. */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escape an attribute value (subset of HTML escapes, optimised for attrs). */
export function escAttr(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Split a multi-item textarea field into trimmed, non-empty rows. Items are
 * separated by newlines; blank lines are dropped. Used by accordion, table,
 * and carousel item editors.
 */
export function splitRows(input: unknown): string[] {
  return String(input ?? '')
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter((row) => row.length > 0);
}
