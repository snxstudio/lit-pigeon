import { Node, mergeAttributes } from '@tiptap/core';
import { sanitizeCanvasHTML } from '../../components/blocks/canvas-html.js';
import type { RawStore } from '../raw-html.js';

/**
 * Schema nodes for the markers `holdRawFragments` leaves behind.
 *
 * `rawBlock`/`rawInline` are atoms: the markup they stand for never enters the
 * schema, so nothing the user types can rewrite it. `rawWrapper` keeps its
 * children editable and only carries the wrapper's own tag and attributes.
 *
 * All three render from the store, which is per editor instance, so each node
 * is configured with one.
 */

interface RawOptions {
  store: RawStore | null;
}

const idAttribute = (attr: string) => ({
  id: {
    default: '',
    parseHTML: (el: HTMLElement) => el.getAttribute(attr) ?? '',
    renderHTML: (attrs: Record<string, unknown>) => ({ [attr]: attrs.id }),
  },
});

function renderPreview(tag: string, id: string, store: RawStore | null) {
  const dom = document.createElement(tag);
  dom.setAttribute('data-pigeon-raw', id);
  dom.contentEditable = 'false';
  const raw = store?.getRaw(id) ?? '';
  if (raw.startsWith('<!--')) {
    // A comment renders to nothing, which would leave an uneditable gap in the
    // canvas. Show a dot instead so the user can see the markup is still there.
    dom.title = raw;
    dom.style.cssText =
      'display: inline-block; width: 6px; height: 6px; border-radius: 50%;' +
      'background: var(--pigeon-border, #cbd5e1); vertical-align: middle;';
  } else {
    dom.innerHTML = sanitizeCanvasHTML(raw);
  }
  return { dom };
}

export const RawBlock = Node.create<RawOptions>({
  name: 'rawBlock',
  group: 'block',
  atom: true,
  selectable: true,
  priority: 1000,

  addOptions() {
    return { store: null };
  },

  addAttributes() {
    return idAttribute('data-pigeon-raw');
  },

  parseHTML() {
    return [{ tag: 'div[data-pigeon-raw]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    const { store } = this.options;
    return ({ node }) => renderPreview('div', node.attrs.id, store);
  },
});

export const RawInline = Node.create<RawOptions>({
  name: 'rawInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  priority: 1000,

  addOptions() {
    return { store: null };
  },

  addAttributes() {
    return idAttribute('data-pigeon-raw');
  },

  parseHTML() {
    return [{ tag: 'span[data-pigeon-raw]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    const { store } = this.options;
    return ({ node }) => renderPreview('span', node.attrs.id, store);
  },
});

export const RawWrapper = Node.create<RawOptions>({
  name: 'rawWrapper',
  group: 'block',
  content: 'block+',
  priority: 1000,

  addOptions() {
    return { store: null };
  },

  addAttributes() {
    return idAttribute('data-pigeon-wrap');
  },

  parseHTML() {
    return [{ tag: 'div[data-pigeon-wrap]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    const { store } = this.options;
    return ({ node }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-pigeon-wrap', node.attrs.id);
      // Carry the wrapper's own style across so the canvas looks the same
      // while editing as it does when the block is idle.
      const style = store?.getWrapper(node.attrs.id)?.attrs.find(([name]) => name === 'style');
      if (style) dom.setAttribute('style', style[1]);
      return { dom, contentDOM: dom };
    };
  },
});
