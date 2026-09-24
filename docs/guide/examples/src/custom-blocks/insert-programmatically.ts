import { createBlock, createColumn, createDefaultDocument, createRow, type ContentBlock } from '@lit-pigeon/core';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import './register.js';

// createBlock accepts any registered type and fills in its defaultValues.
const callout = createBlock('callout', { title: 'Delivery update' });

const document = createDefaultDocument('Shipping notice');
// ColumnNode.blocks is typed as the built-in union, so custom blocks need a cast.
document.body.rows.push(createRow([createColumn([callout as ContentBlock])]));

export const mjml = documentToMjml(document);
