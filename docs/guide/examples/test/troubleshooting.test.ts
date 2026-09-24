// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mjmlToDocument } from '@lit-pigeon/parser-mjml';
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';
import { repairVoidElements } from '../src/troubleshooting/repair-line-breaks.js';

// Saved by @lit-pigeon/parser-mjml 0.1.6 + renderer-mjml 0.2.3 from `One<br/>Two`.
const SAVED_BY_0_1_6 =
  '<mjml><mj-body><mj-section><mj-column><mj-text padding="10px 10px 10px 10px" align="left" line-height="1.5">One<br></br>Two<img src="x.png"></img></mj-text></mj-column></mj-section></mj-body></mjml>';

const breaks = async (mjml: string) => {
  const { html } = await new MjmlRenderer().render(mjmlToDocument(mjml).document);
  return (html.match(/<br/g) ?? []).length;
};

describe('troubleshooting: doubled line breaks', () => {
  it('old saved MJML still renders two breaks with the current parser', async () => {
    expect(await breaks(SAVED_BY_0_1_6)).toBe(2);
  });

  it('repairVoidElements restores a single break', async () => {
    const repaired = repairVoidElements(SAVED_BY_0_1_6);
    expect(repaired).toContain('One<br />Two<img src="x.png" />');
    expect(await breaks(repaired)).toBe(1);
  });
});
