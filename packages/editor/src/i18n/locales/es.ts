/**
 * Spanish UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Deshacer',
  'toolbar.redo': 'Rehacer',
  'toolbar.preview-device': 'Dispositivo de vista previa',
  'toolbar.desktop-view': 'Vista de escritorio',
  'toolbar.tablet-view-title': 'Vista de tableta (768px)',
  'toolbar.tablet-view': 'Vista de tableta',
  'toolbar.mobile-view-title': 'Vista móvil (375px)',
  'toolbar.mobile-view': 'Vista móvil',
  'toolbar.fullscreen': 'Pantalla completa',
  'toolbar.exit-fullscreen': 'Salir de pantalla completa',
  'toolbar.enter-fullscreen': 'Pantalla completa',
  'toolbar.templates': 'Plantillas',
  'toolbar.preview': 'Vista previa',
  'toolbar.export': 'Exportar',
  'toolbar.export-format': 'Formato de exportación',
  'toolbar.export-html': 'Exportar HTML',
  'toolbar.export-mjml': 'Exportar MJML',
  'toolbar.export-json': 'Exportar JSON',

  // palette
  'palette.label': 'Paleta',
  'palette.tab.content': 'Contenido',
  'palette.tab.layers': 'Capas',
  'palette.tab.brand': 'Marca',
  'palette.tab.saved': 'Guardados',

  // palette — layout section
  'palette.layout.section-content': 'Contenido',
  'palette.layout.section-layout': 'Diseño',
  'palette.layout.1-col': '1 columna',
  'palette.layout.2-col': '2 columnas',
  'palette.layout.3-col': '3 columnas',
  'palette.layout.4-col': '4 columnas',

  // palette — brand tab
  'palette.brand.colors': 'Colores',
  'palette.brand.fonts': 'Fuentes',
  'palette.brand.logos': 'Logotipos',
  'palette.brand.add': '+ Añadir',
  'palette.brand.no-colors': 'Aún no hay colores',
  'palette.brand.no-fonts': 'Aún no hay fuentes',
  'palette.brand.no-logos': 'Aún no hay logotipos',
  'palette.brand.color-name-label': 'Nombre del color',
  'palette.brand.color-value-label': 'Valor del color',
  'palette.brand.delete-title': 'Eliminar',
  'palette.brand.insert-logo-title': 'Insertar logotipo',

  // palette — saved tab
  'palette.saved.empty': 'Aún no hay filas guardadas. Usa la acción de marcador en una fila para guardarla aquí.',
  'palette.saved.delete-title': 'Eliminar',

  // preview
  'preview.heading': 'Vista previa',
  'preview.tab-group-label': 'Formato de vista previa',
  'preview.tab.preview': 'Vista previa',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'Vista previa de escritorio',
  'preview.device.mobile': 'Vista previa móvil',
  'preview.close': 'Cerrar vista previa',
  'preview.loading': 'Renderizando...',

  // template picker
  'template.heading': 'Plantillas',
  'template.close': 'Cerrar',
  'template.section.choose': 'Elige una plantilla',
  'template.empty': 'Aún no hay plantillas disponibles.',
  'template.section.save': 'Guardar actual como plantilla',
  'template.field.name': 'Nombre',
  'template.field.name-placeholder': 'Mi plantilla',
  'template.field.category': 'Categoría',
  'template.field.description': 'Descripción (opcional)',
  'template.field.description-placeholder': '¿Para qué sirve esta plantilla?',
  'template.cancel': 'Cancelar',
  'template.save': 'Guardar plantilla',
  'template.error.name-required': 'El nombre es obligatorio',

  // asset manager
  'asset.title': 'Seleccionar recurso',
  'asset.title-upload': 'Seleccionar imagen',
  'asset.close': 'Cerrar',
  'asset.tab.library': 'Biblioteca',
  'asset.tab.upload': 'Subir',
  'asset.folder.all': 'Todas las carpetas',
  'asset.search': 'Buscar recursos',
  'asset.tag-filter-label': 'Filtrar por etiqueta',
  'asset.loading': 'Cargando…',
  'asset.empty.filtered': 'Ningún recurso coincide con los filtros.',
  'asset.empty.no-assets': 'Aún no hay recursos guardados. Sube uno para empezar.',
  'asset.drop-zone.label': 'Arrastra y suelta una imagen aquí',
  'asset.drop-zone.hint': 'o haz clic para examinar',
  'asset.url.separator': 'o introduce una URL',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'Usar URL',

  // asset manager — stock tab
  'asset.tab.stock': 'Banco de imágenes',
  'asset.stock.search': 'Buscar fotos gratuitas…',
  'asset.stock.idle': 'Busca fotos gratuitas en Unsplash y Pexels.',
  'asset.stock.empty': 'No se encontraron fotos. Prueba otra búsqueda.',
  'asset.stock.load-more': 'Cargar más',
  'asset.stock.photo-by': 'Foto de',
  'asset.stock.on': 'en',
  'asset.stock.error': 'No se pudieron cargar las fotos. Comprueba la clave de API o inténtalo de nuevo.',
  'asset.stock.rate-limited': 'Se alcanzó el límite de solicitudes. Inténtalo de nuevo en breve.',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'Color de fondo',
  'panel.common.padding': 'Relleno',
  'panel.common.outerPadding': 'Relleno exterior',
  'panel.common.innerPadding': 'Relleno interior',
  'panel.common.alignment': 'Alineación',
  'panel.common.fontSize': 'Tamaño de fuente',
  'panel.common.borderRadius': 'Radio del borde',
  'panel.common.linkUrl': 'URL del enlace',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'Contenido (HTML)',
  'panel.common.displayCondition': 'Condición de visualización',
  'panel.common.insertMergeTag': 'Insertar etiqueta de combinación',
  'panel.common.tagBtn': '{ } Etiqueta',
  'panel.common.uploadImage': 'Subir imagen',
  'panel.common.left': 'Izquierda',
  'panel.common.center': 'Centro',

  // property panels — body
  'panel.body.title': 'Cuerpo del correo',
  'panel.body.contentWidth': 'Ancho del contenido',
  'panel.body.fontFamily': 'Familia de fuente',
  'panel.body.contentAlignment': 'Alineación del contenido',
  'panel.body.linkColor': 'Color de los enlaces',
  'panel.body.linkUnderline': 'Subrayar enlaces',
  'panel.body.emailName': 'Nombre del correo',
  'panel.body.previewText': 'Texto de vista previa',
  'panel.body.previewTextPlaceholder': 'Texto de vista previa del correo...',

  // property panels — text
  'panel.text.title': 'Propiedades del texto',
  'panel.text.textAlign': 'Alineación del texto',
  'panel.text.lineHeight': 'Interlineado',

  // property panels — button
  'panel.button.title': 'Propiedades del botón',
  'panel.button.buttonText': 'Texto del botón',
  'panel.button.textColor': 'Color del texto',
  'panel.button.fontWeight': 'Grosor de fuente',
  'panel.button.fontWeight.normal': 'Normal (400)',
  'panel.button.fontWeight.medium': 'Medio (500)',
  'panel.button.fontWeight.semibold': 'Seminegrita (600)',
  'panel.button.fontWeight.bold': 'Negrita (700)',
  'panel.button.border': 'Borde',
  'panel.button.borderNone': 'Ninguno',
  'panel.button.borderSolid': 'Sólido',
  'panel.button.borderDashed': 'Discontinuo',
  'panel.button.borderDotted': 'Punteado',
  'panel.button.borderWidth': 'Ancho del borde',
  'panel.button.borderColor': 'Color del borde',
  'panel.button.fullWidth': 'Ancho completo',

  // property panels — image
  'panel.image.title': 'Propiedades de la imagen',
  'panel.image.imageUrl': 'URL de la imagen',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Texto alt',
  'panel.image.altPlaceholder': 'Descripción de la imagen',
  'panel.image.width': 'Ancho (0 = auto)',

  // property panels — hero
  'panel.hero.title': 'Propiedades del encabezado principal',
  'panel.hero.backgroundUrl': 'URL del fondo',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'Posición del fondo',
  'panel.hero.mode': 'Modo',
  'panel.hero.modeFluidHeight': 'Altura fluida',
  'panel.hero.modeFixedHeight': 'Altura fija',
  'panel.hero.height': 'Altura',
  'panel.hero.width': 'Ancho',
  'panel.hero.verticalAlign': 'Alineación vertical',
  'panel.hero.verticalAlignTop': 'Arriba',
  'panel.hero.verticalAlignMiddle': 'Centro',
  'panel.hero.verticalAlignBottom': 'Abajo',

  // property panels — navbar
  'panel.navbar.title': 'Propiedades de la barra de navegación',
  'panel.navbar.links': 'Enlaces',
  'panel.navbar.linkLabel': 'Enlace',
  'panel.navbar.removeLink': 'Quitar',
  'panel.navbar.linkText': 'Texto',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ Añadir enlace',
  'panel.navbar.hamburger': 'Menú hamburguesa (móvil)',
  'panel.navbar.hamburgerShow': 'Mostrar',
  'panel.navbar.hamburgerHide': 'Ocultar',
  'panel.navbar.linkColor': 'Color del enlace',
  'panel.navbar.linkFontSize': 'Tamaño de fuente del enlace',
  'panel.navbar.linkPadding': 'Relleno del enlace',

  // property panels — divider
  'panel.divider.title': 'Propiedades del divisor',
  'panel.divider.style': 'Estilo',
  'panel.divider.styleSolid': 'Sólido',
  'panel.divider.styleDashed': 'Discontinuo',
  'panel.divider.styleDotted': 'Punteado',
  'panel.divider.color': 'Color',
  'panel.divider.width': 'Ancho',
  'panel.divider.lineWidth': 'Grosor de línea',

  // property panels — spacer
  'panel.spacer.title': 'Propiedades del espaciador',
  'panel.spacer.height': 'Altura',

  // property panels — social
  'panel.social.title': 'Propiedades de redes sociales',
  'panel.social.icons': 'Iconos',
  'panel.social.iconLabel': 'Icono',
  'panel.social.removeIcon': 'Quitar',
  'panel.social.network': 'Red',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'URL del icono',
  'panel.social.altText': 'Etiqueta (texto alt)',
  'panel.social.addIcon': '+ Añadir icono',
  'panel.social.iconSize': 'Tamaño del icono',
  'panel.social.spacing': 'Espaciado',

  // property panels — html
  'panel.html.title': 'Propiedades HTML',
  'panel.html.rawHtml': 'HTML sin formato',

  // property panels — row
  'panel.row.title': 'Propiedades de la fila',
  'panel.row.columnLayout': 'Diseño de columnas',
  'panel.row.layout1col': '1 columna',
  'panel.row.layout2col': '2 iguales',
  'panel.row.layout3col': '3 iguales',
  'panel.row.layout4col': '4 iguales',
  'panel.row.backgroundImageUrl': 'URL de la imagen de fondo',
  'panel.row.fullWidth': 'Ancho completo',
  'panel.row.displayCondition': 'Condición de visualización',
  'panel.row.repeat': 'Repetir para cada',

  // controls — color picker
  'control.color.label': 'Color',

  // controls — font picker
  'control.fontPicker.label': 'Familia de fuente',

  // controls — link type picker
  'control.linkType.ariaLabel': 'Insertar un enlace especial',
  'control.linkType.placeholder': '+ Enlace especial',
  'control.linkType.emailPrompt': 'Dirección de correo electrónico',
  'control.linkType.telPrompt': 'Número de teléfono',

  // controls — spacing input
  'control.spacing.top': 'Arriba',
  'control.spacing.right': 'Derecha',
  'control.spacing.bottom': 'Abajo',
  'control.spacing.left': 'Izquierda',
  'control.spacing.topTitle': 'Arriba (px)',
  'control.spacing.rightTitle': 'Derecha (px)',
  'control.spacing.bottomTitle': 'Abajo (px)',
  'control.spacing.leftTitle': 'Izquierda (px)',

  // controls — alignment picker
  'control.alignment.left': 'Alinear a la izquierda',
  'control.alignment.center': 'Centrar',
  'control.alignment.right': 'Alinear a la derecha',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'Buscar etiquetas...',
  'control.mergeTag.noMatches': 'No hay etiquetas coincidentes',

  // rich text bubble toolbar
  'richtext.bold': 'Negrita (Cmd+B)',
  'richtext.italic': 'Cursiva (Cmd+I)',
  'richtext.underline': 'Subrayado (Cmd+U)',
  'richtext.strike': 'Tachado',
  'richtext.code': 'Código',
  'richtext.link': 'Enlace',
  'richtext.apply': 'Aplicar',
  'richtext.removeLink': 'Quitar enlace',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
