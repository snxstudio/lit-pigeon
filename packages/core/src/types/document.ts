export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Hides a block or column at one breakpoint. Rendered as an MJML `css-class`
 * (`pigeon-hide-mobile` / `pigeon-hide-desktop`) plus a media query.
 */
export type DeviceVisibility = {
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
};

export interface SocialIcon {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'custom';
  href: string;
  label?: string;
  iconUrl?: string;
}

export interface TextBlock {
  id: string;
  type: 'text';
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
    content: string;
    padding: Spacing;
    lineHeight: string;
    textAlign: 'left' | 'center' | 'right';
    /** Written out as MJML `css-class`. */
    cssClass?: string;
  };
}

export interface ImageBlock {
  id: string;
  type: 'image';
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
    src: string;
    alt: string;
    width: number | 'auto';
    href?: string;
    padding: Spacing;
    alignment: 'left' | 'center' | 'right';
    borderRadius?: number;
    /** Written out as MJML `css-class`. */
    cssClass?: string;
  };
}

export interface ButtonBlock {
  id: string;
  type: 'button';
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
    content: string;
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
    /** Written out as MJML `css-class`. */
    cssClass?: string;
  };
}

export interface DividerBlock {
  id: string;
  type: 'divider';
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
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
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
    height: number;
  };
}

export interface SocialBlock {
  id: string;
  type: 'social';
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
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
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
    content: string;
    padding: Spacing;
  };
}

export interface HeroBlock {
  id: string;
  type: 'hero';
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
    backgroundUrl: string;
    backgroundPosition: 'center center' | 'top center' | 'bottom center' | 'left center' | 'right center';
    mode: 'fixed-height' | 'fluid-height';
    width: number;
    height: number;
    verticalAlign: 'top' | 'middle' | 'bottom';
    padding: Spacing;
    innerPadding: Spacing;
    backgroundColor: string;
    content: string;
  };
}

export interface NavLink {
  href: string;
  text: string;
  color?: string;
  fontWeight?: string;
  textDecoration?: string;
  padding?: string;
}

export interface NavBarBlock {
  id: string;
  type: 'navbar';
  values: DeviceVisibility & {
    /** Display condition; see {@link RowNode} `condition`. Wraps just this block. */
    condition?: string;
    links: NavLink[];
    hamburger: 'hamburger' | 'none';
    alignment: 'left' | 'center' | 'right';
    padding: Spacing;
    linkColor: string;
    linkFontSize: number;
    linkPadding: string;
  };
}

export type ContentBlock =
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | SocialBlock
  | HtmlBlock
  | HeroBlock
  | NavBarBlock;

export type BlockType = ContentBlock['type'];

/**
 * A block whose `type` was contributed at runtime via the block registry
 * (`registerBlock`) rather than being one of the built-in {@link ContentBlock}
 * kinds. Its `values` are an open record because the editor core can't know a
 * plugin block's shape ahead of time.
 */
export interface CustomBlock {
  id: string;
  type: string;
  values: Record<string, unknown>;
}

/**
 * Either a built-in {@link ContentBlock} or a registry-defined
 * {@link CustomBlock}. Use this where code must accept plugin blocks as well as
 * the built-ins (e.g. `createBlock`, canvas/MJML registry dispatch).
 */
export type AnyBlock = ContentBlock | CustomBlock;

export interface ColumnNode {
  id: string;
  type: 'column';
  attributes: DeviceVisibility & {
    backgroundColor?: string;
    padding: Spacing;
    borderRadius?: number;
    verticalAlign: 'top' | 'middle' | 'bottom';
    /** Written out as MJML `css-class`. */
    cssClass?: string;
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
    /**
     * Optional display condition. When set, the row only renders when the
     * expression is truthy in the sending platform's template engine. The
     * renderer wraps the section in `{{#if <condition>}} … {{/if}}` (Handlebars
     * / Liquid-style, passed through verbatim), e.g. `condition: "user.premium"`.
     */
    condition?: string;
    /** Written out as MJML `css-class`. */
    cssClass?: string;
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
      /** Document-level CSS, written out as a non-inline `<mj-style>`. */
      css?: string;
    };
    rows: RowNode[];
  };
}
