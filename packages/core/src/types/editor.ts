import type { PigeonDocument, ContentBlock, RowNode, ColumnNode } from './document.js';
import type { AssetStorage } from './asset.js';
import type { BrandKit, BrandKitStorage } from './brand-kit.js';

export interface Selection {
  type: 'block' | 'row' | 'column' | 'body';
  rowId?: string;
  columnId?: string;
  blockId?: string;
}

export interface PresignedUploadParams {
  uploadUrl: string;
  publicUrl: string;
  method?: 'PUT' | 'POST';
  headers?: Record<string, string>;
  fields?: Record<string, string>;
}

export interface AssetManagerConfig {
  enabled?: boolean;
  uploadUrl?: string;
  uploadHeaders?: Record<string, string>;
  acceptedTypes?: string[];
  maxFileSize?: number;
  uploadHandler?: (file: File) => Promise<string>;
  presignedUpload?: {
    getUploadParams: (file: File) => Promise<PresignedUploadParams>;
  };
}

export interface MergeTag {
  name: string;
  label: string;
  category?: string;
  sample?: string;
}

export interface MergeTagConfig {
  trigger?: string;
  tags?: MergeTag[];
}

export interface EditorConfig {
  doc?: PigeonDocument;
  plugins?: PigeonPlugin[];
  assetManager?: AssetManagerConfig;
  mergeTags?: MergeTagConfig;
  /**
   * Optional persistent asset library. When supplied, the asset modal shows
   * a "Library" tab next to "Upload" so users can pick from previously saved
   * assets without re-uploading. The data layer lives in `@lit-pigeon/core`
   * (`AssetStorage`) and a filesystem-backed implementation ships in
   * `@lit-pigeon/mcp-server` (`FsAssetStorage`).
   */
  assetStorage?: AssetStorage;
  /**
   * Optional brand kit (or storage for multiple kits) — saved colors and
   * fonts can be surfaced as palette swatches in the property panels' color
   * pickers and font-family pickers. When a `BrandKit` is passed it is used
   * directly; a `BrandKitStorage` is resolved lazily on demand.
   */
  brandKit?: BrandKit | BrandKitStorage;
}

export interface Step {
  type: string;
  path: string;
  apply(doc: PigeonDocument): PigeonDocument;
  invert(doc: PigeonDocument): Step;
}

export interface PigeonPlugin {
  name: string;
  init?(state: EditorStateSnapshot): unknown;
  apply?(tr: TransactionSnapshot, pluginState: unknown): unknown;
  onStateChange?(newState: EditorStateSnapshot, oldState: EditorStateSnapshot): void;
  blocks?: BlockDefinition[];
  commands?: Record<string, Command>;
}

/**
 * The minimal block shape passed to a {@link BlockDefinition}'s render hooks.
 * Structurally compatible with both built-in `ContentBlock`s and registry
 * `CustomBlock`s.
 */
export interface RegisteredBlock {
  id: string;
  type: string;
  values: Record<string, unknown>;
}

/**
 * A single editable field in a custom block's property panel. The editor
 * renders the matching control and writes changes back to `block.values[key]`.
 */
export interface PropertyField {
  /** Key within the block's `values` this field reads and writes. */
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'color' | 'checkbox' | 'select';
  placeholder?: string;
  /** For `number` fields. */
  min?: number;
  max?: number;
  step?: number;
  /** For `select` fields. */
  options?: Array<{ label: string; value: string }>;
}

export interface BlockDefinition {
  type: string;
  label: string;
  icon: string;
  defaultValues: Record<string, unknown>;
  /**
   * Declarative property form for a custom block. When set, selecting the
   * block in the editor renders these fields (instead of just its label) and
   * writes edits back to the block's `values`. Pairs with `renderCanvas` /
   * `renderMjml` to make a registry block fully editable without forking.
   */
  propertySchema?: PropertyField[];
  /**
   * Optional canvas renderer for a custom block. Returns an HTML string shown
   * in the editor canvas. Without it, a custom block renders as a labelled
   * placeholder chip instead of failing. Built-in blocks ignore this — they
   * have dedicated canvas components.
   */
  renderCanvas?: (block: RegisteredBlock) => string;
  /**
   * Optional MJML renderer for a custom block, used on export. Returns an MJML
   * fragment (e.g. `<mj-text>…</mj-text>`). Without it, the block is emitted as
   * an MJML comment and effectively skipped.
   */
  renderMjml?: (block: RegisteredBlock) => string;
}

export type Command = (
  state: EditorStateSnapshot,
  dispatch?: (tr: TransactionSnapshot) => void,
) => boolean;

export interface EditorStateSnapshot {
  readonly doc: PigeonDocument;
  readonly selection: Selection | null;
  readonly plugins: Map<string, unknown>;
  createTransaction(): TransactionSnapshot;
}

export interface TransactionSnapshot {
  readonly doc: PigeonDocument;
  readonly steps: readonly Step[];
  readonly selection: Selection | null;
  readonly selectionSet: boolean;
  readonly meta: ReadonlyMap<string, unknown>;
  addStep(step: Step): TransactionSnapshot;
  setSelection(sel: Selection | null): TransactionSnapshot;
  setMeta(key: string, value: unknown): TransactionSnapshot;
  getMeta(key: string): unknown;
}

export interface Renderer {
  render(doc: PigeonDocument, options?: RenderOptions): Promise<RenderResult>;
}

export interface RenderOptions {
  minify?: boolean;
  inlineCss?: boolean;
  beautify?: boolean;
  /**
   * When true (default), the MJML renderer injects Outlook (mso) and
   * dark-mode rendering workarounds: a heading-margin reset `<mj-style>`,
   * dark-mode color-scheme `<meta>` tags, and an `[if mso]` conditional
   * block with Arial fallback and blockquote margin reset.
   * Set to false to opt out (useful for testing the bare renderer output).
   */
  outlookWorkarounds?: boolean;
}

export interface RenderResult {
  html: string;
  errors: RenderError[];
}

export interface RenderError {
  message: string;
  line?: number;
  tagName?: string;
}

export type { ContentBlock, RowNode, ColumnNode };
