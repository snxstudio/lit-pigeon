import type { SpacerBlock } from '@lit-pigeon/core';

/**
 * Renders a SpacerBlock to an MJML <mj-spacer> element.
 */
export function renderSpacerBlock(block: SpacerBlock): string {
  const { height } = block.values;

  return `<mj-spacer height="${height}px" />`;
}
