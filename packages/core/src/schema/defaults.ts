import type {
  PigeonDocument,
  Spacing,
  TextBlock,
  ImageBlock,
  ButtonBlock,
  DividerBlock,
  SpacerBlock,
  SocialBlock,
  HtmlBlock,
  HeroBlock,
  NavBarBlock,
  ContentBlock,
  BlockType,
  RowNode,
  ColumnNode,
} from '../types/document.js';
import { generateId } from '../utils/id.js';

export function defaultSpacing(all = 0): Spacing {
  return { top: all, right: all, bottom: all, left: all };
}

export function defaultTextValues(): TextBlock['values'] {
  return {
    content: '<p>Enter your text here</p>',
    padding: defaultSpacing(10),
    lineHeight: '1.5',
    textAlign: 'left',
  };
}

export function defaultImageValues(): ImageBlock['values'] {
  return {
    src: '',
    alt: '',
    width: 'auto',
    padding: defaultSpacing(10),
    alignment: 'center',
  };
}

export function defaultButtonValues(): ButtonBlock['values'] {
  return {
    text: 'Click me',
    href: '#',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderRadius: 4,
    padding: defaultSpacing(10),
    innerPadding: { top: 12, right: 24, bottom: 12, left: 24 },
    fontSize: 16,
    fontWeight: '600',
    alignment: 'center',
    fullWidth: false,
  };
}

export function defaultDividerValues(): DividerBlock['values'] {
  return {
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderStyle: 'solid',
    padding: defaultSpacing(10),
    width: '100%',
  };
}

export function defaultSpacerValues(): SpacerBlock['values'] {
  return { height: 20 };
}

export function defaultSocialValues(): SocialBlock['values'] {
  return {
    icons: [],
    iconSize: 32,
    spacing: 8,
    alignment: 'center',
    padding: defaultSpacing(10),
  };
}

export function defaultHtmlValues(): HtmlBlock['values'] {
  return {
    content: '',
    padding: defaultSpacing(0),
  };
}

export function defaultHeroValues(): HeroBlock['values'] {
  return {
    backgroundUrl: '',
    backgroundPosition: 'center center',
    mode: 'fluid-height',
    width: 600,
    height: 400,
    verticalAlign: 'middle',
    padding: defaultSpacing(0),
    innerPadding: defaultSpacing(20),
    backgroundColor: '#ffffff',
    content: '<p style="color:#ffffff;font-size:24px;">Hero Title</p>',
  };
}

export function defaultNavBarValues(): NavBarBlock['values'] {
  return {
    links: [
      { href: '#', text: 'Home' },
      { href: '#', text: 'About' },
      { href: '#', text: 'Contact' },
    ],
    hamburger: 'hamburger',
    alignment: 'center',
    padding: defaultSpacing(10),
    linkColor: '#000000',
    linkFontSize: 14,
    linkPadding: '10px 15px',
  };
}

const defaultValuesMap: Record<BlockType, () => ContentBlock['values']> = {
  text: defaultTextValues,
  image: defaultImageValues,
  button: defaultButtonValues,
  divider: defaultDividerValues,
  spacer: defaultSpacerValues,
  social: defaultSocialValues,
  html: defaultHtmlValues,
  hero: defaultHeroValues,
  navbar: defaultNavBarValues,
};

export function getDefaultValues(type: BlockType): ContentBlock['values'] {
  const factory = defaultValuesMap[type];
  if (!factory) {
    throw new Error(`Unknown block type: ${type}`);
  }
  return factory();
}

export function createBlock(type: BlockType, overrides?: Partial<ContentBlock['values']>): ContentBlock {
  return {
    id: generateId(),
    type,
    values: { ...getDefaultValues(type), ...overrides },
  } as ContentBlock;
}

export function createColumn(blocks: ContentBlock[] = []): ColumnNode {
  return {
    id: generateId(),
    type: 'column',
    attributes: {
      padding: defaultSpacing(0),
      verticalAlign: 'top',
    },
    blocks,
  };
}

export function createRow(
  columns?: ColumnNode[],
  columnRatios?: number[],
): RowNode {
  const cols = columns ?? [createColumn()];
  const ratios = columnRatios ?? cols.map(() => Math.floor(12 / cols.length));
  return {
    id: generateId(),
    type: 'row',
    attributes: {
      padding: defaultSpacing(0),
      fullWidth: false,
    },
    columns: cols,
    columnRatios: ratios,
    locked: false,
  };
}

export function createDefaultDocument(name = 'Untitled'): PigeonDocument {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    metadata: {
      name,
      createdAt: now,
      updatedAt: now,
    },
    body: {
      attributes: {
        width: 600,
        backgroundColor: '#f4f4f5',
        fontFamily: 'Arial, Helvetica, sans-serif',
        contentAlignment: 'center',
      },
      rows: [],
    },
  };
}
