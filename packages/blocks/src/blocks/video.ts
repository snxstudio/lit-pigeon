import type { BlockDefinition, RegisteredBlock } from '@lit-pigeon/core';
import { escAttr } from '../util.js';

interface VideoValues {
  posterUrl: string;
  videoUrl: string;
  alt: string;
  width: number;
  playButtonColor: string;
}

function read(block: RegisteredBlock): VideoValues {
  const v = block.values as Partial<VideoValues>;
  return {
    posterUrl: v.posterUrl ?? '',
    videoUrl: v.videoUrl ?? '#',
    alt: v.alt ?? 'Watch the video',
    width: typeof v.width === 'number' ? v.width : 560,
    playButtonColor: v.playButtonColor ?? '#ffffff',
  };
}

/**
 * "Video" block. Email clients don't reliably play HTML5 video — the standard
 * pattern is a linked poster image with a play-button overlay. We render the
 * play triangle as a CSS-positioned chip on the canvas; on export, the MJML
 * is a linked `<mj-image>` because cross-client overlay positioning is too
 * unreliable. Authors who want a visible play button in the email should bake
 * one into the poster artwork.
 */
export const videoBlock: BlockDefinition = {
  type: 'video',
  label: 'Video',
  icon: '▶',
  defaultValues: {
    posterUrl: '',
    videoUrl: '#',
    alt: 'Watch the video',
    width: 560,
    playButtonColor: '#ffffff',
  } satisfies VideoValues,
  propertySchema: [
    { key: 'posterUrl', label: 'Poster image URL', type: 'text', placeholder: 'https://…/poster.jpg' },
    { key: 'videoUrl', label: 'Video URL', type: 'text', placeholder: 'https://youtu.be/…' },
    { key: 'alt', label: 'Alt text', type: 'text', placeholder: 'Watch the video' },
    { key: 'width', label: 'Width (px)', type: 'number', min: 100, max: 1200, step: 10 },
    { key: 'playButtonColor', label: 'Play-button color (canvas only)', type: 'color' },
  ],
  renderCanvas: (b) => {
    const v = read(b);
    if (!v.posterUrl) {
      return `<div style="background:#0f172a;color:#e2e8f0;padding:32px;text-align:center;border-radius:6px">
        <div style="font-size:32px;line-height:1">▶</div>
        <div style="margin-top:8px;font-size:13px">Set a poster image to preview the video</div>
      </div>`;
    }
    return `<div style="position:relative;display:inline-block;max-width:100%">
      <img src="${escAttr(v.posterUrl)}" alt="${escAttr(v.alt)}" style="display:block;width:100%;max-width:${v.width}px;height:auto;border-radius:4px" />
      <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,0.55);color:${escAttr(v.playButtonColor)};font-size:28px;line-height:1">▶</span>
      </span>
    </div>`;
  },
  renderMjml: (b) => {
    const v = read(b);
    if (!v.posterUrl) return `<!-- video block: no posterUrl set -->`;
    const widthAttr = v.width > 0 ? ` width="${v.width}px"` : '';
    const hrefAttr = v.videoUrl ? ` href="${escAttr(v.videoUrl)}"` : '';
    return `<mj-image src="${escAttr(v.posterUrl)}" alt="${escAttr(v.alt)}"${hrefAttr}${widthAttr} />`;
  },
};

// Exported for tests + advanced consumers who want type help.
export type { VideoValues };
export const __video_read = read;
