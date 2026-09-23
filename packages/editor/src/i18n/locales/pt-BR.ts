/**
 * Brazilian Portuguese UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'Desfazer',
  'toolbar.redo': 'Refazer',
  'toolbar.preview-device': 'Dispositivo de visualização',
  'toolbar.desktop-view': 'Visualização desktop',
  'toolbar.tablet-view-title': 'Visualização tablet (768px)',
  'toolbar.tablet-view': 'Visualização tablet',
  'toolbar.mobile-view-title': 'Visualização celular (375px)',
  'toolbar.mobile-view': 'Visualização celular',
  'toolbar.fullscreen': 'Tela cheia',
  'toolbar.exit-fullscreen': 'Sair da tela cheia',
  'toolbar.enter-fullscreen': 'Entrar em tela cheia',
  'toolbar.templates': 'Modelos',
  'toolbar.preview': 'Visualizar',
  'toolbar.export': 'Exportar',
  'toolbar.export-format': 'Formato de exportação',
  'toolbar.export-html': 'Exportar HTML',
  'toolbar.export-mjml': 'Exportar MJML',
  'toolbar.export-json': 'Exportar JSON',

  // palette
  'palette.label': 'Paleta',
  'palette.tab.content': 'Conteúdo',
  'palette.tab.layers': 'Camadas',
  'palette.tab.brand': 'Marca',
  'palette.tab.saved': 'Salvos',

  // palette — layout section
  'palette.layout.section-content': 'Conteúdo',
  'palette.layout.section-layout': 'Layout',
  'palette.layout.1-col': '1 coluna',
  'palette.layout.2-col': '2 colunas',
  'palette.layout.3-col': '3 colunas',
  'palette.layout.4-col': '4 colunas',

  // palette — brand tab
  'palette.brand.colors': 'Cores',
  'palette.brand.fonts': 'Fontes',
  'palette.brand.logos': 'Logotipos',
  'palette.brand.add': '+ Adicionar',
  'palette.brand.no-colors': 'Nenhuma cor ainda',
  'palette.brand.no-fonts': 'Nenhuma fonte ainda',
  'palette.brand.no-logos': 'Nenhum logotipo ainda',
  'palette.brand.color-name-label': 'Nome da cor',
  'palette.brand.color-value-label': 'Valor da cor',
  'palette.brand.delete-title': 'Excluir',
  'palette.brand.insert-logo-title': 'Inserir logotipo',

  // palette — saved tab
  'palette.saved.empty': 'Nenhuma linha salva ainda. Use a ação de favorito em uma linha para salvá-la aqui.',
  'palette.saved.delete-title': 'Excluir',

  // preview
  'preview.heading': 'Visualização',
  'preview.tab-group-label': 'Formato de visualização',
  'preview.tab.preview': 'Visualização',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'Visualização desktop',
  'preview.device.mobile': 'Visualização celular',
  'preview.close': 'Fechar visualização',
  'preview.loading': 'Renderizando...',

  // template picker
  'template.heading': 'Modelos',
  'template.close': 'Fechar',
  'template.section.choose': 'Escolha um modelo',
  'template.empty': 'Nenhum modelo disponível ainda.',
  'template.section.save': 'Salvar atual como modelo',
  'template.field.name': 'Nome',
  'template.field.name-placeholder': 'Meu modelo',
  'template.field.category': 'Categoria',
  'template.field.description': 'Descrição (opcional)',
  'template.field.description-placeholder': 'Para que serve este modelo?',
  'template.cancel': 'Cancelar',
  'template.save': 'Salvar modelo',
  'template.error.name-required': 'O nome é obrigatório',

  // asset manager
  'asset.title': 'Selecionar arquivo',
  'asset.title-upload': 'Selecionar imagem',
  'asset.close': 'Fechar',
  'asset.tab.library': 'Biblioteca',
  'asset.tab.upload': 'Enviar',
  'asset.folder.all': 'Todas as pastas',
  'asset.search': 'Pesquisar arquivos',
  'asset.tag-filter-label': 'Filtrar por tag',
  'asset.loading': 'Carregando…',
  'asset.empty.filtered': 'Nenhum arquivo corresponde aos filtros.',
  'asset.empty.no-assets': 'Nenhum arquivo salvo ainda. Envie um para começar.',
  'asset.drop-zone.label': 'Arraste e solte uma imagem aqui',
  'asset.drop-zone.hint': 'ou clique para procurar',
  'asset.url.separator': 'ou insira a URL',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'Usar URL',

  // asset manager — stock tab
  'asset.tab.stock': 'Banco de imagens',
  'asset.stock.search': 'Pesquisar fotos gratuitas…',
  'asset.stock.idle': 'Pesquise fotos gratuitas no Unsplash e no Pexels.',
  'asset.stock.empty': 'Nenhuma foto encontrada. Tente outra pesquisa.',
  'asset.stock.load-more': 'Carregar mais',
  'asset.stock.photo-by': 'Foto de',
  'asset.stock.on': 'no',
  'asset.stock.error': 'Não foi possível carregar as fotos. Verifique a chave de API ou tente novamente.',
  'asset.stock.rate-limited': 'Limite de requisições atingido. Tente novamente em breve.',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'Cor de fundo',
  'panel.common.padding': 'Espaçamento interno',
  'panel.common.outerPadding': 'Espaçamento externo',
  'panel.common.innerPadding': 'Espaçamento interno',
  'panel.common.alignment': 'Alinhamento',
  'panel.common.fontSize': 'Tamanho da fonte',
  'panel.common.borderRadius': 'Raio da borda',
  'panel.common.linkUrl': 'URL do link',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'Conteúdo (HTML)',
  'panel.common.insertMergeTag': 'Inserir tag de mesclagem',
  'panel.common.tagBtn': '{ } Tag',
  'panel.common.uploadImage': 'Enviar imagem',
  'panel.common.left': 'Esquerda',
  'panel.common.center': 'Centro',

  // property panels — body
  'panel.body.title': 'Corpo do e-mail',
  'panel.body.contentWidth': 'Largura do conteúdo',
  'panel.body.fontFamily': 'Família da fonte',
  'panel.body.contentAlignment': 'Alinhamento do conteúdo',
  'panel.body.emailName': 'Nome do e-mail',
  'panel.body.previewText': 'Texto de pré-visualização',
  'panel.body.previewTextPlaceholder': 'Texto de pré-visualização do e-mail...',

  // property panels — text
  'panel.text.title': 'Propriedades do texto',
  'panel.text.textAlign': 'Alinhamento do texto',
  'panel.text.lineHeight': 'Altura da linha',

  // property panels — button
  'panel.button.title': 'Propriedades do botão',
  'panel.button.buttonText': 'Texto do botão',
  'panel.button.textColor': 'Cor do texto',
  'panel.button.fontWeight': 'Peso da fonte',
  'panel.button.fontWeight.normal': 'Normal (400)',
  'panel.button.fontWeight.medium': 'Médio (500)',
  'panel.button.fontWeight.semibold': 'Seminegrito (600)',
  'panel.button.fontWeight.bold': 'Negrito (700)',
  'panel.button.fullWidth': 'Largura total',

  // property panels — image
  'panel.image.title': 'Propriedades da imagem',
  'panel.image.imageUrl': 'URL da imagem',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Texto alt',
  'panel.image.altPlaceholder': 'Descrição da imagem',
  'panel.image.width': 'Largura (0 = auto)',

  // property panels — hero
  'panel.hero.title': 'Propriedades do banner',
  'panel.hero.backgroundUrl': 'URL do fundo',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'Posição do fundo',
  'panel.hero.mode': 'Modo',
  'panel.hero.modeFluidHeight': 'Altura fluida',
  'panel.hero.modeFixedHeight': 'Altura fixa',
  'panel.hero.height': 'Altura',
  'panel.hero.width': 'Largura',
  'panel.hero.verticalAlign': 'Alinhamento vertical',
  'panel.hero.verticalAlignTop': 'Topo',
  'panel.hero.verticalAlignMiddle': 'Meio',
  'panel.hero.verticalAlignBottom': 'Base',

  // property panels — navbar
  'panel.navbar.title': 'Propriedades da barra de navegação',
  'panel.navbar.links': 'Links',
  'panel.navbar.linkLabel': 'Link',
  'panel.navbar.removeLink': 'Remover',
  'panel.navbar.linkText': 'Texto',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ Adicionar link',
  'panel.navbar.hamburger': 'Menu hambúrguer (celular)',
  'panel.navbar.hamburgerShow': 'Mostrar',
  'panel.navbar.hamburgerHide': 'Ocultar',
  'panel.navbar.linkColor': 'Cor do link',
  'panel.navbar.linkFontSize': 'Tamanho da fonte do link',
  'panel.navbar.linkPadding': 'Espaçamento do link',

  // property panels — divider
  'panel.divider.title': 'Propriedades do divisor',
  'panel.divider.style': 'Estilo',
  'panel.divider.styleSolid': 'Sólido',
  'panel.divider.styleDashed': 'Tracejado',
  'panel.divider.styleDotted': 'Pontilhado',
  'panel.divider.color': 'Cor',
  'panel.divider.width': 'Largura',
  'panel.divider.lineWidth': 'Espessura da linha',

  // property panels — spacer
  'panel.spacer.title': 'Propriedades do espaçador',
  'panel.spacer.height': 'Altura',

  // property panels — social
  'panel.social.title': 'Propriedades das redes sociais',
  'panel.social.icons': 'Ícones',
  'panel.social.iconLabel': 'Ícone',
  'panel.social.removeIcon': 'Remover',
  'panel.social.network': 'Rede',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'URL do ícone',
  'panel.social.altText': 'Rótulo (texto alt)',
  'panel.social.addIcon': '+ Adicionar ícone',
  'panel.social.iconSize': 'Tamanho do ícone',
  'panel.social.spacing': 'Espaçamento',

  // property panels — html
  'panel.html.title': 'Propriedades do HTML',
  'panel.html.rawHtml': 'HTML bruto',

  // property panels — row
  'panel.row.title': 'Propriedades da linha',
  'panel.row.columnLayout': 'Layout das colunas',
  'panel.row.layout1col': '1 coluna',
  'panel.row.layout2col': '2 iguais',
  'panel.row.layout3col': '3 iguais',
  'panel.row.layout4col': '4 iguais',
  'panel.row.backgroundImageUrl': 'URL da imagem de fundo',
  'panel.row.fullWidth': 'Largura total',
  'panel.row.displayCondition': 'Condição de exibição',

  // controls — color picker
  'control.color.label': 'Cor',

  // controls — font picker
  'control.fontPicker.label': 'Família da fonte',

  // controls — link type picker
  'control.linkType.ariaLabel': 'Inserir um link especial',
  'control.linkType.placeholder': '+ Link especial',
  'control.linkType.emailPrompt': 'Endereço de e-mail',
  'control.linkType.telPrompt': 'Número de telefone',

  // controls — spacing input
  'control.spacing.top': 'Superior',
  'control.spacing.right': 'Direita',
  'control.spacing.bottom': 'Inferior',
  'control.spacing.left': 'Esquerda',
  'control.spacing.topTitle': 'Superior (px)',
  'control.spacing.rightTitle': 'Direita (px)',
  'control.spacing.bottomTitle': 'Inferior (px)',
  'control.spacing.leftTitle': 'Esquerda (px)',

  // controls — alignment picker
  'control.alignment.left': 'Alinhar à esquerda',
  'control.alignment.center': 'Centralizar',
  'control.alignment.right': 'Alinhar à direita',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'Pesquisar tags...',
  'control.mergeTag.noMatches': 'Nenhuma tag correspondente',

  // rich text bubble toolbar
  'richtext.bold': 'Negrito (Cmd+B)',
  'richtext.italic': 'Itálico (Cmd+I)',
  'richtext.underline': 'Sublinhado (Cmd+U)',
  'richtext.strike': 'Tachado',
  'richtext.code': 'Código',
  'richtext.link': 'Link',
  'richtext.apply': 'Aplicar',
  'richtext.removeLink': 'Remover link',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
