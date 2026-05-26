import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom atom node representing a merge-tag chip (e.g. `{{firstName}}`).
 *
 * Storage shape: a `<span data-merge-tag="name">{{name}}</span>` element.
 * Round-trip pipeline:
 *  - `preprocessForEditor` wraps bare `{{name}}` text in span markers
 *    before TipTap sees the HTML, so parseHTML below matches.
 *  - `sanitizeHTML` (the output side) unwraps those spans back into
 *    plain `{{name}}` text so MJML output stays unchanged.
 */
export const MergeTag = Node.create({
  name: 'mergeTag',

  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      name: {
        default: '',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-merge-tag') ?? '',
        renderHTML: (attrs) => ({ 'data-merge-tag': attrs.name }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-tag]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: 'pigeon-merge-tag' }),
      `{{${node.attrs.name}}}`,
    ];
  },

  renderText({ node }) {
    return `{{${node.attrs.name}}}`;
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.classList.add('pigeon-merge-tag');
      dom.setAttribute('data-merge-tag', node.attrs.name);
      dom.contentEditable = 'false';
      dom.textContent = `{{${node.attrs.name}}}`;
      return { dom };
    };
  },
});
