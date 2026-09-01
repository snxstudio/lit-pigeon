import { Parser } from 'htmlparser2';

/** Elements that never have a closing tag, so they never open a nesting level. */
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

export interface TextStyle {
  fontSize?: string;
  color?: string;
  fontFamily?: string;
}

/**
 * Builds a CSS declaration string from the three properties the editor's
 * rich-text sanitiser keeps on `<span style>` (`color`, `font-family`,
 * `font-size`). Returns `undefined` when there is nothing to apply.
 */
export function buildStyle(style: TextStyle): string | undefined {
  const decls: string[] = [];
  if (style.color) decls.push(`color: ${style.color}`);
  if (style.fontFamily) decls.push(`font-family: ${style.fontFamily}`);
  if (style.fontSize) decls.push(`font-size: ${style.fontSize}`);
  return decls.length ? decls.join('; ') : undefined;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function renderAttrs(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join('');
}

/**
 * Pushes block-level typography into the HTML itself.
 *
 * Unlayer stores font size and colour on the *content block*, while a Lit
 * Pigeon `TextBlock` only carries `content`, `padding`, `lineHeight` and
 * `textAlign`. Dropping them would lose the design — a template with
 * `textColor: #ffffff` on a black body imports as black-on-black.
 *
 * The editor's sanitiser allows `style` on `<span>` only, and only for
 * `color` / `font-family` / `font-size`, so the styling is applied by wrapping
 * the *inner* content of each top-level element in a styled `<span>`:
 *
 *   `<p>Hi</p>` → `<p><span style="color: #fff">Hi</span></p>`
 *
 * Wrapping the outside instead (`<span><p>…</p></span>`) would be invalid
 * nesting and TipTap would reshuffle it on first edit.
 */
export function applyInlineStyle(html: string, style: TextStyle): string {
  const css = buildStyle(style);
  if (!css) return html;

  const open = `<span style="${escapeAttr(css)}">`;
  const close = '</span>';

  let out = '';
  let depth = 0;
  /** True once we've emitted the opening span for the current top-level element. */
  let wrapped = false;

  const parser = new Parser(
    {
      onopentag(name, attrs) {
        if (VOID_ELEMENTS.has(name)) {
          // A void element at depth 0 is bare inline content; style it directly.
          if (depth === 0) out += `${open}<${name}${renderAttrs(attrs)}>${close}`;
          else out += `<${name}${renderAttrs(attrs)}>`;
          return;
        }
        out += `<${name}${renderAttrs(attrs)}>`;
        if (depth === 0) {
          out += open;
          wrapped = true;
        }
        depth++;
      },
      ontext(text) {
        if (depth === 0) {
          // Bare text between top-level elements — only wrap real content, so
          // we don't litter the output with spans around indentation.
          out += text.trim() ? `${open}${text}${close}` : text;
          return;
        }
        out += text;
      },
      onclosetag(name) {
        if (VOID_ELEMENTS.has(name)) return;
        depth--;
        if (depth === 0 && wrapped) {
          out += close;
          wrapped = false;
        }
        out += `</${name}>`;
      },
    },
    { recognizeSelfClosing: true, lowerCaseTags: true, lowerCaseAttributeNames: true },
  );

  parser.write(html);
  parser.end();

  return out;
}

/**
 * Guarantees the schema's "content is HTML" invariant: bare text imported from
 * Unlayer gets wrapped in a paragraph, matching what `parser-mjml` does.
 */
export function ensureBlockHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '<p></p>';
  return /^<(p|h[1-6]|ul|ol|blockquote|div|table)[\s>]/i.test(trimmed) ? trimmed : `<p>${trimmed}</p>`;
}
