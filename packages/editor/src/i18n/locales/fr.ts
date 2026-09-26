/**
 * French UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Annuler',
  'toolbar.redo': 'Rétablir',
  'toolbar.preview-device': 'Appareil d’aperçu',
  'toolbar.desktop-view': 'Vue ordinateur',
  'toolbar.tablet-view-title': 'Vue tablette (768px)',
  'toolbar.tablet-view': 'Vue tablette',
  'toolbar.mobile-view-title': 'Vue mobile (375px)',
  'toolbar.mobile-view': 'Vue mobile',
  'toolbar.fullscreen': 'Plein écran',
  'toolbar.exit-fullscreen': 'Quitter le plein écran',
  'toolbar.enter-fullscreen': 'Passer en plein écran',
  'toolbar.templates': 'Modèles',
  'toolbar.preview': 'Aperçu',
  'toolbar.export': 'Exporter',
  'toolbar.export-format': 'Format d’export',
  'toolbar.export-html': 'Exporter en HTML',
  'toolbar.export-mjml': 'Exporter en MJML',
  'toolbar.export-json': 'Exporter en JSON',

  // palette
  'palette.label': 'Palette',
  'palette.tab.content': 'Contenu',
  'palette.tab.layers': 'Calques',
  'palette.tab.brand': 'Marque',
  'palette.tab.saved': 'Enregistrés',

  // palette — layout section
  'palette.layout.section-content': 'Contenu',
  'palette.layout.section-layout': 'Mise en page',
  'palette.layout.1-col': '1 colonne',
  'palette.layout.2-col': '2 colonnes',
  'palette.layout.3-col': '3 colonnes',
  'palette.layout.4-col': '4 colonnes',

  // palette — brand tab
  'palette.brand.colors': 'Couleurs',
  'palette.brand.fonts': 'Polices',
  'palette.brand.logos': 'Logos',
  'palette.brand.add': '+ Ajouter',
  'palette.brand.no-colors': 'Aucune couleur pour l’instant',
  'palette.brand.no-fonts': 'Aucune police pour l’instant',
  'palette.brand.no-logos': 'Aucun logo pour l’instant',
  'palette.brand.color-name-label': 'Nom de la couleur',
  'palette.brand.color-value-label': 'Valeur de la couleur',
  'palette.brand.delete-title': 'Supprimer',
  'palette.brand.insert-logo-title': 'Insérer le logo',

  // palette — saved tab
  'palette.saved.empty': 'Aucune ligne enregistrée pour l’instant. Utilisez l’action de signet sur une ligne pour l’enregistrer ici.',
  'palette.saved.delete-title': 'Supprimer',

  // preview
  'preview.heading': 'Aperçu',
  'preview.tab-group-label': 'Format d’aperçu',
  'preview.tab.preview': 'Aperçu',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'Aperçu ordinateur',
  'preview.device.mobile': 'Aperçu mobile',
  'preview.close': 'Fermer l’aperçu',
  'preview.loading': 'Rendu en cours...',

  // template picker
  'template.heading': 'Modèles',
  'template.close': 'Fermer',
  'template.section.choose': 'Choisir un modèle',
  'template.empty': 'Aucun modèle disponible pour l’instant.',
  'template.section.save': 'Enregistrer comme modèle',
  'template.field.name': 'Nom',
  'template.field.name-placeholder': 'Mon modèle',
  'template.field.category': 'Catégorie',
  'template.field.description': 'Description (facultative)',
  'template.field.description-placeholder': 'À quoi sert ce modèle ?',
  'template.cancel': 'Annuler',
  'template.save': 'Enregistrer le modèle',
  'template.error.name-required': 'Le nom est obligatoire',

  // asset manager
  'asset.title': 'Sélectionner une ressource',
  'asset.title-upload': 'Sélectionner une image',
  'asset.close': 'Fermer',
  'asset.tab.library': 'Bibliothèque',
  'asset.tab.upload': 'Importer',
  'asset.folder.all': 'Tous les dossiers',
  'asset.search': 'Rechercher des ressources',
  'asset.tag-filter-label': 'Filtrer par étiquette',
  'asset.loading': 'Chargement…',
  'asset.empty.filtered': 'Aucune ressource ne correspond à vos filtres.',
  'asset.empty.no-assets': 'Aucune ressource enregistrée pour l’instant. Importez-en une pour commencer.',
  'asset.drop-zone.label': 'Glissez-déposez une image ici',
  'asset.drop-zone.hint': 'ou cliquez pour parcourir',
  'asset.url.separator': 'ou saisissez une URL',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'Utiliser l’URL',

  // asset manager — stock tab
  'asset.tab.stock': 'Banque d’images',
  'asset.stock.search': 'Rechercher des photos gratuites…',
  'asset.stock.idle': 'Recherchez des photos gratuites sur Unsplash et Pexels.',
  'asset.stock.empty': 'Aucune photo trouvée. Essayez une autre recherche.',
  'asset.stock.load-more': 'Charger plus',
  'asset.stock.photo-by': 'Photo de',
  'asset.stock.on': 'sur',
  'asset.stock.error': 'Impossible de charger les photos. Vérifiez la clé d’API ou réessayez.',
  'asset.stock.rate-limited': 'Limite de requêtes atteinte. Réessayez dans un instant.',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'Couleur de fond',
  'panel.common.padding': 'Marge intérieure',
  'panel.common.outerPadding': 'Marge extérieure',
  'panel.common.innerPadding': 'Marge intérieure',
  'panel.common.alignment': 'Alignement',
  'panel.common.fontSize': 'Taille de police',
  'panel.common.borderRadius': 'Arrondi des bordures',
  'panel.common.linkUrl': 'URL du lien',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'Contenu (HTML)',
  'panel.common.displayCondition': 'Condition d’affichage',
  'panel.common.insertMergeTag': 'Insérer une balise de fusion',
  'panel.common.tagBtn': '{ } Balise',
  'panel.common.uploadImage': 'Importer une image',
  'panel.common.left': 'Gauche',
  'panel.common.center': 'Centre',

  // property panels — body
  'panel.body.title': 'Corps de l’e-mail',
  'panel.body.contentWidth': 'Largeur du contenu',
  'panel.body.fontFamily': 'Famille de police',
  'panel.body.contentAlignment': 'Alignement du contenu',
  'panel.body.emailName': 'Nom de l’e-mail',
  'panel.body.previewText': 'Texte d’aperçu',
  'panel.body.previewTextPlaceholder': 'Texte d’aperçu de l’e-mail...',

  // property panels — text
  'panel.text.title': 'Propriétés du texte',
  'panel.text.textAlign': 'Alignement du texte',
  'panel.text.lineHeight': 'Hauteur de ligne',

  // property panels — button
  'panel.button.title': 'Propriétés du bouton',
  'panel.button.buttonText': 'Texte du bouton',
  'panel.button.textColor': 'Couleur du texte',
  'panel.button.fontWeight': 'Graisse',
  'panel.button.fontWeight.normal': 'Normal (400)',
  'panel.button.fontWeight.medium': 'Moyen (500)',
  'panel.button.fontWeight.semibold': 'Demi-gras (600)',
  'panel.button.fontWeight.bold': 'Gras (700)',
  'panel.button.fullWidth': 'Pleine largeur',

  // property panels — image
  'panel.image.title': 'Propriétés de l’image',
  'panel.image.imageUrl': 'URL de l’image',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Texte alt',
  'panel.image.altPlaceholder': 'Description de l’image',
  'panel.image.width': 'Largeur (0 = auto)',

  // property panels — hero
  'panel.hero.title': 'Propriétés de la bannière',
  'panel.hero.backgroundUrl': 'URL de l’arrière-plan',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'Position de l’arrière-plan',
  'panel.hero.mode': 'Mode',
  'panel.hero.modeFluidHeight': 'Hauteur fluide',
  'panel.hero.modeFixedHeight': 'Hauteur fixe',
  'panel.hero.height': 'Hauteur',
  'panel.hero.width': 'Largeur',
  'panel.hero.verticalAlign': 'Alignement vertical',
  'panel.hero.verticalAlignTop': 'Haut',
  'panel.hero.verticalAlignMiddle': 'Milieu',
  'panel.hero.verticalAlignBottom': 'Bas',

  // property panels — navbar
  'panel.navbar.title': 'Propriétés de la barre de navigation',
  'panel.navbar.links': 'Liens',
  'panel.navbar.linkLabel': 'Lien',
  'panel.navbar.removeLink': 'Retirer',
  'panel.navbar.linkText': 'Texte',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ Ajouter un lien',
  'panel.navbar.hamburger': 'Menu hamburger (mobile)',
  'panel.navbar.hamburgerShow': 'Afficher',
  'panel.navbar.hamburgerHide': 'Masquer',
  'panel.navbar.linkColor': 'Couleur des liens',
  'panel.navbar.linkFontSize': 'Taille de police des liens',
  'panel.navbar.linkPadding': 'Marge intérieure des liens',

  // property panels — divider
  'panel.divider.title': 'Propriétés du séparateur',
  'panel.divider.style': 'Style',
  'panel.divider.styleSolid': 'Plein',
  'panel.divider.styleDashed': 'Tirets',
  'panel.divider.styleDotted': 'Pointillés',
  'panel.divider.color': 'Couleur',
  'panel.divider.width': 'Largeur',
  'panel.divider.lineWidth': 'Épaisseur du trait',

  // property panels — spacer
  'panel.spacer.title': 'Propriétés de l’espacement',
  'panel.spacer.height': 'Hauteur',

  // property panels — social
  'panel.social.title': 'Propriétés des réseaux sociaux',
  'panel.social.icons': 'Icônes',
  'panel.social.iconLabel': 'Icône',
  'panel.social.removeIcon': 'Retirer',
  'panel.social.network': 'Réseau',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'URL de l’icône',
  'panel.social.altText': 'Libellé (texte alt)',
  'panel.social.addIcon': '+ Ajouter une icône',
  'panel.social.iconSize': 'Taille des icônes',
  'panel.social.spacing': 'Espacement',

  // property panels — html
  'panel.html.title': 'Propriétés HTML',
  'panel.html.rawHtml': 'HTML brut',

  // property panels — row
  'panel.row.title': 'Propriétés de la ligne',
  'panel.row.columnLayout': 'Disposition des colonnes',
  'panel.row.layout1col': '1 colonne',
  'panel.row.layout2col': '2 égales',
  'panel.row.layout3col': '3 égales',
  'panel.row.layout4col': '4 égales',
  'panel.row.backgroundImageUrl': 'URL de l’image d’arrière-plan',
  'panel.row.fullWidth': 'Pleine largeur',
  'panel.row.noStackOnMobile': 'Ne pas empiler sur mobile',
  'panel.row.displayCondition': 'Condition d’affichage',
  'panel.row.repeat': 'Répéter pour chaque',

  // controls — color picker
  'control.color.label': 'Couleur',

  // controls — font picker
  'control.fontPicker.label': 'Famille de police',

  // controls — link type picker
  'control.linkType.ariaLabel': 'Insérer un lien spécial',
  'control.linkType.placeholder': '+ Lien spécial',
  'control.linkType.emailPrompt': 'Adresse e-mail',
  'control.linkType.telPrompt': 'Numéro de téléphone',

  // controls — spacing input
  'control.spacing.top': 'Haut',
  'control.spacing.right': 'Droite',
  'control.spacing.bottom': 'Bas',
  'control.spacing.left': 'Gauche',
  'control.spacing.topTitle': 'Haut (px)',
  'control.spacing.rightTitle': 'Droite (px)',
  'control.spacing.bottomTitle': 'Bas (px)',
  'control.spacing.leftTitle': 'Gauche (px)',

  // controls — alignment picker
  'control.alignment.left': 'Aligner à gauche',
  'control.alignment.center': 'Centrer',
  'control.alignment.right': 'Aligner à droite',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'Rechercher des balises...',
  'control.mergeTag.noMatches': 'Aucune balise correspondante',

  // rich text bubble toolbar
  'richtext.bold': 'Gras (Cmd+B)',
  'richtext.italic': 'Italique (Cmd+I)',
  'richtext.underline': 'Souligné (Cmd+U)',
  'richtext.strike': 'Barré',
  'richtext.code': 'Code',
  'richtext.link': 'Lien',
  'richtext.apply': 'Appliquer',
  'richtext.removeLink': 'Supprimer le lien',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
