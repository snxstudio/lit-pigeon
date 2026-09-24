/**
 * Dutch UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Ongedaan maken',
  'toolbar.redo': 'Opnieuw',
  'toolbar.preview-device': 'Voorbeeldapparaat',
  'toolbar.desktop-view': 'Desktopweergave',
  'toolbar.tablet-view-title': 'Tabletweergave (768px)',
  'toolbar.tablet-view': 'Tabletweergave',
  'toolbar.mobile-view-title': 'Mobiele weergave (375px)',
  'toolbar.mobile-view': 'Mobiele weergave',
  'toolbar.fullscreen': 'Volledig scherm',
  'toolbar.exit-fullscreen': 'Volledig scherm afsluiten',
  'toolbar.enter-fullscreen': 'Volledig scherm openen',
  'toolbar.templates': 'Sjablonen',
  'toolbar.preview': 'Voorbeeld',
  'toolbar.export': 'Exporteren',
  'toolbar.export-format': 'Exportformaat',
  'toolbar.export-html': 'HTML exporteren',
  'toolbar.export-mjml': 'MJML exporteren',
  'toolbar.export-json': 'JSON exporteren',

  // palette
  'palette.label': 'Palet',
  'palette.tab.content': 'Inhoud',
  'palette.tab.layers': 'Lagen',
  'palette.tab.brand': 'Merk',
  'palette.tab.saved': 'Opgeslagen',

  // palette — layout section
  'palette.layout.section-content': 'Inhoud',
  'palette.layout.section-layout': 'Indeling',
  'palette.layout.1-col': '1 kolom',
  'palette.layout.2-col': '2 kolommen',
  'palette.layout.3-col': '3 kolommen',
  'palette.layout.4-col': '4 kolommen',

  // palette — brand tab
  'palette.brand.colors': 'Kleuren',
  'palette.brand.fonts': 'Lettertypen',
  'palette.brand.logos': 'Logo\'s',
  'palette.brand.add': '+ Toevoegen',
  'palette.brand.no-colors': 'Nog geen kleuren',
  'palette.brand.no-fonts': 'Nog geen lettertypen',
  'palette.brand.no-logos': 'Nog geen logo\'s',
  'palette.brand.color-name-label': 'Kleurnaam',
  'palette.brand.color-value-label': 'Kleurwaarde',
  'palette.brand.delete-title': 'Verwijderen',
  'palette.brand.insert-logo-title': 'Logo invoegen',

  // palette — saved tab
  'palette.saved.empty': 'Nog geen opgeslagen rijen. Gebruik de bladwijzeractie op een rij om deze hier op te slaan.',
  'palette.saved.delete-title': 'Verwijderen',

  // preview
  'preview.heading': 'Voorbeeld',
  'preview.tab-group-label': 'Voorbeeldformaat',
  'preview.tab.preview': 'Voorbeeld',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'Desktopvoorbeeld',
  'preview.device.mobile': 'Mobiel voorbeeld',
  'preview.close': 'Voorbeeld sluiten',
  'preview.loading': 'Weergeven...',

  // template picker
  'template.heading': 'Sjablonen',
  'template.close': 'Sluiten',
  'template.section.choose': 'Kies een sjabloon',
  'template.empty': 'Nog geen sjablonen beschikbaar.',
  'template.section.save': 'Huidige opslaan als sjabloon',
  'template.field.name': 'Naam',
  'template.field.name-placeholder': 'Mijn sjabloon',
  'template.field.category': 'Categorie',
  'template.field.description': 'Beschrijving (optioneel)',
  'template.field.description-placeholder': 'Waarvoor is dit sjabloon?',
  'template.cancel': 'Annuleren',
  'template.save': 'Sjabloon opslaan',
  'template.error.name-required': 'Naam is verplicht',

  // asset manager
  'asset.title': 'Bestand selecteren',
  'asset.title-upload': 'Afbeelding selecteren',
  'asset.close': 'Sluiten',
  'asset.tab.library': 'Bibliotheek',
  'asset.tab.upload': 'Uploaden',
  'asset.folder.all': 'Alle mappen',
  'asset.search': 'Bestanden zoeken',
  'asset.tag-filter-label': 'Filteren op tag',
  'asset.loading': 'Laden…',
  'asset.empty.filtered': 'Geen bestanden komen overeen met je filters.',
  'asset.empty.no-assets': 'Nog geen opgeslagen bestanden. Upload er een om te beginnen.',
  'asset.drop-zone.label': 'Sleep een afbeelding hierheen',
  'asset.drop-zone.hint': 'of klik om te bladeren',
  'asset.url.separator': 'of voer een URL in',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'URL gebruiken',

  // asset manager — stock tab
  'asset.tab.stock': 'Stockfoto\'s',
  'asset.stock.search': 'Gratis foto\'s zoeken…',
  'asset.stock.idle': 'Zoek gratis foto\'s op Unsplash en Pexels.',
  'asset.stock.empty': 'Geen foto\'s gevonden. Probeer een andere zoekopdracht.',
  'asset.stock.load-more': 'Meer laden',
  'asset.stock.photo-by': 'Foto door',
  'asset.stock.on': 'op',
  'asset.stock.error': 'Kan foto\'s niet laden. Controleer de API-sleutel of probeer het opnieuw.',
  'asset.stock.rate-limited': 'Limiet bereikt. Probeer het zo meteen opnieuw.',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'Achtergrondkleur',
  'panel.common.padding': 'Opvulling',
  'panel.common.outerPadding': 'Buitenste opvulling',
  'panel.common.innerPadding': 'Binnenste opvulling',
  'panel.common.alignment': 'Uitlijning',
  'panel.common.fontSize': 'Lettergrootte',
  'panel.common.borderRadius': 'Hoekradius',
  'panel.common.linkUrl': 'Link-URL',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'Inhoud (HTML)',
  'panel.common.displayCondition': 'Weergavevoorwaarde',
  'panel.common.insertMergeTag': 'Samenvoegtag invoegen',
  'panel.common.tagBtn': '{ } Tag',
  'panel.common.uploadImage': 'Afbeelding uploaden',
  'panel.common.left': 'Links',
  'panel.common.center': 'Midden',

  // property panels — body
  'panel.body.title': 'E-mailbody',
  'panel.body.contentWidth': 'Inhoudsbreedte',
  'panel.body.fontFamily': 'Lettertype',
  'panel.body.contentAlignment': 'Uitlijning inhoud',
  'panel.body.linkColor': 'Linkkleur',
  'panel.body.linkUnderline': 'Links onderstrepen',
  'panel.body.emailName': 'E-mailnaam',
  'panel.body.previewText': 'Voorbeeldtekst',
  'panel.body.previewTextPlaceholder': 'Voorbeeldtekst van e-mail...',

  // property panels — text
  'panel.text.title': 'Teksteigenschappen',
  'panel.text.textAlign': 'Tekstuitlijning',
  'panel.text.lineHeight': 'Regelhoogte',

  // property panels — button
  'panel.button.title': 'Knopeigenschappen',
  'panel.button.buttonText': 'Knoptekst',
  'panel.button.textColor': 'Tekstkleur',
  'panel.button.fontWeight': 'Tekstdikte',
  'panel.button.fontWeight.normal': 'Normaal (400)',
  'panel.button.fontWeight.medium': 'Medium (500)',
  'panel.button.fontWeight.semibold': 'Halfvet (600)',
  'panel.button.fontWeight.bold': 'Vet (700)',
  'panel.button.border': 'Rand',
  'panel.button.borderNone': 'Geen',
  'panel.button.borderSolid': 'Doorgetrokken',
  'panel.button.borderDashed': 'Gestreept',
  'panel.button.borderDotted': 'Gestippeld',
  'panel.button.borderWidth': 'Randbreedte',
  'panel.button.borderColor': 'Randkleur',
  'panel.button.fullWidth': 'Volledige breedte',

  // property panels — image
  'panel.image.title': 'Afbeeldingseigenschappen',
  'panel.image.imageUrl': 'Afbeeldings-URL',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Alt-tekst',
  'panel.image.altPlaceholder': 'Beschrijving van afbeelding',
  'panel.image.width': 'Breedte (0 = auto)',

  // property panels — hero
  'panel.hero.title': 'Hero-eigenschappen',
  'panel.hero.backgroundUrl': 'Achtergrond-URL',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'Achtergrondpositie',
  'panel.hero.mode': 'Modus',
  'panel.hero.modeFluidHeight': 'Vloeiende hoogte',
  'panel.hero.modeFixedHeight': 'Vaste hoogte',
  'panel.hero.height': 'Hoogte',
  'panel.hero.width': 'Breedte',
  'panel.hero.verticalAlign': 'Verticale uitlijning',
  'panel.hero.verticalAlignTop': 'Boven',
  'panel.hero.verticalAlignMiddle': 'Midden',
  'panel.hero.verticalAlignBottom': 'Onder',

  // property panels — navbar
  'panel.navbar.title': 'Navigatiebalkeigenschappen',
  'panel.navbar.links': 'Links',
  'panel.navbar.linkLabel': 'Link',
  'panel.navbar.removeLink': 'Verwijderen',
  'panel.navbar.linkText': 'Tekst',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ Link toevoegen',
  'panel.navbar.hamburger': 'Hamburgermenu (mobiel)',
  'panel.navbar.hamburgerShow': 'Tonen',
  'panel.navbar.hamburgerHide': 'Verbergen',
  'panel.navbar.linkColor': 'Linkkleur',
  'panel.navbar.linkFontSize': 'Lettergrootte link',
  'panel.navbar.linkPadding': 'Opvulling link',

  // property panels — divider
  'panel.divider.title': 'Scheidingslijneigenschappen',
  'panel.divider.style': 'Stijl',
  'panel.divider.styleSolid': 'Doorgetrokken',
  'panel.divider.styleDashed': 'Gestreept',
  'panel.divider.styleDotted': 'Gestippeld',
  'panel.divider.color': 'Kleur',
  'panel.divider.width': 'Breedte',
  'panel.divider.lineWidth': 'Lijndikte',

  // property panels — spacer
  'panel.spacer.title': 'Tussenruimte-eigenschappen',
  'panel.spacer.height': 'Hoogte',

  // property panels — social
  'panel.social.title': 'Social media-eigenschappen',
  'panel.social.icons': 'Pictogrammen',
  'panel.social.iconLabel': 'Pictogram',
  'panel.social.removeIcon': 'Verwijderen',
  'panel.social.network': 'Netwerk',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'Pictogram-URL',
  'panel.social.altText': 'Label (alt-tekst)',
  'panel.social.addIcon': '+ Pictogram toevoegen',
  'panel.social.iconSize': 'Pictogramgrootte',
  'panel.social.spacing': 'Tussenruimte',

  // property panels — html
  'panel.html.title': 'HTML-eigenschappen',
  'panel.html.rawHtml': 'Onbewerkte HTML',

  // property panels — row
  'panel.row.title': 'Rijeigenschappen',
  'panel.row.columnLayout': 'Kolomindeling',
  'panel.row.layout1col': '1 kolom',
  'panel.row.layout2col': '2 gelijk',
  'panel.row.layout3col': '3 gelijk',
  'panel.row.layout4col': '4 gelijk',
  'panel.row.backgroundImageUrl': 'URL achtergrondafbeelding',
  'panel.row.fullWidth': 'Volledige breedte',
  'panel.row.displayCondition': 'Weergavevoorwaarde',
  'panel.row.repeat': 'Herhalen voor elk',

  // controls — color picker
  'control.color.label': 'Kleur',

  // controls — font picker
  'control.fontPicker.label': 'Lettertype',

  // controls — link type picker
  'control.linkType.ariaLabel': 'Speciale link invoegen',
  'control.linkType.placeholder': '+ Speciale link',
  'control.linkType.emailPrompt': 'E-mailadres',
  'control.linkType.telPrompt': 'Telefoonnummer',

  // controls — spacing input
  'control.spacing.top': 'Boven',
  'control.spacing.right': 'Rechts',
  'control.spacing.bottom': 'Onder',
  'control.spacing.left': 'Links',
  'control.spacing.topTitle': 'Boven (px)',
  'control.spacing.rightTitle': 'Rechts (px)',
  'control.spacing.bottomTitle': 'Onder (px)',
  'control.spacing.leftTitle': 'Links (px)',

  // controls — alignment picker
  'control.alignment.left': 'Links uitlijnen',
  'control.alignment.center': 'Centreren',
  'control.alignment.right': 'Rechts uitlijnen',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'Tags zoeken...',
  'control.mergeTag.noMatches': 'Geen overeenkomende tags',

  // rich text bubble toolbar
  'richtext.bold': 'Vet (Cmd+B)',
  'richtext.italic': 'Cursief (Cmd+I)',
  'richtext.underline': 'Onderstrepen (Cmd+U)',
  'richtext.strike': 'Doorhalen',
  'richtext.code': 'Code',
  'richtext.link': 'Link',
  'richtext.apply': 'Toepassen',
  'richtext.removeLink': 'Link verwijderen',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
