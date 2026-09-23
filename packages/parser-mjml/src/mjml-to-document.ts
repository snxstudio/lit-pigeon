import { Parser } from 'htmlparser2';
import type { PigeonDocument } from '@lit-pigeon/core';
import { parseHead, type HeadData } from './parsers/head-parser.js';
import { parseBody } from './parsers/body-parser.js';
import { resolveAttributes } from './utils/resolve-attributes.js';
import { inlineTextStyles } from './utils/inline-text-style.js';
import { MJML_FONT_FAMILY } from './utils/mjml-defaults.js';

export interface ParseOptions {
  /** If true, lenient parsing will skip unknown elements instead of warning. */
  lenient?: boolean;
}

export interface ParseWarning {
  message: string;
  tag?: string;
  line?: number;
}

export interface ParseResult {
  document: PigeonDocument;
  warnings: ParseWarning[];
}

/**
 * Represents a parsed MJML node in our intermediate tree.
 */
export interface MjmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: MjmlNode[];
  /** Direct text content of this node (text not in child elements). */
  text: string;
}

/**
 * Parses an MJML string into an intermediate tree of MjmlNodes.
 * Uses a raw-text tracking approach to correctly capture inner HTML content
 * for elements like mj-text and mj-raw.
 */
function parseMjmlToTree(mjml: string): MjmlNode {
  const root: MjmlNode = { tag: 'root', attrs: {}, children: [], text: '' };
  const stack: MjmlNode[] = [root];

  // Tags whose inner content should be captured as raw text
  const rawContentTags = new Set([
    'mj-text', 'mj-button', 'mj-raw', 'mj-preview',
    'mj-social-element', 'mj-navbar-link', 'mj-table',
  ]);

  // Self-closing MJML tags that never have children
  const selfClosingTags = new Set([
    'mj-image', 'mj-divider', 'mj-spacer',
    'mj-all', 'mj-class', 'mj-font', 'mj-breakpoint',
  ]);

  // HTML void elements: serialised without a closing tag inside raw content
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
    'input', 'link', 'meta', 'source', 'track', 'wbr',
  ]);

  // Raw tags holding HTML; the others (preview, social and navbar labels) hold plain text
  const htmlContentTags = new Set(['mj-text', 'mj-button', 'mj-raw']);

  // Elements whose text htmlparser2 leaves undecoded, so it must not be re-escaped
  const rawTextElements = new Set(['style', 'script']);

  // htmlparser2 decodes entities; re-escape so captured HTML means what the source meant
  const escapeText = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapeAttr = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

  // Track raw content capture
  let rawCapture: { node: MjmlNode; depth: number } | null = null;
  let rawBuffer = '';
  let rawDepth = 0;
  let inRawTextElement = false;

  const parser = new Parser({
    onopentag(name, attrs) {
      if (rawCapture) {
        // We're inside a raw content tag - accumulate as HTML string
        const isHtml = htmlContentTags.has(rawCapture.node.tag);
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${isHtml ? escapeAttr(v) : v}"`)
          .join(' ');
        rawBuffer += attrStr ? `<${name} ${attrStr}>` : `<${name}>`;
        if (!voidElements.has(name)) rawDepth++;
        if (rawTextElements.has(name)) inRawTextElement = true;
        return;
      }

      const node: MjmlNode = { tag: name, attrs, children: [], text: '' };
      const parent = stack[stack.length - 1];
      parent.children.push(node);

      if (selfClosingTags.has(name)) {
        return; // Don't push to stack
      }

      stack.push(node);

      // Start raw content capture for these tags
      if (rawContentTags.has(name)) {
        rawCapture = { node, depth: 0 };
        rawBuffer = '';
        rawDepth = 0;
      }
    },
    ontext(text) {
      if (rawCapture) {
        const escape = htmlContentTags.has(rawCapture.node.tag) && !inRawTextElement;
        rawBuffer += escape ? escapeText(text) : text;
        return;
      }
      const current = stack[stack.length - 1];
      current.text += text;
    },
    onclosetag(name) {
      if (rawCapture) {
        if (voidElements.has(name)) return;
        if (rawDepth > 0) {
          // Closing a nested tag inside raw content
          rawBuffer += `</${name}>`;
          rawDepth--;
          if (rawTextElements.has(name)) inRawTextElement = false;
          return;
        }
        // Closing the raw content tag itself
        rawCapture.node.text = rawBuffer;
        rawCapture = null;
        rawBuffer = '';
        rawDepth = 0;
        // Pop from stack
        if (stack.length > 1 && stack[stack.length - 1].tag === name) {
          stack.pop();
        }
        return;
      }

      if (selfClosingTags.has(name)) return;
      if (stack.length > 1 && stack[stack.length - 1].tag === name) {
        stack.pop();
      }
    },
    oncomment(data) {
      // Keeps Outlook conditional comments (<!--[if mso]>) inside raw content
      if (rawCapture) {
        rawBuffer += `<!--${data}-->`;
      }
    },
  }, {
    recognizeSelfClosing: true,
    lowerCaseTags: true,
    lowerCaseAttributeNames: true,
  });

  parser.write(mjml);
  parser.end();

  return root;
}

