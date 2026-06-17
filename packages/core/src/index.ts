// Types
export type {
  PigeonDocument,
  RowNode,
  ColumnNode,
  ContentBlock,
  CustomBlock,
  AnyBlock,
  BlockType,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  SocialBlock,
  HtmlBlock,
  HeroBlock,
  NavBarBlock,
  NavLink,
  Spacing,
  SocialIcon,
} from './types/document.js';

export type { FontDefinition } from './types/font.js';

export type {
  Selection,
  EditorConfig,
  AssetManagerConfig,
  PresignedUploadParams,
  MergeTag,
  MergeTagConfig,
  Step,
  PigeonPlugin,
  BlockDefinition,
  RegisteredBlock,
  PropertyField,
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

// Templates
export {
  getStarterTemplates,
  getStarterTemplate,
  InMemoryTemplateStorage,
  type Template,
  type TemplateCategory,
  type TemplateStorage,
  type InMemoryTemplateStorageOptions,
} from './templates/index.js';

// Brand kits
export {
  InMemoryBrandKitStorage,
  type InMemoryBrandKitStorageOptions,
  type BrandKit,
  type BrandKitStorage,
  type BrandColor,
  type BrandFont,
  type BrandLogo,
} from './brand-kit/index.js';

// Assets
export {
  InMemoryAssetStorage,
  type InMemoryAssetStorageOptions,
  type Asset,
  type AssetListFilter,
  type AssetStorage,
} from './assets/index.js';

// Row Library
export type { LibraryEntry, RowLibraryStorage } from './types/row-library.js';
export { InMemoryRowLibraryStorage } from './row-library/in-memory-storage.js';
export type { InMemoryRowLibraryStorageOptions } from './row-library/in-memory-storage.js';
export { cloneRowWithNewIds } from './row-library/clone.js';

// Link Types
export type { LinkType } from './types/link-type.js';
export { SYSTEM_LINK_TYPES } from './link-types/system-link-types.js';
