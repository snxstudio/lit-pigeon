/**
 * Built-in English catalog — the source of truth for every editor chrome
 * string and the fallback for any locale. Keys are dotted and grouped by area.
 * Extraction tasks append their area's keys here; each value equals the
 * string the component previously hardcoded.
 */
export const EN_MESSAGES: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Undo',
  'toolbar.redo': 'Redo',
  'toolbar.preview-device': 'Preview device',
  'toolbar.desktop-view': 'Desktop view',
  'toolbar.tablet-view-title': 'Tablet view (768px)',
  'toolbar.tablet-view': 'Tablet view',
  'toolbar.mobile-view-title': 'Mobile view (375px)',
  'toolbar.mobile-view': 'Mobile view',
  'toolbar.fullscreen': 'Fullscreen',
  'toolbar.exit-fullscreen': 'Exit fullscreen',
  'toolbar.enter-fullscreen': 'Enter fullscreen',
  'toolbar.templates': 'Templates',
  'toolbar.preview': 'Preview',
  'toolbar.export': 'Export',
  'toolbar.export-format': 'Export format',
  'toolbar.export-html': 'Export HTML',
  'toolbar.export-mjml': 'Export MJML',
  'toolbar.export-json': 'Export JSON',

  // palette
  'palette.label': 'Palette',
  'palette.tab.content': 'Content',
  'palette.tab.layers': 'Layers',
  'palette.tab.brand': 'Brand',
  'palette.tab.saved': 'Saved',

  // palette — layout section
  'palette.layout.section-content': 'Content',
  'palette.layout.section-layout': 'Layout',
  'palette.layout.1-col': '1 Column',
  'palette.layout.2-col': '2 Columns',
  'palette.layout.3-col': '3 Columns',
  'palette.layout.4-col': '4 Columns',

  // palette — brand tab
  'palette.brand.colors': 'Colors',
  'palette.brand.fonts': 'Fonts',
  'palette.brand.logos': 'Logos',
  'palette.brand.add': '+ Add',
  'palette.brand.no-colors': 'No colors yet',
  'palette.brand.no-fonts': 'No fonts yet',
  'palette.brand.no-logos': 'No logos yet',
  'palette.brand.color-name-label': 'Color name',
  'palette.brand.color-value-label': 'Color value',
  'palette.brand.delete-title': 'Delete',
  'palette.brand.insert-logo-title': 'Insert logo',

  // palette — saved tab
  'palette.saved.empty': 'No saved rows yet. Use the bookmark action on a row to save it here.',
  'palette.saved.delete-title': 'Delete',

  // preview
  'preview.heading': 'Preview',
  'preview.tab-group-label': 'Preview format',
  'preview.tab.preview': 'Preview',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'Desktop preview',
  'preview.device.mobile': 'Mobile preview',
  'preview.close': 'Close preview',
  'preview.loading': 'Rendering...',

  // template picker
  'template.heading': 'Templates',
  'template.close': 'Close',
  'template.section.choose': 'Choose a template',
  'template.empty': 'No templates available yet.',
  'template.section.save': 'Save current as template',
  'template.field.name': 'Name',
  'template.field.name-placeholder': 'My template',
  'template.field.category': 'Category',
  'template.field.description': 'Description (optional)',
  'template.field.description-placeholder': 'What is this template for?',
  'template.cancel': 'Cancel',
  'template.save': 'Save template',
  'template.error.name-required': 'Name is required',

  // asset manager
  'asset.title': 'Select asset',
  'asset.title-upload': 'Select image',
  'asset.close': 'Close',
  'asset.tab.library': 'Library',
  'asset.tab.upload': 'Upload',
  'asset.folder.all': 'All folders',
  'asset.search': 'Search assets',
  'asset.tag-filter-label': 'Filter by tag',
  'asset.loading': 'Loading…',
  'asset.empty.filtered': 'No assets match your filters.',
  'asset.empty.no-assets': 'No saved assets yet. Upload one to get started.',
  'asset.drop-zone.label': 'Drag & drop an image here',
  'asset.drop-zone.hint': 'or click to browse',
  'asset.url.separator': 'or enter URL',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'Use URL',
};
