// Side-effect import: registers the `<pigeon-editor>` custom element.
import '@lit-pigeon/editor';

export { default as PigeonEditor } from './PigeonEditor.svelte';

// Re-export core types for consumer convenience.
export type {
  PigeonDocument,
  EditorConfig,
  Renderer,
  RenderOptions,
  RenderResult,
  Selection,
  ContentBlock,
  RowNode,
  ColumnNode,
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
  AssetManagerConfig,
  MergeTag,
  MergeTagConfig,
} from '@lit-pigeon/core';
