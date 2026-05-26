import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { html, render } from 'lit';
import type { AssetManagerConfig, PresignedUploadParams } from '@lit-pigeon/core';
import '../src/components/asset-manager/pigeon-asset-manager.js';
import type { PigeonAssetManager } from '../src/components/asset-manager/pigeon-asset-manager.js';

async function mount(
  config: AssetManagerConfig,
  open = true,
): Promise<PigeonAssetManager> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(
    html`<pigeon-asset-manager
      .config=${config}
      ?open=${open}
    ></pigeon-asset-manager>`,
    container,
  );
  const el = container.querySelector('pigeon-asset-manager') as PigeonAssetManager;
  await el.updateComplete;
  return el;
}

function makeFile(name = 'pic.png', type = 'image/png', size = 100): File {
  // happy-dom supports File(blobParts, name, options)
  const bytes = new Uint8Array(size);
  return new File([bytes], name, { type });
}

function triggerFileSelect(el: PigeonAssetManager, file: File) {
  const input = el.shadowRoot!.querySelector('#file-input') as HTMLInputElement;
  // happy-dom lets us assign .files via DataTransfer
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: [file],
  });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function lastSelectedUrl(events: CustomEvent<{ url: string }>[]): string | undefined {
  return events.at(-1)?.detail.url;
}

async function flushMicrotasks() {
  // Let any pending promises resolve.
  await new Promise((r) => setTimeout(r, 0));
}

