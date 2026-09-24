import { validateDocument, type PigeonDocument } from '@lit-pigeon/core';

const MAX_BYTES = 1024 * 1024;
const SAFE_HREF = /^(https?:|mailto:|tel:|#|\{\{[\w.]+\}\}$)/i;
const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i;
const UNSAFE_HTML = /<\s*(script|iframe|object|embed|form|base|meta)\b|\son\w+\s*=|javascript:/i;
const HTML_FIELDS = ['content'];
const URL_FIELDS = ['href', 'src', 'backgroundUrl', 'backgroundImage'];
const COLOUR_FIELDS = ['backgroundColor', 'textColor', 'borderColor', 'linkColor'];

/**
 * Server-side policy check for documents received from the browser. It rejects
 * rather than repairs; pair it with a proper HTML sanitiser if you need to
 * accept arbitrary HTML blocks.
 */
export function checkDocument(input: unknown): { document?: PigeonDocument; problems: string[] } {
  if (JSON.stringify(input).length > MAX_BYTES) return { problems: ['document too large'] };
  const problems = validateDocument(input).map((e) => `${e.path}: ${e.message}`);
  if (problems.length > 0) return { problems };
  const document = input as PigeonDocument;

  const inspect = (path: string, values: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== 'string' || value === '') continue;
      if (HTML_FIELDS.includes(key) && UNSAFE_HTML.test(value)) problems.push(`${path}.${key}: unsafe HTML`);
      if (URL_FIELDS.includes(key) && !SAFE_HREF.test(value.trim())) problems.push(`${path}.${key}: unsafe URL`);
      if (COLOUR_FIELDS.includes(key) && !COLOUR.test(value.trim())) problems.push(`${path}.${key}: invalid colour`);
    }
  };

  inspect('body.attributes', document.body.attributes);
  document.body.rows.forEach((row, r) => {
    inspect(`body.rows[${r}].attributes`, row.attributes);
    if (row.attributes.condition && !/^[\w.! ]+$/.test(row.attributes.condition)) {
      problems.push(`body.rows[${r}].attributes.condition: unexpected characters`);
    }
    row.columns.forEach((column, c) => {
      inspect(`body.rows[${r}].columns[${c}].attributes`, column.attributes);
      column.blocks.forEach((block, b) => inspect(`body.rows[${r}].columns[${c}].blocks[${b}].values`, block.values));
    });
  });
  return { document: problems.length ? undefined : document, problems };
}
