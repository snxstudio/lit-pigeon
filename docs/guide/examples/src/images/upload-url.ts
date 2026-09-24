import type { AssetManagerConfig } from '@lit-pigeon/core';

// The editor POSTs multipart/form-data with the file in the "file" field and
// reads `url`, `src` or `location` from the JSON response.
export function uploadUrlConfig(token: string): AssetManagerConfig {
  return {
    uploadUrl: '/api/email-assets',
    // Fixed at the time the config is built. Rebuild the config when the token changes.
    uploadHeaders: { Authorization: `Bearer ${token}` },
  };
}
