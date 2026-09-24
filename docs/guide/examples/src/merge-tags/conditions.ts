import { createBlock, createColumn, createDefaultDocument, createRow, type TextBlock } from '@lit-pigeon/core';
import { renderDocument } from '@lit-pigeon/ssr';
import Handlebars from 'handlebars';

// #region condition
const offer = createBlock('text') as TextBlock;
offer.values.content = '<p>Your members-only offer, {{first_name}}.</p>';
const row = createRow([createColumn([offer])]);
// Only rows can carry a condition. It is written out verbatim as {{#if …}}.
row.attributes.condition = 'is_member';

const document = createDefaultDocument('Offer');
document.body.rows.push(row);
// #endregion condition

// #region send
/** Compiles the email once, then evaluates merge tags and conditions per recipient. */
export async function compileForSending() {
  // No mergeTags here: every {{…}} is left in place for the template engine.
  const { html, errors } = await renderDocument(document);
  if (errors.length) throw new Error(errors.map((e) => e.message).join('; '));
  return Handlebars.compile(html);
}
// #endregion send
