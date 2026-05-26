import { createBlock } from '@lit-pigeon/core';
import type { ImageBlock } from '@lit-pigeon/core';
import type { FigmaNode, ImportOptions } from '../types.js';
import { imageRefOf } from '../utils.js';

/** RECTANGLE / FRAME with an IMAGE fill → ImageBlock. Returns null if no image url is resolved. */
export function imageNodeToBlock(node: FigmaNode, opts: ImportOptions): ImageBlock | null {
  const ref = imageRefOf(node.fills);
  if (!ref) return null;
  const url = opts.imageUrls?.[ref];
  if (!url) return null;
  const width = Math.round(node.absoluteBoundingBox?.width ?? 0) || 'auto';
  return createBlock('image', {
    src: url,
    alt: node.name,
    width,
    alignment: 'center',
  }) as ImageBlock;
}
