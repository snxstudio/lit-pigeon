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

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'Background Color',
  'panel.common.padding': 'Padding',
  'panel.common.outerPadding': 'Outer Padding',
  'panel.common.innerPadding': 'Inner Padding',
  'panel.common.alignment': 'Alignment',
  'panel.common.fontSize': 'Font Size',
  'panel.common.borderRadius': 'Border Radius',
  'panel.common.linkUrl': 'Link URL',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'Content (HTML)',
  'panel.common.insertMergeTag': 'Insert merge tag',
  'panel.common.tagBtn': '{ } Tag',
  'panel.common.uploadImage': 'Upload Image',
  'panel.common.left': 'Left',
  'panel.common.center': 'Center',

  // property panels — body
  'panel.body.title': 'Email Body',
  'panel.body.contentWidth': 'Content Width',
  'panel.body.fontFamily': 'Font Family',
  'panel.body.contentAlignment': 'Content Alignment',
  'panel.body.emailName': 'Email Name',
  'panel.body.previewText': 'Preview Text',
  'panel.body.previewTextPlaceholder': 'Email preview text...',

  // property panels — text
  'panel.text.title': 'Text Properties',
  'panel.text.textAlign': 'Text Align',
  'panel.text.lineHeight': 'Line Height',

  // property panels — button
  'panel.button.title': 'Button Properties',
  'panel.button.buttonText': 'Button Text',
  'panel.button.textColor': 'Text Color',
  'panel.button.fontWeight': 'Font Weight',
  'panel.button.fontWeight.normal': 'Normal (400)',
  'panel.button.fontWeight.medium': 'Medium (500)',
  'panel.button.fontWeight.semibold': 'Semibold (600)',
  'panel.button.fontWeight.bold': 'Bold (700)',
  'panel.button.fullWidth': 'Full Width',

  // property panels — image
  'panel.image.title': 'Image Properties',
  'panel.image.imageUrl': 'Image URL',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Alt Text',
  'panel.image.altPlaceholder': 'Image description',
  'panel.image.width': 'Width (0 = auto)',

  // property panels — hero
  'panel.hero.title': 'Hero Properties',
  'panel.hero.backgroundUrl': 'Background URL',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'Background Position',
  'panel.hero.mode': 'Mode',
  'panel.hero.modeFluidHeight': 'Fluid Height',
  'panel.hero.modeFixedHeight': 'Fixed Height',
  'panel.hero.height': 'Height',
  'panel.hero.width': 'Width',
  'panel.hero.verticalAlign': 'Vertical Align',
  'panel.hero.verticalAlignTop': 'Top',
  'panel.hero.verticalAlignMiddle': 'Middle',
  'panel.hero.verticalAlignBottom': 'Bottom',

  // property panels — navbar
  'panel.navbar.title': 'Navbar Properties',
  'panel.navbar.links': 'Links',
  'panel.navbar.linkLabel': 'Link',
  'panel.navbar.removeLink': 'Remove',
  'panel.navbar.linkText': 'Text',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ Add Link',
  'panel.navbar.hamburger': 'Hamburger (mobile)',
  'panel.navbar.hamburgerShow': 'Show',
  'panel.navbar.hamburgerHide': 'Hide',
  'panel.navbar.linkColor': 'Link Color',
  'panel.navbar.linkFontSize': 'Link Font Size',
  'panel.navbar.linkPadding': 'Link Padding',

  // property panels — divider
  'panel.divider.title': 'Divider Properties',
  'panel.divider.style': 'Style',
  'panel.divider.styleSolid': 'Solid',
  'panel.divider.styleDashed': 'Dashed',
  'panel.divider.styleDotted': 'Dotted',
  'panel.divider.color': 'Color',
  'panel.divider.width': 'Width',
  'panel.divider.lineWidth': 'Line Width',

  // property panels — spacer
  'panel.spacer.title': 'Spacer Properties',
  'panel.spacer.height': 'Height',

  // property panels — social
  'panel.social.title': 'Social Properties',
  'panel.social.icons': 'Icons',
  'panel.social.iconLabel': 'Icon',
  'panel.social.removeIcon': 'Remove',
  'panel.social.network': 'Network',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'Icon URL',
  'panel.social.altText': 'Label (alt text)',
  'panel.social.addIcon': '+ Add Icon',
  'panel.social.iconSize': 'Icon Size',
  'panel.social.spacing': 'Spacing',

  // property panels — html
  'panel.html.title': 'HTML Properties',
  'panel.html.rawHtml': 'Raw HTML',

  // property panels — row
  'panel.row.title': 'Row Properties',
  'panel.row.columnLayout': 'Column Layout',
  'panel.row.layout1col': '1 Column',
  'panel.row.layout2col': '2 Equal',
  'panel.row.layout3col': '3 Equal',
  'panel.row.layout4col': '4 Equal',
  'panel.row.backgroundImageUrl': 'Background Image URL',
  'panel.row.fullWidth': 'Full Width',
  'panel.row.displayCondition': 'Display condition',

  // controls — color picker
  'control.color.label': 'Color',

  // controls — font picker
  'control.fontPicker.label': 'Font Family',

  // controls — link type picker
  'control.linkType.ariaLabel': 'Insert a special link',
  'control.linkType.placeholder': '+ Special link',
  'control.linkType.emailPrompt': 'Email address',
  'control.linkType.telPrompt': 'Phone number',

  // controls — spacing input
  'control.spacing.top': 'Top',
  'control.spacing.right': 'Right',
  'control.spacing.bottom': 'Bottom',
  'control.spacing.left': 'Left',
  'control.spacing.topTitle': 'Top (px)',
  'control.spacing.rightTitle': 'Right (px)',
  'control.spacing.bottomTitle': 'Bottom (px)',
  'control.spacing.leftTitle': 'Left (px)',

  // controls — alignment picker
  'control.alignment.left': 'Align left',
  'control.alignment.center': 'Align center',
  'control.alignment.right': 'Align right',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'Search tags...',
  'control.mergeTag.noMatches': 'No matching tags',

  // rich text bubble toolbar
  'richtext.bold': 'Bold (Cmd+B)',
  'richtext.italic': 'Italic (Cmd+I)',
  'richtext.underline': 'Underline (Cmd+U)',
  'richtext.strike': 'Strike',
  'richtext.code': 'Code',
  'richtext.link': 'Link',
  'richtext.apply': 'Apply',
  'richtext.removeLink': 'Remove link',
  'richtext.urlPlaceholder': 'https://…',
};
