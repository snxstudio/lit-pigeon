// Types
export type {
  PigeonDocument,
  RowNode,
  ColumnNode,
  ContentBlock,
  BlockType,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  SocialBlock,
  HtmlBlock,
  Spacing,
  SocialIcon,
} from './types/document.js';

export type {
  Selection,
  EditorConfig,
  Step,
  PigeonPlugin,
  BlockDefinition,
  Command,
  EditorStateSnapshot,
  TransactionSnapshot,
  Renderer,
  RenderOptions,
  RenderResult,
  RenderError,
} from './types/editor.js';

// State
export { EditorState } from './state/editor-state.js';
export { Transaction, createDocStep } from './state/transaction.js';
export {
  createBlockSelection,
  createRowSelection,
  createColumnSelection,
  createBodySelection,
  selectionsEqual,
} from './state/selection.js';

// Commands
export {
  insertBlock,
  deleteBlock,
  updateBlock,
  moveBlock,
  duplicateBlock,
  insertRow,
  deleteRow,
  moveRow,
  duplicateRow,
  updateRowAttributes,
  addColumn,
  removeColumn,
  resizeColumns,
} from './commands/index.js';

// Schema & Defaults
export {
  createDefaultDocument,
  createBlock,
  createRow,
  createColumn,
  defaultSpacing,
  getDefaultValues,
} from './schema/defaults.js';
export { validateDocument, isValidDocument, type ValidationError } from './schema/schema.js';
export {
  registerBlock,
  getBlockDefinition,
  getAllBlockDefinitions,
  isKnownBlockType,
} from './schema/block-registry.js';

// History
export {
  createHistoryPlugin,
  undo,
  redo,
  canUndo,
  canRedo,
  HISTORY_PLUGIN_NAME,
  type HistoryState,
} from './history/history-plugin.js';

// Plugins
export { PluginRegistry } from './plugins/plugin-registry.js';

// Utils
export { generateId } from './utils/id.js';
export { deepEqual } from './utils/deep-equal.js';
