import type { PigeonDocument, ContentBlock, RowNode, ColumnNode } from './document.js';

export interface Selection {
  type: 'block' | 'row' | 'column' | 'body';
  rowId?: string;
  columnId?: string;
  blockId?: string;
}

export interface AssetManagerConfig {
  enabled?: boolean;
  uploadUrl?: string;
  uploadHeaders?: Record<string, string>;
  acceptedTypes?: string[];
  maxFileSize?: number;
  uploadHandler?: (file: File) => Promise<string>;
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

export interface BlockDefinition {
  type: string;
  label: string;
  icon: string;
  defaultValues: Record<string, unknown>;
}

export type Command = (
  state: EditorStateSnapshot,
  dispatch?: (tr: TransactionSnapshot) => void,
) => boolean;

export interface EditorStateSnapshot {
  readonly doc: PigeonDocument;
  readonly selection: Selection | null;
  readonly plugins: Map<string, unknown>;
}

export interface TransactionSnapshot {
  readonly steps: readonly Step[];
  readonly selection: Selection | null;
  readonly meta: ReadonlyMap<string, unknown>;
}

export interface Renderer {
  render(doc: PigeonDocument, options?: RenderOptions): Promise<RenderResult>;
}

export interface RenderOptions {
  minify?: boolean;
  inlineCss?: boolean;
  beautify?: boolean;
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
