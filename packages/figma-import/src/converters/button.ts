import { createBlock } from '@lit-pigeon/core';
import type { ButtonBlock } from '@lit-pigeon/core';
import type { FigmaNode } from '../types.js';
import { solidHex } from '../utils.js';

/**
 * Heuristic detection: a FRAME or RECTANGLE that contains exactly one TEXT
 * child, has a small height (< 80px), a non-trivial cornerRadius (>= 2),
 * and a solid background color is treated as a button.
 */
export function looksLikeButton(node: FigmaNode): boolean {
  if (node.type !== 'FRAME' && node.type !== 'INSTANCE' && node.type !== 'COMPONENT') return false;
  const children = (node.children ?? []).filter((c) => c.visible !== false);
  if (children.length !== 1) return false;
  if (children[0].type !== 'TEXT') return false;
  const h = node.absoluteBoundingBox?.height ?? 0;
  if (h > 80) return false;
  const radius = node.cornerRadius ?? 0;
  if (radius < 2) return false;
  const bg = solidHex(node.fills);
  if (!bg) return false;
  return true;
}

export function buttonNodeToBlock(node: FigmaNode): ButtonBlock {
  const textChild = (node.children ?? []).find((c) => c.type === 'TEXT');
  const label = textChild?.characters ?? 'Click';
  const bg = solidHex(node.fills) ?? '#3b82f6';
  const fg = solidHex(textChild?.fills) ?? '#ffffff';
  const radius = Math.round(node.cornerRadius ?? 4);
  const fontSize = textChild?.style?.fontSize ?? 16;
  const fontWeight = String(textChild?.style?.fontWeight ?? 600);

  return createBlock('button', {
    content: `<p>${label.replace(/</g, '&lt;')}</p>`,
    href: '#',
    backgroundColor: bg,
    textColor: fg,
    borderRadius: radius,
    innerPadding: {
      top: Math.round(node.paddingTop ?? 12),
      right: Math.round(node.paddingRight ?? 24),
      bottom: Math.round(node.paddingBottom ?? 12),
      left: Math.round(node.paddingLeft ?? 24),
    },
    fontSize,
    fontWeight,
    alignment: 'center',
    fullWidth: false,
  }) as ButtonBlock;
}
