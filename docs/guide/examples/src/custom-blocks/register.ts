import { registerBlock } from '@lit-pigeon/core';
import { registerStandardBlocks } from '@lit-pigeon/blocks';
import { calloutBlock } from './callout-block.js';

// Register once, before any <pigeon-editor> is created: the palette reads the
// registry when it connects. The registry is global to the page.
registerBlock(calloutBlock);

// Optional: the ready-made catalogue (video, countdown, accordion, table, carousel).
registerStandardBlocks();
