/**
 * Merge-tag values passed to {@link applyMergeTags}. Nested objects are
 * resolved via dot-path (`user.name` reads `values.user.name`).
 */
export type MergeTagValues = Record<string, unknown>;

export interface ApplyMergeTagsOptions {
  /**
   * Replacement when a placeholder has no matching entry in `values`. If
   * omitted, the original `{{path}}` placeholder is left in place — handy
   * when a downstream ESP performs final substitution.
   */
  fallback?: string;
  /**
   * When `false`, replacement values are inserted verbatim. Default `true`:
   * `<`, `>`, `&`, `"`, `'` in replacement strings are HTML-escaped so user
   * data can't inject markup.
   */
  escape?: boolean;
}

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;

/**
 * Replace `{{key}}` placeholders in `html` with values from `values`. Dotted
 * keys (`user.name`) traverse nested objects. By default, replacements are
 * HTML-escaped — disable via `{ escape: false }` if you trust the data.
 *
 * Unknown placeholders are left untouched unless `fallback` is set, so the
 * function is safe to call multiple times in a pipeline (e.g. once on the
 * server, once at send time).
 */
export function applyMergeTags(
  html: string,
  values: MergeTagValues,
  options: ApplyMergeTagsOptions = {},
): string {
  const { fallback, escape = true } = options;
  return html.replace(PLACEHOLDER, (match, path: string) => {
    const resolved = resolvePath(values, path);
    if (resolved === undefined) {
      return fallback ?? match;
    }
    const str = stringify(resolved);
    return escape ? escapeHtml(str) : str;
  });
}

/**
 * Return the set of distinct merge-tag paths referenced by `html`, sorted
 * alphabetically. Useful for surfacing required template variables to the
 * caller before sending.
 */
export function extractMergeTags(html: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(PLACEHOLDER)) {
    found.add(match[1]);
  }
  return Array.from(found).sort();
}

function resolvePath(values: MergeTagValues, path: string): unknown {
  let current: unknown = values;
  for (const part of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
    if (current === undefined) return undefined;
  }
  return current;
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
