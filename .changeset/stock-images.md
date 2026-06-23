---
"@lit-pigeon/editor": minor
"@lit-pigeon/core": minor
---

Stock image integration in the asset manager. A new **Stock** tab searches Unsplash and Pexels directly (the host supplies API keys via `AssetManagerConfig.stock`) and inserts a photo by its hotlinked URL, with in-picker photographer/provider attribution and the required Unsplash download-ping. The stock UI and provider code are lazy-loaded, so they add nothing to the core editor bundle.
