import type { BlockDefinition, RegisteredBlock } from '@lit-pigeon/core';
import { esc, escAttr } from '../util.js';

interface CountdownValues {
  imageUrl: string;
  alt: string;
  href: string;
  width: number;
  endDateLabel: string;
}

function read(block: RegisteredBlock): CountdownValues {
  const v = block.values as Partial<CountdownValues>;
  return {
    imageUrl: v.imageUrl ?? '',
    alt: v.alt ?? 'Countdown',
    href: v.href ?? '',
    width: typeof v.width === 'number' ? v.width : 480,
    endDateLabel: v.endDateLabel ?? '',
  };
}

/**
 * "Countdown" block. Live CSS countdowns don't render in any major email client,
 * so the canonical pattern is a hosted GIF/PNG generated per-email-open by a
 * service like Sendtric, MotionMail, or NiftyImages. The author pastes the
 * hosted URL; we render it as an `<mj-image>` (with optional link). Falls back
 * to a static text label when no image is supplied.
 */
export const countdownBlock: BlockDefinition = {
  type: 'countdown',
  label: 'Countdown',
  icon: '⏱',
  defaultValues: {
    imageUrl: '',
    alt: 'Sale ends soon',
    href: '',
    width: 480,
    endDateLabel: '',
  } satisfies CountdownValues,
  propertySchema: [
    { key: 'imageUrl', label: 'Countdown image URL', type: 'text', placeholder: 'https://countdownmail.com/…' },
    { key: 'endDateLabel', label: 'Fallback label', type: 'text', placeholder: 'Sale ends Dec 31' },
    { key: 'alt', label: 'Alt text', type: 'text', placeholder: 'Sale ends soon' },
    { key: 'href', label: 'Click-through URL', type: 'text', placeholder: 'https://…' },
    { key: 'width', label: 'Width (px)', type: 'number', min: 100, max: 1200, step: 10 },
  ],
  renderCanvas: (b) => {
    const v = read(b);
    if (v.imageUrl) {
      return `<img src="${escAttr(v.imageUrl)}" alt="${escAttr(v.alt)}" style="display:block;width:100%;max-width:${v.width}px;height:auto;margin:0 auto" />`;
    }
    if (v.endDateLabel) {
      return `<div style="text-align:center;padding:16px;background:#fef3c7;color:#92400e;font-weight:600;border-radius:4px">⏱ ${esc(v.endDateLabel)}</div>`;
    }
    return `<div style="text-align:center;padding:24px;background:#f1f5f9;color:#475569;border-radius:4px">⏱ Paste a hosted countdown image URL or set a fallback label</div>`;
  },
  renderMjml: (b) => {
    const v = read(b);
    if (v.imageUrl) {
      const hrefAttr = v.href ? ` href="${escAttr(v.href)}"` : '';
      const widthAttr = v.width > 0 ? ` width="${v.width}px"` : '';
      return `<mj-image src="${escAttr(v.imageUrl)}" alt="${escAttr(v.alt)}"${hrefAttr}${widthAttr} />`;
    }
    if (v.endDateLabel) {
      return `<mj-text align="center" font-weight="600" color="#92400e">⏱ ${esc(v.endDateLabel)}</mj-text>`;
    }
    return `<!-- countdown block: no imageUrl or endDateLabel set -->`;
  },
};

export type { CountdownValues };
export const __countdown_read = read;
