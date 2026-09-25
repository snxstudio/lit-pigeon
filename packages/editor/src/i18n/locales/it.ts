/**
 * Italian UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Annulla',
  'toolbar.redo': 'Ripeti',
  'toolbar.preview-device': 'Dispositivo di anteprima',
  'toolbar.desktop-view': 'Vista desktop',
  'toolbar.tablet-view-title': 'Vista tablet (768px)',
  'toolbar.tablet-view': 'Vista tablet',
  'toolbar.mobile-view-title': 'Vista mobile (375px)',
  'toolbar.mobile-view': 'Vista mobile',
  'toolbar.fullscreen': 'Schermo intero',
  'toolbar.exit-fullscreen': 'Esci da schermo intero',
  'toolbar.enter-fullscreen': 'Attiva schermo intero',
  'toolbar.templates': 'Modelli',
  'toolbar.preview': 'Anteprima',
  'toolbar.export': 'Esporta',
  'toolbar.export-format': 'Formato di esportazione',
  'toolbar.export-html': 'Esporta HTML',
  'toolbar.export-mjml': 'Esporta MJML',
  'toolbar.export-json': 'Esporta JSON',

  // palette
  'palette.label': 'Tavolozza',
  'palette.tab.content': 'Contenuto',
  'palette.tab.layers': 'Livelli',
  'palette.tab.brand': 'Brand',
  'palette.tab.saved': 'Salvati',

  // palette — layout section
  'palette.layout.section-content': 'Contenuto',
  'palette.layout.section-layout': 'Layout',
  'palette.layout.1-col': '1 colonna',
  'palette.layout.2-col': '2 colonne',
  'palette.layout.3-col': '3 colonne',
  'palette.layout.4-col': '4 colonne',

  // palette — brand tab
  'palette.brand.colors': 'Colori',
  'palette.brand.fonts': 'Font',
  'palette.brand.logos': 'Loghi',
  'palette.brand.add': '+ Aggiungi',
  'palette.brand.no-colors': 'Ancora nessun colore',
  'palette.brand.no-fonts': 'Ancora nessun font',
  'palette.brand.no-logos': 'Ancora nessun logo',
  'palette.brand.color-name-label': 'Nome colore',
  'palette.brand.color-value-label': 'Valore colore',
  'palette.brand.delete-title': 'Elimina',
  'palette.brand.insert-logo-title': 'Inserisci logo',

  // palette — saved tab
  'palette.saved.empty': 'Ancora nessuna riga salvata. Usa l’azione segnalibro su una riga per salvarla qui.',
  'palette.saved.delete-title': 'Elimina',

  // preview
  'preview.heading': 'Anteprima',
  'preview.tab-group-label': 'Formato anteprima',
  'preview.tab.preview': 'Anteprima',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'Anteprima desktop',
  'preview.device.mobile': 'Anteprima mobile',
  'preview.close': 'Chiudi anteprima',
  'preview.loading': 'Rendering in corso...',

  // template picker
  'template.heading': 'Modelli',
  'template.close': 'Chiudi',
  'template.section.choose': 'Scegli un modello',
  'template.empty': 'Ancora nessun modello disponibile.',
  'template.section.save': 'Salva come modello',
  'template.field.name': 'Nome',
  'template.field.name-placeholder': 'Il mio modello',
  'template.field.category': 'Categoria',
  'template.field.description': 'Descrizione (facoltativa)',
  'template.field.description-placeholder': 'A cosa serve questo modello?',
  'template.cancel': 'Annulla',
  'template.save': 'Salva modello',
  'template.error.name-required': 'Il nome è obbligatorio',

  // asset manager
  'asset.title': 'Seleziona risorsa',
  'asset.title-upload': 'Seleziona immagine',
  'asset.close': 'Chiudi',
  'asset.tab.library': 'Libreria',
  'asset.tab.upload': 'Carica',
  'asset.folder.all': 'Tutte le cartelle',
  'asset.search': 'Cerca risorse',
  'asset.tag-filter-label': 'Filtra per tag',
  'asset.loading': 'Caricamento…',
  'asset.empty.filtered': 'Nessuna risorsa corrisponde ai filtri.',
  'asset.empty.no-assets': 'Ancora nessuna risorsa salvata. Caricane una per iniziare.',
  'asset.drop-zone.label': 'Trascina qui un’immagine',
  'asset.drop-zone.hint': 'oppure fai clic per sfogliare',
  'asset.url.separator': 'oppure inserisci un URL',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'Usa URL',

  // asset manager — stock tab
  'asset.tab.stock': 'Stock',
  'asset.stock.search': 'Cerca foto gratuite…',
  'asset.stock.idle': 'Cerca foto gratuite su Unsplash e Pexels.',
  'asset.stock.empty': 'Nessuna foto trovata. Prova un’altra ricerca.',
  'asset.stock.load-more': 'Carica altro',
  'asset.stock.photo-by': 'Foto di',
  'asset.stock.on': 'su',
  'asset.stock.error': 'Impossibile caricare le foto. Controlla la chiave API o riprova.',
  'asset.stock.rate-limited': 'Limite di richieste raggiunto. Riprova tra poco.',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'Colore di sfondo',
  'panel.common.padding': 'Spaziatura interna',
  'panel.common.outerPadding': 'Spaziatura esterna',
  'panel.common.innerPadding': 'Spaziatura interna',
  'panel.common.alignment': 'Allineamento',
  'panel.common.fontSize': 'Dimensione font',
  'panel.common.borderRadius': 'Raggio del bordo',
  'panel.common.linkUrl': 'URL del link',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'Contenuto (HTML)',
  'panel.common.displayCondition': 'Condizione di visualizzazione',
  'panel.common.insertMergeTag': 'Inserisci tag di unione',
  'panel.common.tagBtn': '{ } Tag',
  'panel.common.uploadImage': 'Carica immagine',
  'panel.common.left': 'Sinistra',
  'panel.common.center': 'Centro',

  // property panels — body
  'panel.body.title': 'Corpo dell’email',
  'panel.body.contentWidth': 'Larghezza contenuto',
  'panel.body.fontFamily': 'Famiglia di font',
  'panel.body.contentAlignment': 'Allineamento contenuto',
  'panel.body.emailName': 'Nome email',
  'panel.body.previewText': 'Testo di anteprima',
  'panel.body.previewTextPlaceholder': 'Testo di anteprima dell’email...',
  'panel.body.language': 'Lingua',
  'panel.body.languagePlaceholder': 'es. en, pt-BR',
  'panel.body.textDirection': 'Direzione del testo',
  'panel.body.directionAuto': 'Automatica',
  'panel.body.directionLtr': 'Da sinistra a destra',
  'panel.body.directionRtl': 'Da destra a sinistra',

  // property panels — text
  'panel.text.title': 'Proprietà testo',
  'panel.text.textAlign': 'Allineamento testo',
  'panel.text.lineHeight': 'Interlinea',

  // property panels — button
  'panel.button.title': 'Proprietà pulsante',
  'panel.button.buttonText': 'Testo pulsante',
  'panel.button.textColor': 'Colore testo',
  'panel.button.fontWeight': 'Spessore font',
  'panel.button.fontWeight.normal': 'Normale (400)',
  'panel.button.fontWeight.medium': 'Medio (500)',
  'panel.button.fontWeight.semibold': 'Semigrassetto (600)',
  'panel.button.fontWeight.bold': 'Grassetto (700)',
  'panel.button.fullWidth': 'Larghezza piena',

  // property panels — image
  'panel.image.title': 'Proprietà immagine',
  'panel.image.imageUrl': 'URL immagine',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Testo alt',
  'panel.image.altPlaceholder': 'Descrizione immagine',
  'panel.image.width': 'Larghezza (0 = auto)',

  // property panels — hero
  'panel.hero.title': 'Proprietà hero',
  'panel.hero.backgroundUrl': 'URL sfondo',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'Posizione sfondo',
  'panel.hero.mode': 'Modalità',
  'panel.hero.modeFluidHeight': 'Altezza fluida',
  'panel.hero.modeFixedHeight': 'Altezza fissa',
  'panel.hero.height': 'Altezza',
  'panel.hero.width': 'Larghezza',
  'panel.hero.verticalAlign': 'Allineamento verticale',
  'panel.hero.verticalAlignTop': 'In alto',
  'panel.hero.verticalAlignMiddle': 'Al centro',
  'panel.hero.verticalAlignBottom': 'In basso',

  // property panels — navbar
  'panel.navbar.title': 'Proprietà barra di navigazione',
  'panel.navbar.links': 'Link',
  'panel.navbar.linkLabel': 'Link',
  'panel.navbar.removeLink': 'Rimuovi',
  'panel.navbar.linkText': 'Testo',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ Aggiungi link',
  'panel.navbar.hamburger': 'Menu hamburger (mobile)',
  'panel.navbar.hamburgerShow': 'Mostra',
  'panel.navbar.hamburgerHide': 'Nascondi',
  'panel.navbar.linkColor': 'Colore link',
  'panel.navbar.linkFontSize': 'Dimensione font link',
  'panel.navbar.linkPadding': 'Spaziatura link',

  // property panels — divider
  'panel.divider.title': 'Proprietà divisore',
  'panel.divider.style': 'Stile',
  'panel.divider.styleSolid': 'Continuo',
  'panel.divider.styleDashed': 'Tratteggiato',
  'panel.divider.styleDotted': 'Punteggiato',
  'panel.divider.color': 'Colore',
  'panel.divider.width': 'Larghezza',
  'panel.divider.lineWidth': 'Spessore linea',

  // property panels — spacer
  'panel.spacer.title': 'Proprietà spaziatore',
  'panel.spacer.height': 'Altezza',

  // property panels — social
  'panel.social.title': 'Proprietà social',
  'panel.social.icons': 'Icone',
  'panel.social.iconLabel': 'Icona',
  'panel.social.removeIcon': 'Rimuovi',
  'panel.social.network': 'Rete',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'URL icona',
  'panel.social.altText': 'Etichetta (testo alt)',
  'panel.social.addIcon': '+ Aggiungi icona',
  'panel.social.iconSize': 'Dimensione icona',
  'panel.social.spacing': 'Spaziatura',

  // property panels — html
  'panel.html.title': 'Proprietà HTML',
  'panel.html.rawHtml': 'HTML grezzo',

  // property panels — row
  'panel.row.title': 'Proprietà riga',
  'panel.row.columnLayout': 'Layout colonne',
  'panel.row.layout1col': '1 colonna',
  'panel.row.layout2col': '2 uguali',
  'panel.row.layout3col': '3 uguali',
  'panel.row.layout4col': '4 uguali',
  'panel.row.backgroundImageUrl': 'URL immagine di sfondo',
  'panel.row.fullWidth': 'Larghezza piena',
  'panel.row.displayCondition': 'Condizione di visualizzazione',
  'panel.row.repeat': 'Ripeti per ogni',

  // controls — color picker
  'control.color.label': 'Colore',

  // controls — font picker
  'control.fontPicker.label': 'Famiglia di font',

  // controls — link type picker
  'control.linkType.ariaLabel': 'Inserisci un link speciale',
  'control.linkType.placeholder': '+ Link speciale',
  'control.linkType.emailPrompt': 'Indirizzo email',
  'control.linkType.telPrompt': 'Numero di telefono',

  // controls — spacing input
  'control.spacing.top': 'Sopra',
  'control.spacing.right': 'Destra',
  'control.spacing.bottom': 'Sotto',
  'control.spacing.left': 'Sinistra',
  'control.spacing.topTitle': 'Sopra (px)',
  'control.spacing.rightTitle': 'Destra (px)',
  'control.spacing.bottomTitle': 'Sotto (px)',
  'control.spacing.leftTitle': 'Sinistra (px)',

  // controls — alignment picker
  'control.alignment.left': 'Allinea a sinistra',
  'control.alignment.center': 'Allinea al centro',
  'control.alignment.right': 'Allinea a destra',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'Cerca tag...',
  'control.mergeTag.noMatches': 'Nessun tag corrispondente',

  // rich text bubble toolbar
  'richtext.bold': 'Grassetto (Cmd+B)',
  'richtext.italic': 'Corsivo (Cmd+I)',
  'richtext.underline': 'Sottolineato (Cmd+U)',
  'richtext.strike': 'Barrato',
  'richtext.code': 'Codice',
  'richtext.link': 'Link',
  'richtext.apply': 'Applica',
  'richtext.removeLink': 'Rimuovi link',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
