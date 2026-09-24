import { describe, it, expect } from 'vitest';
import mjml2html from 'mjml';
import { parseDocument, DomUtils } from 'htmlparser2';
import type { Element, AnyNode } from 'domhandler';
import { documentToMjml } from '@lit-pigeon/renderer-mjml';
import { createRequire } from 'node:module';
import { mjmlToDocument } from '../src/index.js';
import { MJML_DEFAULTS } from '../src/utils/mjml-defaults.js';

// Properties children inherit: the nearest declaration wins.
const INHERITED = ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'text-transform', 'text-decoration'];
// Box properties: every declaration from the root down to the target counts.
const BOX = ['padding', 'background', 'background-color', 'border-radius', 'border-top', 'width', 'height', 'max-width'];

function declarations(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of (el.attribs.style ?? '').split(';')) {
    const i = decl.indexOf(':');
    if (i > 0) out[decl.slice(0, i).trim().toLowerCase()] = decl.slice(i + 1).trim().toLowerCase().replace(/\s+/g, ' ');
  }
  return out;
}

const isZero = (value: string) => /^(0(px|%)?\s*)+$/.test(value);

/** `10px 25px` and `10px 25px 10px 25px` are the same padding. */
function expandBox(value: string): string {
  const [t, r = t, b = t, l = r] = value.split(' ').map((v) => (v === '0' ? '0px' : v));
  return `${t} ${r} ${b} ${l}`;
}

/**
 * The key styles a target element ends up with: inherited properties from
 * the nearest ancestor declaring them, plus every non-zero box declaration
 * on the way down. MJML tables use cellpadding 0, so a zero padding is the
 * same as none.
 */
function keyStyles(html: string, find: (node: AnyNode) => boolean) {
  const target = DomUtils.findOne((n) => find(n), parseDocument(html).children, true);
  if (!target) throw new Error('target not found');
  const chain: Element[] = [];
  for (let n: AnyNode | null = target; n; n = n.parent) {
    if (n.type === 'tag' && (n as Element).name !== 'head') chain.unshift(n as Element);
  }
  const inherited: Record<string, string> = {};
  const box: string[] = [];
  for (const el of chain) {
    const d = declarations(el);
    for (const p of INHERITED) if (d[p]) inherited[p] = d[p];
    for (const p of BOX) {
      if (d[p] && !isZero(d[p])) box.push(`${el.name} ${p}:${p === 'padding' ? expandBox(d[p]) : d[p]}`);
    }
  }
  return { inherited, box };
}

// The mjml-* packages are dependencies of mjml, so resolve them from there.
function mjmlEntry(): string {
  return createRequire(import.meta.url).resolve('mjml');
}

function roundTrip(source: string): string {
  const { document } = mjmlToDocument(source);
  return mjml2html(documentToMjml(document)).html;
}

const hasText = (text: string) => (n: AnyNode) =>
  n.type === 'tag' && (n as Element).children.some((c) => c.type === 'text' && c.data.includes(text));
const hasAttr = (name: string, value: string) => (n: AnyNode) =>
  n.type === 'tag' && (n as Element).attribs[name]?.includes(value);
const hasStyle = (prop: string) => (n: AnyNode) =>
  n.type === 'tag' && prop in declarations(n as Element);

const wrap = (inner: string) =>
  `<mjml><mj-body><mj-section><mj-column>${inner}</mj-column></mj-section></mj-body></mjml>`;

const CASES: Array<[string, string, (n: AnyNode) => boolean]> = [
  ['mj-text', wrap('<mj-text>Plain text</mj-text>'), hasText('Plain text')],
  ['mj-button', wrap('<mj-button href="https://example.com">Press</mj-button>'), hasText('Press')],
  ['mj-image', wrap('<mj-image src="https://example.com/pic.png" />'), hasAttr('src', 'pic.png')],
  ['mj-divider', wrap('<mj-divider />'), hasStyle('border-top')],
  ['mj-spacer', wrap('<mj-spacer />'), hasStyle('height')],
  [
    'mj-social',
    wrap('<mj-social><mj-social-element name="facebook" href="https://facebook.com/x">Fb</mj-social-element></mj-social>'),
    hasAttr('src', 'facebook'),
  ],
  ['mj-social label', wrap('<mj-social><mj-social-element name="facebook" href="https://facebook.com/x">Fb</mj-social-element></mj-social>'), hasText('Fb')],
  ['mj-hero', '<mjml><mj-body><mj-hero><mj-text>Hero copy</mj-text></mj-hero></mj-body></mjml>', hasText('Hero copy')],
  ['mj-navbar', wrap('<mj-navbar><mj-navbar-link href="https://example.com/a">Nav link</mj-navbar-link></mj-navbar>'), hasText('Nav link')],
];

