import type { BlockDefinition, RegisteredBlock } from '@lit-pigeon/core';
import { escAttr, splitRows } from '../util.js';

interface CarouselItem {
  src: string;
  alt: string;
  href: string;
}

interface CarouselValues {
  images: string;
  borderRadius: number;
  thumbnails: 'visible' | 'hidden';
  width: number;
}

/**
 * Parse one image per line. Pipe-separated suffixes optionally add `alt` and
 * `href`: `https://…/img.jpg | Alt text | https://link.example`.
 */
function parseItems(raw: string): CarouselItem[] {
  return splitRows(raw).map((line) => {
    const [src = '', alt = '', href = ''] = line.split('|').map((part) => part.trim());
    return { src, alt, href };
  });
}

function read(block: RegisteredBlock): CarouselValues {
  const v = block.values as Partial<CarouselValues>;
  return {
    images: v.images ?? '',
    borderRadius: typeof v.borderRadius === 'number' ? v.borderRadius : 0,
    thumbnails: v.thumbnails === 'hidden' ? 'hidden' : 'visible',
    width: typeof v.width === 'number' ? v.width : 600,
  };
}

/**
 * "Carousel" block. Wraps `<mj-carousel>` — animated in supporting clients
 * (Apple Mail, Outlook 2019+ macOS), gracefully stacks images in everything
 * else, so it's safe to deploy without worrying about Gmail/Outlook breakage.
 * The canvas preview shows the first image with a "1/N" badge so authors can
 * see what's loaded at a glance.
 */
export const carouselBlock: BlockDefinition = {
  type: 'carousel',
  label: 'Carousel',
  icon: '◧',
  defaultValues: {
    images: '',
    borderRadius: 0,
    thumbnails: 'visible',
    width: 600,
  } satisfies CarouselValues,
  propertySchema: [
    {
      key: 'images',
      label: 'Images (one per line: `src | alt | href`)',
      type: 'textarea',
      placeholder: 'https://example.com/1.jpg | First slide | https://shop.example\nhttps://example.com/2.jpg',
    },
    { key: 'width', label: 'Width (px)', type: 'number', min: 100, max: 1200, step: 10 },
    { key: 'borderRadius', label: 'Image radius (px)', type: 'number', min: 0, max: 32 },
    {
      key: 'thumbnails',
      label: 'Thumbnails',
      type: 'select',
      options: [
        { label: 'Visible', value: 'visible' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
  ],
  renderCanvas: (b) => {
    const v = read(b);
    const items = parseItems(v.images);
    if (items.length === 0) {
      return `<div style="padding:24px;background:#f1f5f9;color:#475569;border-radius:4px;text-align:center">Add one image URL per line to populate the carousel</div>`;
    }
    const first = items[0];
    const radius = v.borderRadius > 0 ? `border-radius:${v.borderRadius}px;` : '';
    return `<div style="position:relative;display:inline-block;max-width:100%">
      <img src="${escAttr(first.src)}" alt="${escAttr(first.alt)}" style="display:block;width:100%;max-width:${v.width}px;height:auto;${radius}" />
      <span style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.7);color:#fff;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">1/${items.length}</span>
    </div>`;
  },
  renderMjml: (b) => {
    const v = read(b);
    const items = parseItems(v.images);
    if (items.length === 0) return `<!-- carousel block: no images -->`;
    const radiusAttr = v.borderRadius > 0 ? ` border-radius="${v.borderRadius}px"` : '';
    const thumbnailsAttr = v.thumbnails === 'hidden' ? ' thumbnails="hidden"' : '';
    const inner = items
      .map((item) => {
        const altAttr = item.alt ? ` alt="${escAttr(item.alt)}"` : '';
        const hrefAttr = item.href ? ` href="${escAttr(item.href)}"` : '';
        return `<mj-carousel-image src="${escAttr(item.src)}"${altAttr}${hrefAttr} />`;
      })
      .join('');
    return `<mj-carousel${thumbnailsAttr}${radiusAttr}>${inner}</mj-carousel>`;
  },
};

export type { CarouselValues, CarouselItem };
export const __carousel_parse = parseItems;
export const __carousel_read = read;