/**
 * Finds a node by tag name in the tree (depth-first).
 */
function findNode(node: MjmlNode, tag: string): MjmlNode | undefined {
  if (node.tag === tag) return node;
  for (const child of node.children) {
    const found = findNode(child, tag);
    if (found) return found;
  }
  return undefined;
}

/**
 * Converts an MJML string into a PigeonDocument.
 *
 * @param mjml - The MJML markup string to parse
 * @param options - Optional parsing configuration
 * @returns ParseResult containing the document and any warnings
 */
export function mjmlToDocument(mjml: string, _options?: ParseOptions): ParseResult {
  const warnings: ParseWarning[] = [];

  // Parse MJML string into tree
  const tree = parseMjmlToTree(mjml);

  // Find key elements
  const mjmlRoot = findNode(tree, 'mjml');
  if (!mjmlRoot) {
    warnings.push({ message: 'No <mjml> root element found' });
    return {
      document: createFallbackDocument(),
      warnings,
    };
  }

  const headNode = findNode(mjmlRoot, 'mj-head');
  const bodyNode = findNode(mjmlRoot, 'mj-body');

  // Parse head
  let headData: HeadData = { attributeDefaults: { all: {}, tags: {}, classes: {} } };
  if (headNode) {
    headData = parseHead(
      headNode.children.map(c => ({
        tag: c.tag,
        attrs: c.attrs,
        children: c.children.map(gc => ({
          tag: gc.tag,
          attrs: gc.attrs,
          children: [],
          text: gc.text,
        })),
        text: c.text,
      })),
      warnings,
    );
  }

  // Parse body
  if (!bodyNode) {
    warnings.push({ message: 'No <mj-body> element found' });
    return {
      document: createFallbackDocument(),
      warnings,
    };
  }

  const fontFamily = headData.fontFamily ?? MJML_FONT_FAMILY;
  resolveAttributes(bodyNode, headData.attributeDefaults, warnings);
  inlineTextStyles(bodyNode, fontFamily);

  const bodyData = parseBody(bodyNode, warnings);

  const now = new Date().toISOString();
  const document: PigeonDocument = {
    version: '1.0',
    metadata: {
      name: 'Imported Template',
      previewText: headData.previewText,
      createdAt: now,
      updatedAt: now,
    },
    body: {
      attributes: {
        width: bodyData.width,
        backgroundColor: bodyData.backgroundColor,
        fontFamily,
        contentAlignment: 'center',
        css: headData.css,
      },
      rows: bodyData.rows,
    },
  };

  return { document, warnings };
}

function createFallbackDocument(): PigeonDocument {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    metadata: {
      name: 'Imported Template',
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
