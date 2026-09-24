import type { LinkStyle } from '@lit-pigeon/core';
import { LINK_STYLE_NAME, cssToLinkStyle, generatedStyleName } from '@lit-pigeon/core';
import type { ParseWarning } from '../mjml-to-document.js';
import type { AttributeDefaults } from '../utils/resolve-attributes.js';

export interface HeadData {
  previewText?: string;
  fontFamily?: string;
  linkStyle?: LinkStyle;
  css?: string;
  attributeDefaults: AttributeDefaults;
}

interface HeadNode {
  tag: string;
  attrs: Record<string, string>;
  children: HeadNode[];
  text: string;
}

/**
 * Extracts head data from parsed mj-head children.
 */
export function parseHead(headChildren: HeadNode[], _warnings: ParseWarning[]): HeadData {
  const result: HeadData = { attributeDefaults: { all: {}, tags: {}, classes: {} } };
  const styles: string[] = [];

  for (const child of headChildren) {
    switch (child.tag) {
      case 'mj-preview':
        result.previewText = child.text;
        break;
      case 'mj-attributes':
        for (const attrChild of child.children) {
          const defaults = result.attributeDefaults;
          if (attrChild.tag === 'mj-all') {
            Object.assign(defaults.all, attrChild.attrs);
          } else if (attrChild.tag === 'mj-class') {
            const { name, ...attrs } = attrChild.attrs;
            if (name) defaults.classes[name] = { ...defaults.classes[name], ...attrs };
          } else {
            defaults.tags[attrChild.tag] = { ...defaults.tags[attrChild.tag], ...attrChild.attrs };
          }
        }
        if (result.attributeDefaults.all['font-family']) {
          result.fontFamily = result.attributeDefaults.all['font-family'];
        }
        break;
      case 'mj-style': {
        // Inline styles are applied by MJML at compile time and have no place in the document
        if (child.attrs.inline === 'inline' || !child.text.trim()) break;
        // A block the renderer generated is not the user's CSS: collecting it
        // would hand it back as if they had written it, and the next export
        // would emit it twice. Whatever the document can hold goes back to the
        // field it came from; the rest is regenerated on export anyway.
        const generated = generatedStyleName(child.text);
        if (generated === LINK_STYLE_NAME) result.linkStyle = cssToLinkStyle(child.text);
        else if (!generated) styles.push(child.text.trim());
        break;
      }
      default:
        // Ignore unknown head elements
        break;
    }
  }

  if (styles.length > 0) result.css = styles.join('\n');

  return result;
}
