import type { BlockDefinition } from '@lit-pigeon/core';
import { registerBlock } from '@lit-pigeon/core';
import { videoBlock } from './blocks/video.js';
import { countdownBlock } from './blocks/countdown.js';
import { accordionBlock } from './blocks/accordion.js';
import { tableBlock } from './blocks/table.js';
import { carouselBlock } from './blocks/carousel.js';

export { videoBlock } from './blocks/video.js';
export { countdownBlock } from './blocks/countdown.js';
export { accordionBlock } from './blocks/accordion.js';
export { tableBlock } from './blocks/table.js';
export { carouselBlock } from './blocks/carousel.js';

/** The full standard catalog. Equivalent to the five named exports together. */
export const standardBlocks: BlockDefinition[] = [
  videoBlock,
  countdownBlock,
  accordionBlock,
  tableBlock,
  carouselBlock,
];

/**
 * Register every block in {@link standardBlocks} with the core registry.
 * Call once at app boot (before `<pigeon-editor>` mounts) to make the
 * full catalog available in the palette, canvas, and exporters.
 *
 * To register a subset, import the individual block constants and call
 * `registerBlock(...)` directly.
 */
export function registerStandardBlocks(): void {
  for (const def of standardBlocks) {
    registerBlock(def);
  }
}
