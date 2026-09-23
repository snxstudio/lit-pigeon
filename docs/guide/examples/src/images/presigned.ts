import type { AssetManagerConfig, PresignedUploadParams } from '@lit-pigeon/core';
import type { TokenGetter } from './upload-handler.js';

// #region put
/** Your API signs a PUT URL for the bucket and returns where the file will be served from. */
export function presignedPutConfig(getToken: TokenGetter): AssetManagerConfig {
  return {
    presignedUpload: {
      getUploadParams: async (file): Promise<PresignedUploadParams> => {
        const res = await fetch('/api/email-assets/sign', {
          method: 'POST',
          headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
        });
        if (!res.ok) throw new Error(`Could not sign upload (${res.status})`);
        const { uploadUrl, publicUrl } = (await res.json()) as { uploadUrl: string; publicUrl: string };
        // method defaults to PUT; the editor adds Content-Type: file.type unless you set one.
        return { uploadUrl, publicUrl };
      },
    },
  };
}
// #endregion put

// #region post
/** S3-style presigned POST: the form fields come from your API, the file is appended last. */
export function presignedPostConfig(getToken: TokenGetter): AssetManagerConfig {
  return {
    presignedUpload: {
      getUploadParams: async (file): Promise<PresignedUploadParams> => {
        const res = await fetch('/api/email-assets/sign-post', {
          method: 'POST',
          headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type }),
        });
        if (!res.ok) throw new Error(`Could not sign upload (${res.status})`);
        const { url, fields, publicUrl } = (await res.json()) as {
          url: string;
          fields: Record<string, string>;
          publicUrl: string;
        };
        return { uploadUrl: url, publicUrl, method: 'POST', fields };
      },
    },
  };
}
// #endregion post
