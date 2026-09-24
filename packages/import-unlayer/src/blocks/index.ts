import type { Border, ContentBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import type { UnlayerContent } from '../types.js';
import type { ImportWarning } from '../warnings.js';
import { align, color, dig, parseSpacing, px, str, weight } from '../utils/values.js';
import { applyInlineStyle, ensureBlockHtml } from '../utils/inline-style.js';

/** Body-level defaults that Unlayer content blocks inherit when unset. */
export interface InheritedStyle {
  fontFamily?: string;
  textColor?: string;
}

/**
 * Converts one Unlayer content block. Returns `null` when the block has no
 * representation in the Pigeon document model and should be dropped — the
 * caller records a warning in that case.
 */
export function convertContent(
  content: UnlayerContent,
  inherited: InheritedStyle,
  warnings: ImportWarning[],
): ContentBlock | null {
  const type = str(content.type);
  const v = (content.values ?? {}) as Record<string, unknown>;

  switch (type) {
    case 'text': return textBlock(v, inherited);
    case 'heading': return headingBlock(v, inherited, warnings);
    case 'image': return imageBlock(v);
    case 'button': return buttonBlock(v);
    case 'divider': return dividerBlock(v);
    case 'html': return htmlBlock(v);
    case 'menu': return menuBlock(v, inherited);
    case 'social': return socialBlock(v);
    default:
      return null;
  }
}

function textBlock(v: Record<string, unknown>, inherited: InheritedStyle): ContentBlock {
  const styled = applyInlineStyle(str(v.text), {
    fontSize: str(v.fontSize) || undefined,
    color: color(v.color) ?? inherited.textColor,
    fontFamily: inherited.fontFamily,
  });
  return {
    id: generateId(),
    type: 'text',
    values: {
      content: ensureBlockHtml(styled),
      padding: parseSpacing(v.containerPadding, 10),
      lineHeight: str(v.lineHeight, '140%'),
      textAlign: align(v.textAlign),
    },
  };
}

/**
 * Unlayer models headings as their own content type; Pigeon models them as a
 * text block whose content happens to be a heading element.
 */
function headingBlock(
  v: Record<string, unknown>,
  inherited: InheritedStyle,
  warnings: ImportWarning[],
): ContentBlock {
  const requested = str(v.headingType, 'h1').toLowerCase();
  // The rich-text sanitiser only keeps h1-h3, so deeper levels are clamped.
  let tag = /^h[1-6]$/.test(requested) ? requested : 'h1';
  if (/^h[4-6]$/.test(tag)) {
    warnings.push({
      code: 'heading-level-clamped',
      message: `Heading level <${tag}> is not supported by the editor; imported as <h3>.`,
    });
    tag = 'h3';
  }

  const styled = applyInlineStyle(str(v.text), {
    fontSize: str(v.fontSize) || undefined,
    color: color(v.color) ?? inherited.textColor,
    fontFamily: inherited.fontFamily,
  });

  return {
    id: generateId(),
    type: 'text',
    values: {
      content: `<${tag}>${styled}</${tag}>`,
      padding: parseSpacing(v.containerPadding, 10),
      lineHeight: str(v.lineHeight, '140%'),
      textAlign: align(v.textAlign),
    },
  };
}

function imageBlock(v: Record<string, unknown>): ContentBlock {
  const href = str(dig(v, 'action', 'values', 'href'));
  const autoWidth = dig(v, 'src', 'autoWidth') === true;
  return {
    id: generateId(),
    type: 'image',
    values: {
      src: str(dig(v, 'src', 'url')),
      alt: str(v.altText),
      width: autoWidth ? 'auto' : px(dig(v, 'src', 'width'), 0) || 'auto',
      ...(href ? { href } : {}),
      padding: parseSpacing(v.containerPadding, 10),
      alignment: align(v.textAlign, 'center'),
    },
  };
}

/**
 * Unlayer stores a button border per side (`borderTopWidth` and friends) and
 * writes `"none"` on every side when there is none. The document model has one
 * border for all four, so the top side is what comes across — the same side
 * `dividerBlock` reads.
 */
function buttonBorder(value: unknown): Border | undefined {
  const width = px(dig(value, 'borderTopWidth'), 0);
  const style = str(dig(value, 'borderTopStyle'), 'solid');
  if (width <= 0 || style === 'none' || style === 'hidden') return undefined;
  return {
    width,
    style: style === 'dashed' || style === 'dotted' ? style : 'solid',
    color: color(dig(value, 'borderTopColor')) ?? '#000000',
  };
}

function buttonBlock(v: Record<string, unknown>): ContentBlock {
  const border = buttonBorder(v.border);
  return {
    id: generateId(),
    type: 'button',
    values: {
      content: ensureBlockHtml(str(v.text)),
      href: str(dig(v, 'href', 'values', 'href'), '#'),
      backgroundColor: color(dig(v, 'buttonColors', 'backgroundColor')) ?? '#3b82f6',
      textColor: color(dig(v, 'buttonColors', 'color')) ?? '#ffffff',
      borderRadius: px(v.borderRadius, 4),
      ...(border ? { border } : {}),
      padding: parseSpacing(v.containerPadding, 10),
      innerPadding: parseSpacing(v.padding, 12),
      fontSize: px(v.fontSize, 16),
      fontWeight: weight(v.fontWeight) ?? '600',
      alignment: align(v.textAlign, 'center'),
      // Unlayer's `size.autoWidth` is the inverse of Pigeon's `fullWidth`.
      fullWidth: dig(v, 'size', 'autoWidth') === false,
    },
  };
}

function dividerBlock(v: Record<string, unknown>): ContentBlock {
  const style = str(dig(v, 'border', 'borderTopStyle'), 'solid');
  return {
    id: generateId(),
    type: 'divider',
    values: {
      borderColor: color(dig(v, 'border', 'borderTopColor')) ?? '#cccccc',
      borderWidth: px(dig(v, 'border', 'borderTopWidth'), 1),
      borderStyle: style === 'dashed' || style === 'dotted' ? style : 'solid',
      padding: parseSpacing(v.containerPadding, 10),
      width: str(v.width, '100%'),
    },
  };
}

function htmlBlock(v: Record<string, unknown>): ContentBlock {
  return {
    id: generateId(),
    type: 'html',
    values: {
      content: str(v.html),
      padding: parseSpacing(v.containerPadding, 0),
    },
  };
}

function menuBlock(v: Record<string, unknown>, inherited: InheritedStyle): ContentBlock {
  const items = dig(v, 'menu', 'items');
  const links = Array.isArray(items)
    ? items.map((item) => ({
        href: str(dig(item, 'link', 'values', 'href'), '#'),
        text: str(dig(item, 'text')),
      }))
    : [];

  return {
    id: generateId(),
    type: 'navbar',
    values: {
      links,
      hamburger: 'none',
      alignment: align(v.align, 'center'),
      padding: parseSpacing(v.containerPadding, 10),
      linkColor: color(v.linkColor) ?? color(v.textColor) ?? inherited.textColor ?? '#000000',
      linkFontSize: px(v.fontSize, 14),
      linkPadding: str(v.padding, '5px 10px'),
    },
  };
}

/** Maps Unlayer's icon `name` onto the platforms Pigeon renders natively. */
const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'] as const;
type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

function socialType(name: string): SocialPlatform | 'custom' {
  const n = name.toLowerCase();
  // Unlayer still labels the X icon "twitter" in most saved designs.
  if (n === 'x') return 'twitter';
  return (SOCIAL_PLATFORMS as readonly string[]).includes(n) ? (n as SocialPlatform) : 'custom';
}

function socialBlock(v: Record<string, unknown>): ContentBlock {
  const raw = dig(v, 'icons', 'icons');
  const icons = Array.isArray(raw)
    ? raw.map((icon) => {
        const name = str(dig(icon, 'name'));
        const type = socialType(name);
        const iconUrl = str(dig(icon, 'image', 'url')) || str(dig(icon, 'src'));
        return {
          type,
          href: str(dig(icon, 'url'), '#'),
          ...(name ? { label: name } : {}),
          ...(type === 'custom' && iconUrl ? { iconUrl } : {}),
        };
      })
    : [];

  return {
    id: generateId(),
    type: 'social',
    values: {
      icons,
      iconSize: px(dig(v, 'icons', 'iconSize'), 32),
      spacing: px(v.spacing, 8),
      alignment: align(v.align, 'center'),
      padding: parseSpacing(v.containerPadding, 10),
    },
  };
}
