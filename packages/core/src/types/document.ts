export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SocialIcon {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'custom';
  href: string;
  label?: string;
  iconUrl?: string;
}

export interface TextBlock {
  id: string;
  type: 'text';
  values: {
    content: string;
    padding: Spacing;
    lineHeight: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

export interface ImageBlock {
  id: string;
  type: 'image';
  values: {
    src: string;
    alt: string;
    width: number | 'auto';
    href?: string;
    padding: Spacing;
    alignment: 'left' | 'center' | 'right';
    borderRadius?: number;
  };
}

export interface ButtonBlock {
  id: string;
  type: 'button';
  values: {
    text: string;
    href: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    padding: Spacing;
    innerPadding: Spacing;
    fontSize: number;
    fontWeight: string;
    alignment: 'left' | 'center' | 'right';
    fullWidth: boolean;
  };
}

export interface DividerBlock {
  id: string;
  type: 'divider';
  values: {
    borderColor: string;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    padding: Spacing;
    width: string;
  };
}

export interface SpacerBlock {
  id: string;
  type: 'spacer';
  values: {
    height: number;
  };
}

export interface SocialBlock {
  id: string;
  type: 'social';
  values: {
    icons: SocialIcon[];
    iconSize: number;
    spacing: number;
    alignment: 'left' | 'center' | 'right';
    padding: Spacing;
  };
}

export interface HtmlBlock {
  id: string;
  type: 'html';
  values: {
    content: string;
    padding: Spacing;
  };
}

export type ContentBlock =
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | SocialBlock
  | HtmlBlock;

export type BlockType = ContentBlock['type'];

export interface ColumnNode {
  id: string;
  type: 'column';
  attributes: {
    backgroundColor?: string;
    padding: Spacing;
    borderRadius?: number;
    verticalAlign: 'top' | 'middle' | 'bottom';
  };
  blocks: ContentBlock[];
}

export interface RowNode {
  id: string;
  type: 'row';
  attributes: {
    backgroundColor?: string;
    backgroundImage?: string;
    padding: Spacing;
    fullWidth: boolean;
  };
  columns: ColumnNode[];
  columnRatios: number[];
  locked: boolean;
}

export interface PigeonDocument {
  version: '1.0';
  metadata: {
    name: string;
    previewText?: string;
    createdAt: string;
    updatedAt: string;
  };
  body: {
    attributes: {
      width: number;
      backgroundColor: string;
      fontFamily: string;
      contentAlignment: 'center' | 'left';
    };
    rows: RowNode[];
  };
}
