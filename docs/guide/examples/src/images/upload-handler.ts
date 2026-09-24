import type { AssetManagerConfig } from '@lit-pigeon/core';

/** Returns the signed-in user's current access token. */
export type TokenGetter = () => string | Promise<string>;

export function createAssetManagerConfig(getToken: TokenGetter): AssetManagerConfig {
  return {
    acceptedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    maxFileSize: 2 * 1024 * 1024,
    // Called once per file; resolves to the URL stored on the image block.
    uploadHandler: async (file) => {
      const body = new FormData();
      body.append('file', file, file.name);
      const res = await fetch('/api/email-assets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}` },
        body,
      });
      // A thrown Error's message is shown in the upload dialog.
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      const { url } = (await res.json()) as { url: string };
      return url;
    },
  };
}