describe('pigeon-asset-manager', () => {
  let selected: CustomEvent<{ url: string }>[] = [];
  const handler = (e: Event) => {
    selected.push(e as CustomEvent<{ url: string }>);
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    selected = [];
    document.addEventListener('asset-selected', handler);
  });

  afterEach(() => {
    document.removeEventListener('asset-selected', handler);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('URL paste', () => {
    it('emits when "Use URL" is clicked', async () => {
      const el = await mount({});
      const input = el.shadowRoot!.querySelector('input[type=url]') as HTMLInputElement;
      input.value = 'https://cdn.example/x.png';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      const btn = el.shadowRoot!.querySelector('.url-input-group button') as HTMLButtonElement;
      btn.click();
      await flushMicrotasks();

      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/x.png');
      expect(el.open).toBe(false);
    });

    it('emits when Enter is pressed in the URL field', async () => {
      const el = await mount({});
      const input = el.shadowRoot!.querySelector('input[type=url]') as HTMLInputElement;
      input.value = 'https://cdn.example/y.png';
      input.dispatchEvent(new Event('input'));
      await el.updateComplete;

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await flushMicrotasks();

      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/y.png');
    });
  });

  describe('validation', () => {
    it('rejects files over maxFileSize', async () => {
      const el = await mount({ maxFileSize: 50 });
      triggerFileSelect(el, makeFile('big.png', 'image/png', 200));
      await el.updateComplete;
      await flushMicrotasks();

      expect(selected).toHaveLength(0);
      expect(el.shadowRoot!.querySelector('.error')?.textContent).toMatch(/too large/i);
    });

    it('rejects files outside acceptedTypes', async () => {
      const el = await mount({ acceptedTypes: ['image/png'] });
      triggerFileSelect(el, makeFile('bad.gif', 'image/gif', 10));
      await el.updateComplete;
      await flushMicrotasks();

      expect(selected).toHaveLength(0);
      expect(el.shadowRoot!.querySelector('.error')?.textContent).toMatch(/not accepted/i);
    });
  });

  describe('uploadHandler adapter', () => {
    it('emits the URL returned by uploadHandler', async () => {
      const uploadHandler = vi.fn().mockResolvedValue('https://cdn.example/handler.png');
      const el = await mount({ uploadHandler });

      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();

      expect(uploadHandler).toHaveBeenCalledTimes(1);
      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/handler.png');
    });

    it('shows an error when uploadHandler rejects', async () => {
      const uploadHandler = vi.fn().mockRejectedValue(new Error('handler boom'));
      const el = await mount({ uploadHandler });

      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();
      await el.updateComplete;

      expect(selected).toHaveLength(0);
      expect(el.shadowRoot!.querySelector('.error')?.textContent).toMatch(/handler boom/);
    });
  });

  describe('uploadUrl adapter', () => {
    it('emits data.url from a 200 response', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ url: 'https://cdn.example/u.png' }), { status: 200 }),
      );
      const el = await mount({ uploadUrl: 'https://api.example/upload' });

      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example/upload',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/u.png');
    });

    it('falls back to data.src then data.location', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ src: 'https://cdn.example/via-src.png' }), { status: 200 }),
      );
      const el = await mount({ uploadUrl: 'https://api.example/upload' });
      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();
      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/via-src.png');

      vi.restoreAllMocks();
      selected.length = 0;
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ location: 'https://cdn.example/via-loc.png' }), { status: 200 }),
      );
      const el2 = await mount({ uploadUrl: 'https://api.example/upload' });
      triggerFileSelect(el2, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();
      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/via-loc.png');
    });

    it('surfaces a 500 response as an error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('boom', { status: 500, statusText: 'Internal Server Error' }),
      );
      const el = await mount({ uploadUrl: 'https://api.example/upload' });
      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();
      await el.updateComplete;

      expect(selected).toHaveLength(0);
      expect(el.shadowRoot!.querySelector('.error')?.textContent).toMatch(/upload failed/i);
    });
  });

  describe('no adapter (base64 fallback)', () => {
    it('emits a data:image/* URL when no adapter is configured', async () => {
      const el = await mount({});
      triggerFileSelect(el, makeFile('tiny.png', 'image/png', 4));

      // FileReader.onload is async — wait until the event fires.
      await new Promise<void>((resolve) => {
        const stop = setInterval(() => {
          if (selected.length > 0) {
            clearInterval(stop);
            resolve();
          }
        }, 5);
        setTimeout(() => {
          clearInterval(stop);
          resolve();
        }, 500);
      });

      expect(selected).toHaveLength(1);
      expect(selected[0].detail.url.startsWith('data:')).toBe(true);
    });
  });

  describe('presignedUpload adapter (PUT)', () => {
    it('calls getUploadParams + PUTs file body + emits publicUrl on 200', async () => {
      const params: PresignedUploadParams = {
        uploadUrl: 'https://s3.example/signed?sig=abc',
        publicUrl: 'https://cdn.example/p.png',
      };
      const getUploadParams = vi.fn().mockResolvedValue(params);
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('', { status: 200 }));

      const el = await mount({ presignedUpload: { getUploadParams } });
      const file = makeFile('p.png', 'image/png', 8);
      triggerFileSelect(el, file);
      await flushMicrotasks();
      await flushMicrotasks();

      expect(getUploadParams).toHaveBeenCalledWith(file);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://s3.example/signed?sig=abc');
      expect((init as RequestInit).method).toBe('PUT');
      expect((init as RequestInit).body).toBe(file);
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('image/png');

      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/p.png');
    });

    it('does not override a custom Content-Type header', async () => {
      const params: PresignedUploadParams = {
        uploadUrl: 'https://s3.example/signed',
        publicUrl: 'https://cdn.example/q.png',
        headers: { 'Content-Type': 'application/octet-stream' },
      };
      const getUploadParams = vi.fn().mockResolvedValue(params);
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('', { status: 200 }));

      const el = await mount({ presignedUpload: { getUploadParams } });
      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();

      const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/octet-stream');
    });
  });

  describe('presignedUpload adapter (POST)', () => {
    it('sends FormData with fields + file and no explicit Content-Type', async () => {
      const params: PresignedUploadParams = {
        uploadUrl: 'https://s3.example/post',
        publicUrl: 'https://cdn.example/r.png',
        method: 'POST',
        fields: { key: 'uploads/r.png', policy: 'pp' },
      };
      const getUploadParams = vi.fn().mockResolvedValue(params);
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('', { status: 200 }));

      const el = await mount({ presignedUpload: { getUploadParams } });
      const file = makeFile('r.png', 'image/png', 8);
      triggerFileSelect(el, file);
      await flushMicrotasks();
      await flushMicrotasks();

      const init = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('POST');
      const body = init.body as FormData;
      expect(body instanceof FormData).toBe(true);
      expect(body.get('key')).toBe('uploads/r.png');
      expect(body.get('policy')).toBe('pp');
      expect(body.get('file')).toBeInstanceOf(File);

      const headers = (init.headers ?? {}) as Record<string, string>;
      expect(headers['Content-Type']).toBeUndefined();
      expect(lastSelectedUrl(selected)).toBe('https://cdn.example/r.png');
    });
  });

  describe('presignedUpload errors', () => {
    it('surfaces a rejection from getUploadParams as an error', async () => {
      const getUploadParams = vi.fn().mockRejectedValue(new Error('signer down'));
      const el = await mount({ presignedUpload: { getUploadParams } });
      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();
      await el.updateComplete;

      expect(selected).toHaveLength(0);
      expect(el.shadowRoot!.querySelector('.error')?.textContent).toMatch(/signer down/);
    });

    it('surfaces a non-2xx PUT as an error', async () => {
      const params: PresignedUploadParams = {
        uploadUrl: 'https://s3.example/signed',
        publicUrl: 'https://cdn.example/s.png',
      };
      const getUploadParams = vi.fn().mockResolvedValue(params);
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('forbidden', { status: 403, statusText: 'Forbidden' }),
      );

      const el = await mount({ presignedUpload: { getUploadParams } });
      triggerFileSelect(el, makeFile());
      await flushMicrotasks();
      await flushMicrotasks();
      await el.updateComplete;

      expect(selected).toHaveLength(0);
      expect(el.shadowRoot!.querySelector('.error')?.textContent).toMatch(/upload failed/i);
    });
  });

  describe('enabled: false', () => {
    it('renders no modal even when open=true', async () => {
      const el = await mount({ enabled: false }, true);
      expect(el.shadowRoot!.querySelector('.modal')).toBeNull();
    });
  });
});
