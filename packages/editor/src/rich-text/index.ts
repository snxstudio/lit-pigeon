import type { RichTextModule } from './types.js';
export type { CreateEditorOptions, RichTextModule } from './types.js';
import { createEditor } from './editor-factory.js';

const richTextModule: RichTextModule = { createEditor };
export default richTextModule;
export { createEditor };
