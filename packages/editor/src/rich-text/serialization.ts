/**
 * Allowlist-based output sanitiser for HTML produced by the rich-text editor.
 *
 * TipTap already constrains what nodes/marks can land in the editor schema,
 * so the schema itself is the primary defence against XSS. This sanitiser is
 * a belt-and-braces second pass run on `editor.getHTML()` before the HTML is
 * committed back to the document.
 *
 * Allowed tags: p, br, strong, em, s, u, code, a, h1-h3, ul, ol, li,
 * blockquote, span. Anything else is stripped (but its text content is kept).
 *
 * Allowed attributes:
 *  - a: href (http/https/mailto only), target, rel
 *  - span: style (color / font-family / font-size declarations only),
 *          data-merge-tag
 *  - everything else: no attributes
 *
 * Drops: script, style, iframe, object, embed, all on* event handlers,
 *        javascript: hrefs, anything not in the tag allowlist.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 's', 'u', 'code', 'a',
  'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'span',
]);

const ALLOWED_ATTRS_BY_TAG: Record<string, ReadonlySet<string>> = {
  a: new Set(['href', 'target', 'rel']),
  span: new Set(['style']),
};

const MERGE_TAG_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const ALLOWED_STYLE_PROPS = new Set(['color', 'font-family', 'font-size']);

const SAFE_HREF_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

const VOID_ELEMENTS = new Set(['br']);

/**
 * Sanitises a raw HTML string. Uses DOMParser when available (browsers,
 * happy-dom test env). For environments without DOMParser, returns the input
 * unchanged — defenders should be aware that the TipTap schema is still the
 * primary defence and that this sanitiser is best-effort.
 */
export function sanitizeHTML(input: string): string {
  if (typeof DOMParser === 'undefined') return input;
  const doc = new DOMParser().parseFromString(`<div id="__root">${input}</div>`, 'text/html');
  const root = doc.getElementById('__root');
  if (!root) return '';
  return serializeChildren(root);
}

function serializeChildren(node: Element | DocumentFragment): string {
  let out = '';
  for (const child of Array.from(node.childNodes)) {
    out += serializeNode(child);
  }
  return out;
}

function serializeNode(node: Node): string {
  if (node.nodeType === 3 /* TEXT_NODE */) {
    return escapeText(node.textContent ?? '');
  }
  if (node.nodeType !== 1 /* ELEMENT_NODE */) return '';
  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  // Merge-tag spans round-trip as plain `{{name}}` text so MJML output is
  // unchanged. The chip rendering is rebuilt on next load via preprocess.
  // Bad identifiers are dropped (span unwrapped, attr discarded).
  if (tag === 'span' && el.hasAttribute('data-merge-tag')) {
    const name = el.getAttribute('data-merge-tag') ?? '';
    if (MERGE_TAG_IDENTIFIER.test(name)) {
      return `{{${name}}}`;
    }
    return serializeChildren(el);
  }

  if (!ALLOWED_TAGS.has(tag)) {
    // Drop the wrapper but keep textual children.
    return serializeChildren(el);
  }
  const attrs = serializeAttrs(el, tag);
  if (attrs === null) {
    // Mark element was tagged for removal (e.g. unsafe href on <a>).
    return serializeChildren(el);
  }
  if (VOID_ELEMENTS.has(tag)) return `<${tag}${attrs}>`;
  return `<${tag}${attrs}>${serializeChildren(el)}</${tag}>`;
}

function serializeAttrs(el: Element, tag: string): string | null {
  const allowed = ALLOWED_ATTRS_BY_TAG[tag];
  if (!allowed) return '';
  let out = '';
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on')) continue;
    if (!allowed.has(name)) continue;

    let value = attr.value;
    if (tag === 'a' && name === 'href') {
      if (!isSafeHref(value)) return null;
    }
    if (tag === 'span' && name === 'style') {
      value = sanitizeStyle(value);
      if (!value) continue;
    }
    out += ` ${name}="${escapeAttr(value)}"`;
  }
  return out;
}

function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  // Merge-tag-style template hrefs (e.g. "{{unsubscribe_url}}") are emitted by
  // special/custom link types and resolved by the host at send time.
  if (/^\{\{[\w.]+\}\}$/.test(trimmed)) return true;
  try {
    const url = new URL(trimmed, 'http://_relative_');
    return SAFE_HREF_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeStyle(style: string): string {
  return style
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => {
      if (!decl) return false;
      const colon = decl.indexOf(':');
      if (colon < 0) return false;
      const prop = decl.slice(0, colon).trim().toLowerCase();
      const value = decl.slice(colon + 1).trim().toLowerCase();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return false;
      // Block url() and any expression-y bits in the value.
      if (value.includes('url(') || value.includes('expression') || value.includes('javascript:')) return false;
      return true;
    })
    .join('; ');
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
