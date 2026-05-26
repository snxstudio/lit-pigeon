/**
 * Wraps bare `{{identifier}}` patterns in text contexts with merge-tag span
 * markers so TipTap's parseHTML rule for the `mergeTag` node converts them
 * into chip nodes on load.
 *
 * Identifier rule: `[A-Za-z_][A-Za-z0-9_]*` — matches `{{firstName}}`,
 * `{{user_name}}` but not `{{user.name}}`, `{{items[0]}}`, or `{{ }}`.
 *
 * Implementation walks the HTML, skipping over tag bodies so we don't
 * accidentally rewrite attribute values like `href="?ref={{foo}}"`.
 */
const TAG_OR_MARKER = /(<[^>]*>)|(\{\{[A-Za-z_][A-Za-z0-9_]*\}\})/g;
const MARKER_NAME = /\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/;

export function preprocessForEditor(html: string): string {
  return html.replace(TAG_OR_MARKER, (match, tag) => {
    if (tag) return tag;
    const m = match.match(MARKER_NAME);
    if (!m) return match;
    const name = m[1];
    return `<span data-merge-tag="${escapeAttr(name)}">{{${name}}}</span>`;
  });
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, '&quot;');
}
