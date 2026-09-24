import type { AssetManagerConfig } from '@lit-pigeon/core';

export const stockConfig: AssetManagerConfig = {
  stock: {
    // Both keys are used from the browser and are visible to your users.
    unsplash: { accessKey: 'YOUR_UNSPLASH_ACCESS_KEY' },
    pexels: { apiKey: 'YOUR_PEXELS_API_KEY' },
    // Used as utm_source on Unsplash attribution links; set it to your application's name.
    appName: 'your-app',
  },
};
