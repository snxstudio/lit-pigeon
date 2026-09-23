import type { HeroBlock } from '@lit-pigeon/core';
import { generateId } from '@lit-pigeon/core';
import { parseSpacing } from '../../utils/parse-spacing.js';
import { getAttr, getNumericAttr } from '../../utils/parse-attributes.js';

export function parseHeroBlock(
  attrs: Record<string, string>,
  innerContent: string,
  innerPadding?: string,
): HeroBlock {
  return {
    id: generateId(),
    type: 'hero',
    values: {
      backgroundUrl: getAttr(attrs, 'background-url'),
      backgroundPosition: (getAttr(attrs, 'background-position', 'center center') as HeroBlock['values']['backgroundPosition']),
      mode: (getAttr(attrs, 'mode', 'fluid-height') as 'fixed-height' | 'fluid-height'),
      width: getNumericAttr(attrs, 'width', 600),
      height: getNumericAttr(attrs, 'height', 400),
      verticalAlign: (getAttr(attrs, 'vertical-align', 'middle') as 'top' | 'middle' | 'bottom'),
      padding: parseSpacing(getAttr(attrs, 'padding'), 0),
      innerPadding: parseSpacing(innerPadding, 20),
      backgroundColor: getAttr(attrs, 'background-color', '#ffffff'),
      content: innerContent,
    },
  };
}

// The div styles mj-text renders, in MJML's order. Colour, font size and font
// family are already in the content as a span (inline-text-style.ts).
const TEXT_STYLES: Array<[string, string]> = [
  ['font-style', 'font-style'],
  ['font-weight', 'font-weight'],
  ['letter-spacing', 'letter-spacing'],
  ['line-height', 'line-height'],
  ['text-align', 'align'],
  ['text-decoration', 'text-decoration'],
  ['text-transform', 'text-transform'],
  ['height', 'height'],
];

// The line height the renderer's mj-text gets anyway (its <mj-attributes>)
const RENDERER_TEXT_LINE_HEIGHT = '1.5';

/**
 * An mj-text inside mj-hero, as a div carrying the styling set on it. A lone
 * mj-text is the shape the renderer writes: its padding is the hero's inner
 * padding and it only needs a div for other styling.
 */
export function heroTextHtml(attrs: Record<string, string>, innerHtml: string, lone: boolean): string {
  const style = TEXT_STYLES
    .filter(([prop, attr]) => attrs[attr] && !(prop === 'line-height' && attrs[attr] === RENDERER_TEXT_LINE_HEIGHT))
    .concat(!lone && attrs.padding ? [['padding', 'padding']] : [])
    .map(([prop, attr]) => `${prop}:${attrs[attr]};`)
    .join('');
  if (style) return `<div style="${escapeAttr(style)}">${innerHtml}</div>`;
  return lone ? innerHtml : `<div>${innerHtml}</div>`;
}

// mj-button's defaultAttributes in MJML 4
const BUTTON_DEFAULTS: Record<string, string> = {
  align: 'center',
  'background-color': '#414141',
  border: 'none',
  'border-radius': '3px',
  color: '#ffffff',
  'font-family': 'Ubuntu, Helvetica, Arial, sans-serif',
  'font-size': '13px',
  'font-weight': 'normal',
  'inner-padding': '10px 25px',
  'line-height': '120%',
  padding: '10px 25px',
  target: '_blank',
  'text-decoration': 'none',
  'text-transform': 'none',
  'vertical-align': 'middle',
};

/**
 * An mj-button inside mj-hero, as the table MJML renders for it, including
 * the aligned, padded cell mj-hero puts it in.
 */
export function heroButtonHtml(attrs: Record<string, string>, label: string): string {
  const a = { ...BUTTON_DEFAULTS, ...attrs };
  const bg = a['background-color'];
  const tdStyle = `border:${a.border};border-radius:${a['border-radius']};cursor:auto;` +
    `mso-padding-alt:${a['inner-padding']};background:${bg};`;
  const linkStyle = `display:inline-block;background:${bg};color:${a.color};font-family:${a['font-family']};` +
    `font-size:${a['font-size']};font-weight:${a['font-weight']};line-height:${a['line-height']};margin:0;` +
    `text-decoration:${a['text-decoration']};text-transform:${a['text-transform']};` +
    `padding:${a['inner-padding']};mso-padding-alt:0px;border-radius:${a['border-radius']};`;
  const link = a.href
    ? `<a href="${escapeAttr(a.href)}" target="${escapeAttr(a.target)}" style="${escapeAttr(linkStyle)}">${label.trim()}</a>`
    : `<p style="${escapeAttr(linkStyle)}">${label.trim()}</p>`;

  return '<table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>' +
    `<td align="${escapeAttr(a.align)}" style="padding:${escapeAttr(a.padding)};">` +
    '<table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;"><tr>' +
    `<td align="center"${bg === 'none' ? '' : ` bgcolor="${escapeAttr(bg)}"`} role="presentation" ` +
    `valign="${escapeAttr(a['vertical-align'])}" style="${escapeAttr(tdStyle)}">${link}` +
    '</td></tr></table></td></tr></table>';
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