describe('MJML defaults on import', () => {
  it('matches the defaultAttributes of the installed mjml packages', () => {
    const require = createRequire(mjmlEntry());
    const component = (pkg: string, name?: string) => {
      const mod = require(pkg);
      return (name ? mod[name] : mod.default ?? mod) as { defaultAttributes: Record<string, string | null> };
    };
    const sources: Record<string, ReturnType<typeof component>> = {
      'mj-body': component('mjml-body'),
      'mj-section': component('mjml-section'),
      'mj-wrapper': component('mjml-wrapper'),
      'mj-column': component('mjml-column'),
      'mj-text': component('mjml-text'),
      'mj-button': component('mjml-button'),
      'mj-image': component('mjml-image'),
      'mj-divider': component('mjml-divider'),
      'mj-spacer': component('mjml-spacer'),
      'mj-social': component('mjml-social', 'Social'),
      'mj-social-element': component('mjml-social', 'SocialElement'),
      'mj-hero': component('mjml-hero'),
      'mj-navbar': component('mjml-navbar', 'Navbar'),
      'mj-navbar-link': component('mjml-navbar', 'NavbarLink'),
      'mj-table': component('mjml-table'),
    };
    for (const [tag, { defaultAttributes }] of Object.entries(sources)) {
      const expected = Object.fromEntries(Object.entries(defaultAttributes).filter(([, v]) => v !== null));
      expect(MJML_DEFAULTS[tag], tag).toEqual(expected);
    }
  });

  it.each(CASES)('%s with no attributes keeps its computed key styles through a round trip', (_name, source, find) => {
    expect(keyStyles(roundTrip(source), find)).toEqual(keyStyles(mjml2html(source).html, find));
  });

  it('keeps the navbar without a hamburger menu when none was asked for', () => {
    const source = wrap('<mj-navbar><mj-navbar-link href="https://example.com/a">A</mj-navbar-link></mj-navbar>');
    expect(mjmlToDocument(source).document.body.rows[0].columns[0].blocks[0].values).toMatchObject({ hamburger: 'none' });
  });

  it('does not shift a document created in the editor', async () => {
    const { createDefaultDocument, createRow, createColumn, createBlock } = await import('@lit-pigeon/core');
    const doc = createDefaultDocument('Editor');
    doc.body.rows = [
      createRow([
        createColumn([
          createBlock('text', { content: '<p>Editor text</p>' }),
          createBlock('button', { content: '<p>Editor button</p>', href: 'https://example.com' }),
          createBlock('image', { src: 'https://example.com/editor.png', alt: 'e' }),
          createBlock('divider'),
          createBlock('spacer'),
          createBlock('social', { icons: [{ type: 'facebook', href: 'https://facebook.com/e', label: 'EditorFb' }] }),
          createBlock('navbar', { links: [{ href: 'https://example.com/n', text: 'Editor nav' }] }),
        ]),
      ]),
      createRow([createColumn([createBlock('hero', { content: '<p>Editor hero</p>' })])]),
    ];
    const mjml = documentToMjml(doc);
    const original = mjml2html(mjml).html;
    const reparsed = mjml2html(documentToMjml(mjmlToDocument(mjml).document)).html;

    for (const find of [
      hasText('Editor text'),
      hasText('Editor button'),
      hasAttr('src', 'editor.png'),
      hasStyle('border-top'),
      hasText('EditorFb'),
      hasText('Editor nav'),
      hasText('Editor hero'),
    ]) {
      expect(keyStyles(reparsed, find)).toEqual(keyStyles(original, find));
    }
    // Every explicit value the editor wrote comes back unchanged.
    const parsed = mjmlToDocument(mjml).document.body.rows.flatMap((r) => r.columns[0].blocks);
    const created = doc.body.rows.flatMap((r) => r.columns[0].blocks);
    parsed.forEach((block, i) => expect(block.values).toMatchObject(created[i].values));
  });
});
