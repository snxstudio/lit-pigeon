import { createBlock } from '@lit-pigeon/core';
import type { TextBlock } from '@lit-pigeon/core';
import type { FigmaNode } from '../types.js';
import { escapeHtml, styleCss, textStyleParts } from './text-style.js';

/** Figma TEXT → TextBlock. Wraps characters in a single <p> with extracted color/size/weight. */
export function textNodeToBlock(node: FigmaNode): TextBlock {
  const characters = node.characters ?? '';
  const parts = textStyleParts(node);
  const style = node.style ?? {};

  const css = styleCss(parts) + ';margin:0;';
  const content = `<p style="${css}">${escapeHtml(characters)}</p>`;

  const align = (style.textAlignHorizontal === 'LEFT' ? 'left'
    : style.textAlignHorizontal === 'RIGHT' ? 'right'
    : 'center') as TextBlock['values']['textAlign'];

  const lineHeight = style.lineHeightPx
    ? String(Math.round(style.lineHeightPx))
    : '1.5';

  return createBlock('text', {
    content,
    lineHeight,
    textAlign: align,
  }) as TextBlock;
}
