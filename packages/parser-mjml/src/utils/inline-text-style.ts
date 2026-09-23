import { Parser } from 'htmlparser2';
import type { MjmlNode } from '../mjml-to-document.js';

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'blockquote', 'center', 'dd', 'div', 'dl', 'dt',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table',
  'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
]);

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
  'input', 'link', 'meta', 'source', 'track', 'wbr',
]);

// What the renderer's mj-text produces anyway (its <mj-attributes> and MJML's default colour)
const RENDERER_TEXT_FONT_SIZE = '14px';
const RENDERER_TEXT_COLOR = '#000000';

/**
 * The text block has no colour, font size or font family of its own, so the
 * resolved mj-text values are kept as an inline span in the content, the same
 * shape the rich-text editor produces. mj-hero text is left to the hero parser.
 */
export function inlineTextStyles(node: MjmlNode, bodyFontFamily: string): void {
  if (node.tag === 'mj-hero') return;
  if (node.tag === 'mj-text') {
    const { color, 'font-size': fontSize, 'font-family': fontFamily } = node.attrs;
    const decls: string[] = [];
    if (color && color.toLowerCase() !== RENDERER_TEXT_COLOR) decls.push(`color: ${color}`);
    if (fontSize && fontSize !== RENDERER_TEXT_FONT_SIZE) decls.push(`font-size: ${fontSize}`);
    if (fontFamily && fontFamily !== bodyFontFamily) decls.push(`font-family: ${fontFamily}`);
    if (decls.length > 0) {
      node.text = wrapInlineRuns(node.text, `<span style="${escapeAttr(decls.join('; '))}">`);
    }
    return;
  }
  for (const child of node.children) {
    inlineTextStyles(child, bodyFontFamily);
  }
}

/**
 * Wraps each run of inline content in `open`…`</span>`. Runs sit at the top
 * level or directly inside block elements, so a span never contains a block.
 */
function wrapInlineRuns(html: string, open: string): string {
  const inserts: Array<[number, string]> = [];
  let runStart = -1;
  let runEnd = -1;
  let hasText = false;
  let inlineDepth = 0;

  const flush = () => {
    if (runStart >= 0 && hasText) inserts.push([runStart, open], [runEnd, '</span>']);
    runStart = -1;
    hasText = false;
  };
  const extend = (start: number, end: number) => {
    if (runStart < 0) runStart = start;
    runEnd = end;
  };

  const parser = new Parser({
    onopentag(name) {
      if (inlineDepth === 0 && BLOCK_TAGS.has(name)) {
        flush();
        return;
      }
      extend(parser.startIndex, parser.endIndex + 1);
      if (VOID_TAGS.has(name)) hasText = true;
      else inlineDepth++;
    },
    onclosetag(name, isImplied) {
      if (VOID_TAGS.has(name)) return;
      if (inlineDepth === 0) {
        if (BLOCK_TAGS.has(name)) flush();
        return;
      }
      inlineDepth--;
      if (!isImplied) runEnd = parser.endIndex + 1;
    },
    ontext(text) {
      if (runStart < 0 && !text.trim()) return;
      extend(parser.startIndex, parser.endIndex + 1);
      if (text.trim()) hasText = true;
    },
    oncomment() {
      if (runStart >= 0) runEnd = parser.endIndex + 1;
    },
  }, { recognizeSelfClosing: true, lowerCaseTags: true });
  parser.write(html);
  parser.end();
  flush();

  let out = html;
  for (const [at, text] of inserts.reverse()) {
    out = out.slice(0, at) + text + out.slice(at);
  }
  return out;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
