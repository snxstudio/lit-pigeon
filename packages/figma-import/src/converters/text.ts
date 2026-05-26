import { createBlock } from '@lit-pigeon/core';
import type { TextBlock } from '@lit-pigeon/core';
import type { FigmaNode } from '../types.js';
import { solidHex } from '../utils.js';

/** Figma TEXT → TextBlock. Wraps characters in a single <p> with extracted color/size/weight. */
export function textNodeToBlock(node: FigmaNode): TextBlock {
  const characters = node.characters ?? '';
  const style = node.style ?? {};
  const color = solidHex(node.fills) ?? '#1e293b';
  const fontSize = style.fontSize ?? 16;
  const fontWeight = style.fontWeight ?? 400;
  const fontFamily = style.fontFamily;

  const styleParts = [
    `color:${color}`,
    `font-size:${fontSize}px`,
    `font-weight:${fontWeight}`,
  ];
  if (fontFamily) styleParts.push(`font-family:${fontFamily}`);

  const content = `<p style="${styleParts.join(';')};margin:0;">${escapeHtml(characters)}</p>`;

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
