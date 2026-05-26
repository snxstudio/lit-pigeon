import type { ContentBlock } from '@lit-pigeon/core';
import type { FigmaNode, ImportOptions } from '../types.js';
import { isVisible } from '../utils.js';
import { textNodeToBlock } from './text.js';
import { imageNodeToBlock } from './image.js';
import { looksLikeButton, buttonNodeToBlock } from './button.js';

/**
 * Convert a single Figma node into a Lit Pigeon block.
 * Returns null when the node has no email-meaningful representation
 * (vectors, decorative shapes without image fills, empty groups).
 */
export function nodeToBlock(
  node: FigmaNode,
  opts: ImportOptions,
  warnings: string[],
): ContentBlock | null {
  if (!isVisible(node)) return null;

  if (node.type === 'TEXT') {
    return textNodeToBlock(node);
  }

  if (looksLikeButton(node)) {
    return buttonNodeToBlock(node);
  }

  // RECTANGLE or FRAME with an IMAGE fill — treat as an image block.
  const image = imageNodeToBlock(node, opts);
  if (image) return image;

  // Frames without any explicit role: recurse into the only child if there is one.
  // Otherwise, skip and warn.
  if ((node.type === 'FRAME' || node.type === 'GROUP') && node.children?.length === 1) {
    return nodeToBlock(node.children[0], opts, warnings);
  }

  warnings.push(`Skipped node "${node.name}" (${node.type}) — no email-block mapping.`);
  return null;
}
