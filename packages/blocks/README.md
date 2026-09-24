# @lit-pigeon/blocks

Optional standard block catalog for [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) —
**video, countdown, accordion, table, and carousel** — shipped as plugin
`BlockDefinition`s rather than editor built-ins. Register the ones you want and
they show up in the palette, canvas, and MJML export.

## Install

```bash
npm install @lit-pigeon/blocks
```

## Usage

Register the full catalog once at app boot, before `<pigeon-editor>` mounts:

```ts
import { registerStandardBlocks } from '@lit-pigeon/blocks';
import '@lit-pigeon/editor';

registerStandardBlocks(); // video + countdown + accordion + table + carousel
```

Prefer a subset? Import the individual `BlockDefinition`s and register them
against the core registry yourself:

```ts
import { videoBlock, countdownBlock } from '@lit-pigeon/blocks';
import { registerBlock } from '@lit-pigeon/core';

registerBlock(videoBlock);
registerBlock(countdownBlock);
```

The exported `standardBlocks` array is equivalent to the five named blocks
together.

The registry is global and the palette reads it when the editor connects, so
register first. Documents that contain these blocks do not pass
`validateDocument` (it accepts only built-in types), and the blocks do not
survive an MJML round trip; store such templates as JSON. See
[Custom blocks](../../docs/guide/custom-blocks.md).

Part of [Lit Pigeon](https://github.com/snxstudio/lit-pigeon) — open-source drag-and-drop email editor.

## License

MIT
