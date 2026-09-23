import type { PigeonDocument, RowNode, ContentBlock } from '@lit-pigeon/core';

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Tags that start a new paragraph in the text output. */
const BLOCK_TAG = /^(p|div|h[1-6]|blockquote|table|tr|ul|ol|section|header|footer)$/;

/** Tags whose content never reaches the reader. */
const HIDDEN_TAG = /^(style|script)$/;

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, name: string) => {
    if (name[0] !== '#') return ENTITIES[name.toLowerCase()];
    const code = /x/i.test(name) ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    return code <= 0x10ffff ? String.fromCodePoint(code) : match;
  });
}

function readAttr(attrs: string, name: string): string {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs);
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3]) : '';
}

/** `#` and empty hrefs are editor placeholders, not destinations. */
function isRealHref(href: string | undefined): href is string {
  return !!href && href.trim() !== '#';
}

function withLink(text: string, href?: string): string {
  if (!isRealHref(href) || href === text) return text;
  return text ? `${text} (${href})` : href;
}

/**
 * Convert rich-text HTML to plain text: paragraphs and headings become
 * blank-line separated, `<br>` a newline, list items `- ` / `1. ` lines and
 * links `text (url)`. Merge tags pass through untouched.
 */
function htmlToText(html: string): string {
  const lists: { ordered: boolean; count: number }[] = [];
  const links: { href: string; start: number }[] = [];
  let hidden = 0;
  let out = '';

  // Comments are skipped by searching for their end rather than with a lazy
  // `[\s\S]*?`, and tags stop at the next `<`, so the scan stays linear.
  const token = /<!--|<(\/?)([a-z][a-z0-9]*)\b([^<>]*)>|([^<]+)|</gi;
  const commentEnd = /--!?>/g;
  let match: RegExpExecArray | null;
  while ((match = token.exec(html))) {
    const [raw, closing, rawTag, attrs, text] = match;
    if (raw === '<!--') {
      commentEnd.lastIndex = token.lastIndex;
      token.lastIndex = commentEnd.exec(html) ? commentEnd.lastIndex : html.length;
      continue;
    }
    if (text !== undefined || raw === '<') {
      if (!hidden) out += decodeEntities((text ?? raw).replace(/\s+/g, ' '));
      continue;
    }
    if (!rawTag) continue;
    const tag = rawTag.toLowerCase();

    if (HIDDEN_TAG.test(tag)) {
      hidden = Math.max(0, hidden + (closing ? -1 : 1));
    } else if (hidden) {
      continue;
    } else if (tag === 'br') {
      out += '\n';
    } else if (tag === 'img' && !closing) {
      out += readAttr(attrs, 'alt');
    } else if (tag === 'a') {
      if (!closing) {
        links.push({ href: readAttr(attrs, 'href'), start: out.length });
      } else {
        const link = links.pop();
        if (link) {
          const inner = out.slice(link.start);
          const lead = /^\s*/.exec(inner)![0];
          out = out.slice(0, link.start) + lead + withLink(inner.trim(), link.href);
        }
      }
    } else if (tag === 'li') {
      const list = lists[lists.length - 1];
      if (!closing) out += `\n${list?.ordered ? `${++list.count}.` : '-'} `;
    } else if (tag === 'ul' || tag === 'ol') {
      if (closing) lists.pop();
      else lists.push({ ordered: tag === 'ol', count: 0 });
      out += '\n\n';
    } else if (BLOCK_TAG.test(tag) && !lists.length) {
      out += '\n\n';
    }
  }

  return out
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function socialName(type: string): string {
  return type[0].toUpperCase() + type.slice(1);
}

function blockToText(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
    case 'html':
    case 'hero':
      return htmlToText(block.values.content);
    case 'button': {
      const label = htmlToText(block.values.content);
      return isRealHref(block.values.href) ? `${label}: ${block.values.href}` : label;
    }
    case 'image':
      return block.values.alt ? withLink(block.values.alt, block.values.href) : '';
    case 'divider':
      return '----------';
    case 'social':
      return block.values.icons
        .filter((icon) => isRealHref(icon.href))
        .map((icon) => `${icon.label || socialName(icon.type)}: ${icon.href}`)
        .join('\n');
    case 'navbar':
      return block.values.links.map((link) => withLink(link.text, link.href)).join(' | ');
    default:
      return '';
  }
}

function rowToText(row: RowNode): string {
  const body = row.columns
    .flatMap((column) => column.blocks.map(blockToText))
    .filter(Boolean)
    .join('\n\n');
  const expr = row.attributes.condition?.trim();
  return expr && body ? `{{#if ${expr}}}\n${body}\n{{/if}}` : body;
}

/**
 * Converts a PigeonDocument into the `text/plain` alternative part of a
 * multipart email. Blocks are separated by a blank line; images fall back to
 * their alt text, buttons render as `label: url` and dividers as a rule.
 * Merge tags and row conditions are kept verbatim so the sending platform
 * substitutes them exactly as it does in the HTML part.
 */
export function documentToPlainText(doc: PigeonDocument): string {
  const text = doc.body.rows.map(rowToText).filter(Boolean).join('\n\n');
  return text ? `${text}\n` : '';
}
