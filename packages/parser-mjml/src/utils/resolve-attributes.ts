import type { ParseWarning, MjmlNode } from '../mjml-to-document.js';
import { MJML_DEFAULTS } from './mjml-defaults.js';
import { takeVisibility } from './parse-attributes.js';

type Attrs = Record<string, string>;

/** Defaults declared in `<mj-attributes>`. */
export interface AttributeDefaults {
  all: Attrs;
  tags: Record<string, Attrs>;
  classes: Record<string, Attrs>;
}

// Elements whose css-class the document model keeps
const CSS_CLASS_TAGS = new Set(['mj-section', 'mj-column', 'mj-text', 'mj-button', 'mj-image']);

/**
 * Applies mj-attributes defaults to every node in place, with MJML's
 * precedence: element attribute > mj-class > tag default > mj-all > the
 * element's own MJML default.
 */
export function resolveAttributes(
  node: MjmlNode,
  defaults: AttributeDefaults,
  warnings: ParseWarning[],
): void {
  const { 'mj-class': mjClass = '', ...own } = node.attrs;

  const classAttrs = mjClass.split(/\s+/).filter(Boolean).reduce<Attrs>((acc, name) => {
    const values = defaults.classes[name] ?? {};
    const cssClass: Attrs = acc['css-class'] && values['css-class']
      ? { 'css-class': `${acc['css-class']} ${values['css-class']}` }
      : {};
    return { ...acc, ...values, ...cssClass };
  }, {});

  node.attrs = { ...MJML_DEFAULTS[node.tag], ...defaults.all, ...defaults.tags[node.tag], ...classAttrs, ...own };
  node.visibility = takeVisibility(node.attrs);

  const cssClass = node.attrs['css-class'];
  if (cssClass && !CSS_CLASS_TAGS.has(node.tag)) {
    warnings.push({ message: `css-class "${cssClass}" on <${node.tag}> was dropped`, tag: node.tag });
  }

  for (const child of node.children) {
    resolveAttributes(child, defaults, warnings);
  }
}
