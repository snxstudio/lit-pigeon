/**
 * German UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Rückgängig',
  'toolbar.redo': 'Wiederholen',
  'toolbar.preview-device': 'Vorschaugerät',
  'toolbar.desktop-view': 'Desktop-Ansicht',
  'toolbar.tablet-view-title': 'Tablet-Ansicht (768px)',
  'toolbar.tablet-view': 'Tablet-Ansicht',
  'toolbar.mobile-view-title': 'Mobile Ansicht (375px)',
  'toolbar.mobile-view': 'Mobile Ansicht',
  'toolbar.fullscreen': 'Vollbild',
  'toolbar.exit-fullscreen': 'Vollbild beenden',
  'toolbar.enter-fullscreen': 'Vollbild aktivieren',
  'toolbar.templates': 'Vorlagen',
  'toolbar.preview': 'Vorschau',
  'toolbar.export': 'Exportieren',
  'toolbar.export-format': 'Exportformat',
  'toolbar.export-html': 'HTML exportieren',
  'toolbar.export-mjml': 'MJML exportieren',
  'toolbar.export-json': 'JSON exportieren',

  // palette
  'palette.label': 'Palette',
  'palette.tab.content': 'Inhalt',
  'palette.tab.layers': 'Ebenen',
  'palette.tab.brand': 'Marke',
  'palette.tab.saved': 'Gespeichert',

  // palette — layout section
  'palette.layout.section-content': 'Inhalt',
  'palette.layout.section-layout': 'Layout',
  'palette.layout.1-col': '1 Spalte',
  'palette.layout.2-col': '2 Spalten',
  'palette.layout.3-col': '3 Spalten',
  'palette.layout.4-col': '4 Spalten',

  // palette — brand tab
  'palette.brand.colors': 'Farben',
  'palette.brand.fonts': 'Schriftarten',
  'palette.brand.logos': 'Logos',
  'palette.brand.add': '+ Hinzufügen',
  'palette.brand.no-colors': 'Noch keine Farben',
  'palette.brand.no-fonts': 'Noch keine Schriftarten',
  'palette.brand.no-logos': 'Noch keine Logos',
  'palette.brand.color-name-label': 'Farbname',
  'palette.brand.color-value-label': 'Farbwert',
  'palette.brand.delete-title': 'Löschen',
  'palette.brand.insert-logo-title': 'Logo einfügen',

  // palette — saved tab
  'palette.saved.empty': 'Noch keine gespeicherten Zeilen. Verwenden Sie die Lesezeichen-Aktion einer Zeile, um sie hier zu speichern.',
  'palette.saved.delete-title': 'Löschen',

  // preview
  'preview.heading': 'Vorschau',
  'preview.tab-group-label': 'Vorschauformat',
  'preview.tab.preview': 'Vorschau',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'Desktop-Vorschau',
  'preview.device.mobile': 'Mobile Vorschau',
  'preview.close': 'Vorschau schließen',
  'preview.loading': 'Wird gerendert...',

  // template picker
  'template.heading': 'Vorlagen',
  'template.close': 'Schließen',
  'template.section.choose': 'Vorlage auswählen',
  'template.empty': 'Noch keine Vorlagen verfügbar.',
  'template.section.save': 'Aktuellen Entwurf als Vorlage speichern',
  'template.field.name': 'Name',
  'template.field.name-placeholder': 'Meine Vorlage',
  'template.field.category': 'Kategorie',
  'template.field.description': 'Beschreibung (optional)',
  'template.field.description-placeholder': 'Wofür ist diese Vorlage gedacht?',
  'template.cancel': 'Abbrechen',
  'template.save': 'Vorlage speichern',
  'template.error.name-required': 'Name ist erforderlich',

  // asset manager
  'asset.title': 'Asset auswählen',
  'asset.title-upload': 'Bild auswählen',
  'asset.close': 'Schließen',
  'asset.tab.library': 'Bibliothek',
  'asset.tab.upload': 'Hochladen',
  'asset.folder.all': 'Alle Ordner',
  'asset.search': 'Assets durchsuchen',
  'asset.tag-filter-label': 'Nach Tag filtern',
  'asset.loading': 'Wird geladen…',
  'asset.empty.filtered': 'Keine Assets entsprechen Ihren Filtern.',
  'asset.empty.no-assets': 'Noch keine gespeicherten Assets. Laden Sie eines hoch, um zu beginnen.',
  'asset.drop-zone.label': 'Bild hierher ziehen und ablegen',
  'asset.drop-zone.hint': 'oder klicken, um zu durchsuchen',
  'asset.url.separator': 'oder URL eingeben',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'URL verwenden',

  // asset manager — stock tab
  'asset.tab.stock': 'Stock',
  'asset.stock.search': 'Kostenlose Fotos suchen…',
  'asset.stock.idle': 'Durchsuchen Sie Unsplash und Pexels nach kostenlosen Fotos.',
  'asset.stock.empty': 'Keine Fotos gefunden. Versuchen Sie eine andere Suche.',
  'asset.stock.load-more': 'Mehr laden',
  'asset.stock.photo-by': 'Foto von',
  'asset.stock.on': 'auf',
  'asset.stock.error': 'Fotos konnten nicht geladen werden. Prüfen Sie den API-Schlüssel oder versuchen Sie es erneut.',
  'asset.stock.rate-limited': 'Anfragelimit erreicht. Versuchen Sie es in Kürze erneut.',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'Hintergrundfarbe',
  'panel.common.padding': 'Innenabstand',
  'panel.common.outerPadding': 'Äußerer Abstand',
  'panel.common.innerPadding': 'Innerer Abstand',
  'panel.common.alignment': 'Ausrichtung',
  'panel.common.fontSize': 'Schriftgröße',
  'panel.common.borderRadius': 'Eckenradius',
  'panel.common.linkUrl': 'Link-URL',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'Inhalt (HTML)',
  'panel.common.insertMergeTag': 'Platzhalter einfügen',
  'panel.common.tagBtn': '{ } Tag',
  'panel.common.uploadImage': 'Bild hochladen',
  'panel.common.left': 'Links',
  'panel.common.center': 'Zentriert',

  // property panels — body
  'panel.body.title': 'E-Mail-Body',
  'panel.body.contentWidth': 'Inhaltsbreite',
  'panel.body.fontFamily': 'Schriftart',
  'panel.body.contentAlignment': 'Inhaltsausrichtung',
  'panel.body.emailName': 'E-Mail-Name',
  'panel.body.previewText': 'Vorschautext',
  'panel.body.previewTextPlaceholder': 'Vorschautext der E-Mail...',

  // property panels — text
  'panel.text.title': 'Texteigenschaften',
  'panel.text.textAlign': 'Textausrichtung',
  'panel.text.lineHeight': 'Zeilenhöhe',

  // property panels — button
  'panel.button.title': 'Button-Eigenschaften',
  'panel.button.buttonText': 'Button-Text',
  'panel.button.textColor': 'Textfarbe',
  'panel.button.fontWeight': 'Schriftstärke',
  'panel.button.fontWeight.normal': 'Normal (400)',
  'panel.button.fontWeight.medium': 'Mittel (500)',
  'panel.button.fontWeight.semibold': 'Halbfett (600)',
  'panel.button.fontWeight.bold': 'Fett (700)',
  'panel.button.fullWidth': 'Volle Breite',

  // property panels — image
  'panel.image.title': 'Bildeigenschaften',
  'panel.image.imageUrl': 'Bild-URL',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Alt-Text',
  'panel.image.altPlaceholder': 'Bildbeschreibung',
  'panel.image.width': 'Breite (0 = auto)',

  // property panels — hero
  'panel.hero.title': 'Hero-Eigenschaften',
  'panel.hero.backgroundUrl': 'Hintergrund-URL',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'Hintergrundposition',
  'panel.hero.mode': 'Modus',
  'panel.hero.modeFluidHeight': 'Flexible Höhe',
  'panel.hero.modeFixedHeight': 'Feste Höhe',
  'panel.hero.height': 'Höhe',
  'panel.hero.width': 'Breite',
  'panel.hero.verticalAlign': 'Vertikale Ausrichtung',
  'panel.hero.verticalAlignTop': 'Oben',
  'panel.hero.verticalAlignMiddle': 'Mitte',
  'panel.hero.verticalAlignBottom': 'Unten',

  // property panels — navbar
  'panel.navbar.title': 'Navigationsleisten-Eigenschaften',
  'panel.navbar.links': 'Links',
  'panel.navbar.linkLabel': 'Link',
  'panel.navbar.removeLink': 'Entfernen',
  'panel.navbar.linkText': 'Text',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ Link hinzufügen',
  'panel.navbar.hamburger': 'Hamburger-Menü (mobil)',
  'panel.navbar.hamburgerShow': 'Anzeigen',
  'panel.navbar.hamburgerHide': 'Ausblenden',
  'panel.navbar.linkColor': 'Linkfarbe',
  'panel.navbar.linkFontSize': 'Link-Schriftgröße',
  'panel.navbar.linkPadding': 'Link-Innenabstand',

  // property panels — divider
  'panel.divider.title': 'Trennlinien-Eigenschaften',
  'panel.divider.style': 'Stil',
  'panel.divider.styleSolid': 'Durchgezogen',
  'panel.divider.styleDashed': 'Gestrichelt',
  'panel.divider.styleDotted': 'Gepunktet',
  'panel.divider.color': 'Farbe',
  'panel.divider.width': 'Breite',
  'panel.divider.lineWidth': 'Linienstärke',

  // property panels — spacer
  'panel.spacer.title': 'Abstandhalter-Eigenschaften',
  'panel.spacer.height': 'Höhe',

  // property panels — social
  'panel.social.title': 'Social-Media-Eigenschaften',
  'panel.social.icons': 'Symbole',
  'panel.social.iconLabel': 'Symbol',
  'panel.social.removeIcon': 'Entfernen',
  'panel.social.network': 'Netzwerk',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'Symbol-URL',
  'panel.social.altText': 'Beschriftung (Alt-Text)',
  'panel.social.addIcon': '+ Symbol hinzufügen',
  'panel.social.iconSize': 'Symbolgröße',
  'panel.social.spacing': 'Abstand',

  // property panels — html
  'panel.html.title': 'HTML-Eigenschaften',
  'panel.html.rawHtml': 'HTML-Quellcode',

  // property panels — row
  'panel.row.title': 'Zeileneigenschaften',
  'panel.row.columnLayout': 'Spaltenlayout',
  'panel.row.layout1col': '1 Spalte',
  'panel.row.layout2col': '2 gleich breit',
  'panel.row.layout3col': '3 gleich breit',
  'panel.row.layout4col': '4 gleich breit',
  'panel.row.backgroundImageUrl': 'Hintergrundbild-URL',
  'panel.row.fullWidth': 'Volle Breite',
  'panel.row.displayCondition': 'Anzeigebedingung',

  // controls — color picker
  'control.color.label': 'Farbe',

  // controls — font picker
  'control.fontPicker.label': 'Schriftart',

  // controls — link type picker
  'control.linkType.ariaLabel': 'Speziellen Link einfügen',
  'control.linkType.placeholder': '+ Spezieller Link',
  'control.linkType.emailPrompt': 'E-Mail-Adresse',
  'control.linkType.telPrompt': 'Telefonnummer',

  // controls — spacing input
  'control.spacing.top': 'Oben',
  'control.spacing.right': 'Rechts',
  'control.spacing.bottom': 'Unten',
  'control.spacing.left': 'Links',
  'control.spacing.topTitle': 'Oben (px)',
  'control.spacing.rightTitle': 'Rechts (px)',
  'control.spacing.bottomTitle': 'Unten (px)',
  'control.spacing.leftTitle': 'Links (px)',

  // controls — alignment picker
  'control.alignment.left': 'Linksbündig',
  'control.alignment.center': 'Zentriert',
  'control.alignment.right': 'Rechtsbündig',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'Tags suchen...',
  'control.mergeTag.noMatches': 'Keine passenden Tags',

  // rich text bubble toolbar
  'richtext.bold': 'Fett (Cmd+B)',
  'richtext.italic': 'Kursiv (Cmd+I)',
  'richtext.underline': 'Unterstrichen (Cmd+U)',
  'richtext.strike': 'Durchgestrichen',
  'richtext.code': 'Code',
  'richtext.link': 'Link',
  'richtext.apply': 'Anwenden',
  'richtext.removeLink': 'Link entfernen',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
