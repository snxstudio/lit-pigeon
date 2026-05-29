import { describe, it, expect } from 'vitest';
import {
  createBlock,
  createColumn,
  createDefaultDocument,
  createRow,
  getStarterTemplate,
  type PigeonDocument,
} from '@lit-pigeon/core';
import { renderDocument, renderDocumentToMjml, renderTemplate } from '../src/index.js';

function docWithText(content: string): PigeonDocument {
  const doc = createDefaultDocument('Test');
  const block = createBlock('text', { content });
  doc.body.rows.push(createRow([createColumn([block])]));
  return doc;
}

describe('renderDocument', () => {
  it('renders an empty document to HTML + MJML', async () => {
    const doc = createDefaultDocument('Hi');
    const result = await renderDocument(doc);
    expect(result.errors).toEqual([]);
    expect(result.mjml).toContain('<mjml>');
    expect(result.html).toContain('<!doctype html');
  });

  it('substitutes merge-tag values when supplied', async () => {
    const doc = docWithText('<p>Hello {{name}}</p>');
    const result = await renderDocument(doc, { mergeTags: { name: 'Mayur' } });
    expect(result.html).toContain('Hello Mayur');
    expect(result.html).not.toContain('{{name}}');
  });

  it('leaves unknown placeholders intact by default', async () => {
    const doc = docWithText('<p>Hi {{firstName}}, code: {{code}}</p>');
    const result = await renderDocument(doc, { mergeTags: { firstName: 'A' } });
    expect(result.html).toContain('Hi A');
    expect(result.html).toContain('{{code}}');
  });
});

describe('renderDocumentToMjml', () => {
  it('returns MJML markup without compiling to HTML', () => {
    const doc = createDefaultDocument();
    const mjml = renderDocumentToMjml(doc);
    expect(mjml).toContain('<mjml>');
    expect(mjml).toContain('<mj-body');
  });
});

describe('renderTemplate', () => {
  it('renders a starter template end-to-end', async () => {
    const tpl = getStarterTemplate('starter-welcome');
    expect(tpl).toBeDefined();
    const result = await renderTemplate(tpl!);
    expect(result.errors).toEqual([]);
    expect(result.html).toContain('<!doctype html');
  });
});
