import { describe, it, expect } from 'vitest';
import { mjmlToDocument } from '../src/index.js';

function parseLinks(navbar: string) {
  const { document } = mjmlToDocument(
    `<mjml><mj-body><mj-section><mj-column>${navbar}</mj-column></mj-section></mj-body></mjml>`,
  );
  const block = document.body.rows[0].columns[0].blocks[0];
  if (block.type !== 'navbar') throw new Error(`expected a navbar block, got ${block.type}`);
  return block.values.links.map((l) => l.href);
}

describe('mj-navbar base-url', () => {
  it('prefixes each link href with base-url, as MJML does', () => {
    expect(
      parseLinks(`<mj-navbar base-url="https://shipthis.co">
        <mj-navbar-link href="/tracking">Tracking</mj-navbar-link>
        <mj-navbar-link href="/pricing">Pricing</mj-navbar-link>
      </mj-navbar>`),
    ).toEqual(['https://shipthis.co/tracking', 'https://shipthis.co/pricing']);
  });

  it('leaves hrefs alone without base-url', () => {
    expect(parseLinks('<mj-navbar><mj-navbar-link href="/home">Home</mj-navbar-link></mj-navbar>')).toEqual(['/home']);
  });
});
