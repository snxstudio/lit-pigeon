import type { ContentBlock } from '@lit-pigeon/core';
import { generateId, getBlockDefinition } from '@lit-pigeon/core';
import type { UnlayerContent } from '../types.js';
import type { ImportWarning } from '../warnings.js';
import { align, color, dig, parseSpacing, px, str } from '../utils/values.js';
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
    case 'video': return videoBlock(v, warnings);
    case 'timer': return timerBlock(v, warnings);
    default:
      return null;
  }
}

/**
 * Builds a block whose type comes from `@lit-pigeon/blocks` rather than the
 * built-in set. The importer deliberately does not depend on that package —
 * that would drag the whole standard catalog into every migration — so the
 * values are written out by hand and have to match the definition's own
 * defaults, and `ColumnNode.blocks` takes the block by cast until #19 opens
 * the union up. Both renderers dispatch on the type string at runtime.
 *
 * If the host has not registered the catalog the block shows as the registry's
 * labelled placeholder rather than disappearing, which is better than dropping
 * it but not something to do silently.
 */
function pluginBlock(
  type: string,
  values: Record<string, unknown>,
  contentType: string,
  warnings: ImportWarning[],
): ContentBlock {
  if (!getBlockDefinition(type)) {
    warnings.push({
      code: 'plugin-block',
      contentType,
      message:
        `Imported as a "${type}" block from @lit-pigeon/blocks, which is not registered. ` +
        'Install the package and call registerStandardBlocks(), or the block renders as a placeholder.',
    });
  }
  return { id: generateId(), type, values } as unknown as ContentBlock;
}

/**
 * Unlayer stores the video's link and its poster image separately; the poster
 * is what actually renders, because no email client plays video inline.
 */
function videoBlock(v: Record<string, unknown>, warnings: ImportWarning[]): ContentBlock {
  const poster = str(dig(v, 'thumbnail', 'url')) || str(v.thumbnailUrl);
  return pluginBlock('video', {
    posterUrl: poster,
    videoUrl: str(v.videoUrl, '#'),
    alt: str(v.altText) || 'Watch the video',
    width: px(dig(v, 'thumbnail', 'width'), 560) || 560,
    playButtonColor: color(v.playIconColor) ?? '#ffffff',
  }, 'video', warnings);
}

/**
 * Unlayer's timer renders as a hosted per-open image; the design JSON keeps the
 * end time rather than that URL, so the countdown block takes it as its
 * fallback label and the user pastes their own countdown image.
 */
function timerBlock(v: Record<string, unknown>, warnings: ImportWarning[]): ContentBlock {
  return pluginBlock('countdown', {
    imageUrl: '',
    alt: 'Countdown',
    href: str(dig(v, 'href', 'values', 'href')),
    width: 480,
    endDateLabel: str(v.endTime),
  }, 'timer', warnings);
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

function buttonBlock(v: Record<string, unknown>): ContentBlock {
  return {
    id: generateId(),
    type: 'button',
    values: {
      content: ensureBlockHtml(str(v.text)),
      href: str(dig(v, 'href', 'values', 'href'), '#'),
      backgroundColor: color(dig(v, 'buttonColors', 'backgroundColor')) ?? '#3b82f6',
      textColor: color(dig(v, 'buttonColors', 'color')) ?? '#ffffff',
      borderRadius: px(v.borderRadius, 4),
      padding: parseSpacing(v.containerPadding, 10),
      innerPadding: parseSpacing(v.padding, 12),
      fontSize: px(v.fontSize, 16),
      fontWeight: '600',
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
