import type { FigmaNode } from '../types.js';
import { solidHex } from '../utils.js';

/**
 * Shared helpers for projecting a Figma TEXT node's style → inline CSS.
 * Extracted from `converters/text.ts` so converters that build their own HTML
 * (e.g. `hero.ts`) can reuse the same color/font-extraction logic without
 * duplicating string-formatting concerns.
 */

export interface TextStyleParts {
  color: string;
  fontSize: number;
  fontWeight: number;
  fontFamily?: string;
}

/** Pull color / font-size / weight / family from a TEXT node, falling back to sensible defaults. */
export function textStyleParts(
  node: FigmaNode,
  fallbackColor = '#1e293b',
): TextStyleParts {
  const style = node.style ?? {};
  return {
    color: solidHex(node.fills) ?? fallbackColor,
    fontSize: style.fontSize ?? 16,
    fontWeight: style.fontWeight ?? 400,
    fontFamily: style.fontFamily,
  };
}

/** Render TextStyleParts as an inline CSS string (semicolon-separated, no trailing `;`). */
export function styleCss(parts: TextStyleParts, extra: Record<string, string> = {}): string {
  const out = [
    `color:${parts.color}`,
    `font-size:${parts.fontSize}px`,
    `font-weight:${parts.fontWeight}`,
  ];
  if (parts.fontFamily) out.push(`font-family:${parts.fontFamily}`);
  for (const [k, v] of Object.entries(extra)) out.push(`${k}:${v}`);
  return out.join(';');
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
