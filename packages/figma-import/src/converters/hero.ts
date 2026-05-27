import { createBlock } from '@lit-pigeon/core';
import type { HeroBlock } from '@lit-pigeon/core';
import type { FigmaNode, ImportOptions } from '../types.js';
import { imageRefOf, isVisible, solidHex } from '../utils.js';
import { escapeHtml, styleCss, textStyleParts } from './text-style.js';
import { looksLikeButton } from './button.js';

/** Tunables — kept in one place so tests can pin the heuristic edges. */
const MIN_HERO_HEIGHT = 120;
const MIN_HERO_WIDTH = 280;
const MAX_TEXT_SEARCH_DEPTH = 3;

/**
 * Heuristic: a frame qualifies as a hero when it has either an IMAGE fill
 * (resolvable to a URL via `opts.imageUrls`) or a solid-fill background,
 * contains at least one descendant TEXT node, and is reasonably large.
 *
 * Buttons get the first say — `looksLikeButton` runs first to prevent
 * a rounded CTA frame with a label from looking hero-shaped.
 */
export function looksLikeHero(node: FigmaNode, opts: ImportOptions = {}): boolean {
  if (node.type !== 'FRAME' && node.type !== 'COMPONENT' && node.type !== 'INSTANCE') {
    return false;
  }
  if (looksLikeButton(node)) return false;

  const box = node.absoluteBoundingBox;
  if (!box) return false;
  if (box.height < MIN_HERO_HEIGHT) return false;
  if (box.width < MIN_HERO_WIDTH) return false;

  // Need a background of some sort: an image we can resolve OR a solid fill.
  const imgRef = imageRefOf(node.fills);
  const hasImage = !!imgRef && (opts.imageUrls === undefined || !!opts.imageUrls[imgRef]);
  const hasSolid = !!solidHex(node.fills) || !!solidHex(node.background);
  if (!hasImage && !hasSolid) return false;

  if (collectTextNodes(node, MAX_TEXT_SEARCH_DEPTH).length === 0) return false;

  return true;
}

/** Convert a hero-shaped Figma frame into a HeroBlock. */
export function heroNodeToBlock(node: FigmaNode, opts: ImportOptions): HeroBlock {
  const box = node.absoluteBoundingBox;
  const width = Math.round(box?.width ?? 600);
  const height = Math.round(box?.height ?? 320);

  const imgRef = imageRefOf(node.fills);
  const backgroundUrl = (imgRef && opts.imageUrls?.[imgRef]) || '';
  const backgroundColor = solidHex(node.fills) ?? solidHex(node.background) ?? '';

  const mode: HeroBlock['values']['mode'] =
    !node.layoutMode || node.layoutMode === 'NONE' ? 'fixed-height' : 'fluid-height';

  const verticalAlign: HeroBlock['values']['verticalAlign'] =
    node.counterAxisAlignItems === 'MIN' ? 'top'
      : node.counterAxisAlignItems === 'MAX' ? 'bottom'
        : 'middle';

  const innerPadding = {
    top: Math.round(node.paddingTop ?? 0),
    right: Math.round(node.paddingRight ?? 0),
    bottom: Math.round(node.paddingBottom ?? 0),
    left: Math.round(node.paddingLeft ?? 0),
  };

  const texts = collectTextNodes(node, MAX_TEXT_SEARCH_DEPTH);
  const content = buildHeroContent(texts);

  return createBlock('hero', {
    backgroundUrl,
    backgroundPosition: 'center center',
    mode,
    width,
    height,
    verticalAlign,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    innerPadding,
    backgroundColor,
    content,
  }) as HeroBlock;
}

/** Document-order list of TEXT descendants (direct + nested, up to `maxDepth`). */
function collectTextNodes(node: FigmaNode, maxDepth: number): FigmaNode[] {
  const out: FigmaNode[] = [];
  const walk = (n: FigmaNode, depth: number) => {
    if (depth > maxDepth) return;
    for (const child of n.children ?? []) {
      if (!isVisible(child)) continue;
      if (child.type === 'TEXT') {
        out.push(child);
      } else if (child.children?.length) {
        walk(child, depth + 1);
      }
    }
  };
  walk(node, 1);
  return out;
}

/** First TEXT → <h1>, the rest → <p>. Empty list yields an empty string. */
function buildHeroContent(texts: FigmaNode[]): string {
  if (texts.length === 0) return '';
  const parts: string[] = [];
  texts.forEach((t, i) => {
    const chars = t.characters ?? '';
    // For hero text, default fallback is white — hero backgrounds are typically dark / image.
    const style = textStyleParts(t, '#ffffff');
    const css = styleCss(style) + ';margin:0;';
    const tag = i === 0 ? 'h1' : 'p';
    parts.push(`<${tag} style="${css}">${escapeHtml(chars)}</${tag}>`);
  });
  return parts.join('');
}
