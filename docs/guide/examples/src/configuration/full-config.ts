import {
  InMemoryBrandKitStorage,
  InMemoryRowLibraryStorage,
  createDefaultDocument,
  type AssetStorage,
  type EditorConfig,
  type MergeTag,
} from '@lit-pigeon/core';
import { createAssetManagerConfig, type TokenGetter } from '../images/upload-handler.js';

const mergeTags: MergeTag[] = [
  { name: '{{first_name}}', label: 'First name', category: 'Contact', sample: 'Ada' },
  { name: '{{company}}', label: 'Company', category: 'Contact', sample: 'Example Ltd' },
];

export function createEditorConfig(getToken: TokenGetter, assetStorage: AssetStorage): Partial<EditorConfig> {
  return {
    // Used only when no `document` property is set before the editor connects.
    doc: createDefaultDocument('New campaign'),
    plugins: [],
    // #region asset-manager
    assetManager: createAssetManagerConfig(getToken),
    // #endregion asset-manager
    assetStorage,
    mergeTags: { tags: mergeTags },
    brandKit: new InMemoryBrandKitStorage(),
    fontConfig: [
      { name: 'Inter', family: 'Inter, Arial, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700' },
    ],
    rowLibrary: new InMemoryRowLibraryStorage(),
    linkTypes: [{ id: 'preferences', label: 'Email preferences', href: '{{preferences_url}}' }],
    locale: 'fr',
    messages: { fr: { 'toolbar.preview': 'Aperçu', 'toolbar.export': 'Exporter' } },
    dir: 'ltr',
  };
}
