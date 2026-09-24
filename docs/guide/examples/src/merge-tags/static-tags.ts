import type { EditorConfig, MergeTag } from '@lit-pigeon/core';

// `name` is inserted verbatim, so include the braces your sending platform expects.
export const contactTags: MergeTag[] = [
  { name: '{{first_name}}', label: 'First name', category: 'Contact', sample: 'Ada' },
  { name: '{{last_name}}', label: 'Last name', category: 'Contact', sample: 'Lovelace' },
  { name: '{{order_number}}', label: 'Order number', category: 'Order', sample: 'A-1042' },
];

export const staticTagsConfig: Partial<EditorConfig> = {
  mergeTags: { tags: contactTags },
};
