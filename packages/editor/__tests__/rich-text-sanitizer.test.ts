import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '../src/rich-text/serialization.js';

describe('sanitizeHTML', () => {
  it('strips <script> tags but keeps their text', () => {
    expect(sanitizeHTML('<p>safe<script>alert(1)</script></p>')).toBe('<p>safealert(1)</p>');
  });

  it('strips disallowed style tags', () => {
    const out = sanitizeHTML('<style>p { color: red }</style><p>hi</p>');
    expect(out).not.toContain('<style');
    expect(out).toContain('<p>hi</p>');
  });

  it('drops javascript: hrefs but keeps the link text', () => {
    const out = sanitizeHTML('<p><a href="javascript:alert(1)">click</a></p>');
    expect(out).toContain('click');
    expect(out).not.toContain('javascript');
    expect(out).not.toContain('<a');
  });

  it('keeps safe http/https/mailto hrefs', () => {
    const out = sanitizeHTML('<p><a href="https://x" target="_blank" rel="noopener">x</a></p>');
    expect(out).toContain('<a href="https://x"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener"');
  });

  it('preserves allowed span style declarations (color, font-family, font-size)', () => {
    const out = sanitizeHTML('<p><span style="color: red; font-size: 14px;">red</span></p>');
    expect(out).toContain('color: red');
    expect(out).toContain('font-size: 14px');
  });

  it('drops disallowed style declarations (background, position, etc.)', () => {
    const out = sanitizeHTML('<p><span style="background: url(x.png); position: fixed;">x</span></p>');
    expect(out).not.toContain('background');
    expect(out).not.toContain('position');
    expect(out).not.toContain('url(');
  });

  it('strips on* event handlers from any element', () => {
    const out = sanitizeHTML('<p onmouseover="alert(1)">hi</p>');
    expect(out).toBe('<p>hi</p>');
  });

  it('keeps headings, lists, blockquote, formatting marks', () => {
    const input = '<h2>Title</h2><ul><li><strong>one</strong></li></ul><blockquote><em>q</em></blockquote>';
    expect(sanitizeHTML(input)).toBe(input);
  });

  it('strips unknown tags like <iframe> but keeps their text', () => {
    expect(sanitizeHTML('<p><iframe src="x">hi</iframe></p>')).toBe('<p>hi</p>');
  });

  it('keeps tel: hrefs', () => {
    const out = sanitizeHTML('<p><a href="tel:+15551234567">call</a></p>');
    expect(out).toContain('href="tel:+15551234567"');
  });

  it('keeps {{…}} template hrefs (system/custom links)', () => {
    const out = sanitizeHTML('<p><a href="{{unsubscribe_url}}">unsub</a></p>');
    expect(out).toContain('href="{{unsubscribe_url}}"');
  });

  it('still drops javascript: hrefs', () => {
    const out = sanitizeHTML('<p><a href="javascript:alert(1)">x</a></p>');
    expect(out).not.toContain('javascript');
    expect(out).not.toContain('<a');
  });

  it('still drops data: hrefs', () => {
    const out = sanitizeHTML('<p><a href="data:text/html,evil">x</a></p>');
    expect(out).not.toContain('<a');
  });
});
