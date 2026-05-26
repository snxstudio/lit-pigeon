import { createDefaultDocument } from '@lit-pigeon/core';
import type { PigeonDocument } from '@lit-pigeon/core';
import { frameToRows } from './converters/layout.js';
import { clamp, solidHex } from './utils.js';
import type { FigmaNode, ImportOptions, ImportResult } from './types.js';

export type { FigmaNode, ImportOptions, ImportResult } from './types.js';

/**
 * Convert a Figma frame node (already fetched from the Figma REST API)
 * into a PigeonDocument. The caller is responsible for fetching the
 * frame and (optionally) resolving image refs to public URLs.
 */
export function figmaFrameToDocument(frame: FigmaNode, opts: ImportOptions = {}): ImportResult {
  if (frame.type !== 'FRAME' && frame.type !== 'COMPONENT' && frame.type !== 'INSTANCE') {
    throw new Error(`Expected a FRAME/COMPONENT/INSTANCE root; got ${frame.type}.`);
  }

  const warnings: string[] = [];
  const doc = createDefaultDocument(opts.documentName ?? frame.name);

  // Canvas attributes derived from the frame.
  const frameWidth = Math.round(frame.absoluteBoundingBox?.width ?? 600);
  doc.body.attributes.width = clamp(opts.canvasWidth ?? frameWidth, 300, 800);
  const bg = solidHex(frame.fills) ?? solidHex(frame.background);
  if (bg) doc.body.attributes.backgroundColor = bg;
  if (opts.previewText) doc.metadata.previewText = opts.previewText;

  doc.body.rows = frameToRows(frame, opts, warnings);

  return { document: doc as PigeonDocument, warnings };
}

/**
 * Convenience: fetch a Figma file's JSON via the REST API, locate a frame
 * by id (the `node-id` in a figma.com URL), and convert it.
 *
 * Requires a Figma personal-access token. The image-ref map (`imageUrls`)
 * is fetched in parallel from `GET /images/{file_key}` — set
 * `opts.resolveImages: false` to skip that round-trip.
 */
export interface FetchAndImportOptions extends ImportOptions {
  /** When false, skip the imageRef → URL resolution step. */
  resolveImages?: boolean;
  /** Override the fetch implementation (tests / custom retries). */
  fetchImpl?: typeof fetch;
}

export async function importFromFigma(
  fileKey: string,
  frameId: string,
  accessToken: string,
  opts: FetchAndImportOptions = {},
): Promise<ImportResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const headers = { 'X-Figma-Token': accessToken };

  const nodeRes = await fetchImpl(
    `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(frameId)}`,
    { headers },
  );
  if (!nodeRes.ok) {
    throw new Error(`Figma node fetch failed: ${nodeRes.status} ${nodeRes.statusText}`);
  }
  const body = (await nodeRes.json()) as { nodes: Record<string, { document: FigmaNode } | null> };
  const wrapped = body.nodes[frameId];
  if (!wrapped) throw new Error(`Frame ${frameId} not found in file ${fileKey}.`);
  const frame = wrapped.document;

  let imageUrls = opts.imageUrls;
  if (opts.resolveImages !== false) {
    const imgRes = await fetchImpl(`https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/images`, { headers });
    if (imgRes.ok) {
      const data = (await imgRes.json()) as { meta?: { images?: Record<string, string> } };
      imageUrls = { ...(data.meta?.images ?? {}), ...(imageUrls ?? {}) };
    }
  }

  return figmaFrameToDocument(frame, { ...opts, imageUrls });
}
