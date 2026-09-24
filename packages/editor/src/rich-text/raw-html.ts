/**
 * Holds email scaffolding out of the TipTap schema so inline editing cannot
 * destroy it.
 *
 * TipTap has no node for HTML comments, tables or images, and discards the
 * attributes of wrapper elements it does not know. Loading such markup into
 * the editor and reading it back therefore loses it: `<!--[if mso]>` blocks
 * disappear, and a hero button's `<table>`/`<div>` styling collapses to a
 * bare `<a>`. Swapping each fragment for an opaque marker before the editor
 * loads keeps it out of the schema entirely; `sanitizeHTML` swaps it back on
 * commit.
 *
 * Fragments live in a per-editor `RawStore` keyed by id rather than inline in
 * the marker, so stored content that already carries a `data-pigeon-raw`
 * attribute cannot smuggle markup past the sanitiser.
 */

/** Held verbatim: the schema has no node for these, so any edit destroys them. */
const ATOM_TAGS = new Set(['table', 'img']);

/** Grouping elements kept around their (still editable) children. */
const WRAPPER_TAGS = new Set([
  'div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'figure', 'center',
]);

/** Parents whose children are an inline run, so a marker there must be inline too. */
const TEXTBLOCK_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote',
  'span', 'a', 'strong', 'b', 'em', 'i', 'u', 's', 'code',
]);

export interface WrapperSpec {
  tag: string;
  attrs: [string, string][];
}

export class RawStore {
  private _raw = new Map<string, string>();
  private _wrappers = new Map<string, WrapperSpec>();
  private _next = 0;

  holdRaw(html: string): string {
    const id = `r${this._next++}`;
    this._raw.set(id, html);
    return id;
  }

  holdWrapper(spec: WrapperSpec): string {
    const id = `w${this._next++}`;
    this._wrappers.set(id, spec);
    return id;
  }

  getRaw(id: string): string | undefined {
    return this._raw.get(id);
  }

  getWrapper(id: string): WrapperSpec | undefined {
    return this._wrappers.get(id);
  }
}

/**
 * Replaces every fragment TipTap would destroy with a marker element and
 * records the original in `store`. Returns the input unchanged where no
 * DOMParser exists (the editor never mounts there).
 */
export function holdRawFragments(input: string, store: RawStore): string {
  if (typeof DOMParser === 'undefined') return input;
  const body = new DOMParser().parseFromString(`<body>${input}`, 'text/html').body;
  holdChildren(body, store);
  return body.innerHTML;
}

export function openTagOf(spec: WrapperSpec): string {
  let out = `<${spec.tag}`;
  for (const [name, value] of spec.attrs) {
    out += ` ${name}="${escapeAttr(value)}"`;
  }
  return `${out}>`;
}

function holdChildren(parent: Element, store: RawStore): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 8 /* COMMENT_NODE */) {
      // The parse above ended this comment at its first `-->`, so re-wrapping
      // the data cannot produce markup that escapes the comment.
      child.replaceWith(marker(parent, store.holdRaw(`<!--${(child as Comment).data}-->`)));
      continue;
    }
    if (child.nodeType !== 1 /* ELEMENT_NODE */) continue;

    const el = child as Element;
    // Forged markers in stored content must not resolve against real ids.
    el.removeAttribute('data-pigeon-raw');
    el.removeAttribute('data-pigeon-wrap');

    if (ATOM_TAGS.has(el.localName)) {
      el.replaceWith(marker(parent, store.holdRaw(el.outerHTML)));
      continue;
    }
    if (WRAPPER_TAGS.has(el.localName) && el.attributes.length > 0) {
      const attrs = Array.from(el.attributes).map(({ name, value }) => [name, value] as [string, string]);
      el.setAttribute('data-pigeon-wrap', store.holdWrapper({ tag: el.localName, attrs }));
    }
    holdChildren(el, store);
  }
}

function marker(parent: Element, id: string): Element {
  const el = parent.ownerDocument.createElement(TEXTBLOCK_TAGS.has(parent.localName) ? 'span' : 'div');
  el.setAttribute('data-pigeon-raw', id);
  return el;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
