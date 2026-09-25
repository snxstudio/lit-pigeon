/**
 * Japanese UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': '元に戻す',
  'toolbar.redo': 'やり直す',
  'toolbar.preview-device': 'プレビューデバイス',
  'toolbar.desktop-view': 'デスクトップ表示',
  'toolbar.tablet-view-title': 'タブレット表示 (768px)',
  'toolbar.tablet-view': 'タブレット表示',
  'toolbar.mobile-view-title': 'モバイル表示 (375px)',
  'toolbar.mobile-view': 'モバイル表示',
  'toolbar.fullscreen': '全画面表示',
  'toolbar.exit-fullscreen': '全画面表示を終了',
  'toolbar.enter-fullscreen': '全画面表示にする',
  'toolbar.templates': 'テンプレート',
  'toolbar.preview': 'プレビュー',
  'toolbar.export': 'エクスポート',
  'toolbar.export-format': 'エクスポート形式',
  'toolbar.export-html': 'HTML をエクスポート',
  'toolbar.export-mjml': 'MJML をエクスポート',
  'toolbar.export-json': 'JSON をエクスポート',

  // palette
  'palette.label': 'パレット',
  'palette.tab.content': 'コンテンツ',
  'palette.tab.layers': 'レイヤー',
  'palette.tab.brand': 'ブランド',
  'palette.tab.saved': '保存済み',

  // palette — layout section
  'palette.layout.section-content': 'コンテンツ',
  'palette.layout.section-layout': 'レイアウト',
  'palette.layout.1-col': '1 列',
  'palette.layout.2-col': '2 列',
  'palette.layout.3-col': '3 列',
  'palette.layout.4-col': '4 列',

  // palette — brand tab
  'palette.brand.colors': 'カラー',
  'palette.brand.fonts': 'フォント',
  'palette.brand.logos': 'ロゴ',
  'palette.brand.add': '+ 追加',
  'palette.brand.no-colors': 'カラーはまだありません',
  'palette.brand.no-fonts': 'フォントはまだありません',
  'palette.brand.no-logos': 'ロゴはまだありません',
  'palette.brand.color-name-label': 'カラー名',
  'palette.brand.color-value-label': 'カラー値',
  'palette.brand.delete-title': '削除',
  'palette.brand.insert-logo-title': 'ロゴを挿入',

  // palette — saved tab
  'palette.saved.empty': '保存済みの行はまだありません。行のブックマーク操作を使うと、ここに保存できます。',
  'palette.saved.delete-title': '削除',

  // preview
  'preview.heading': 'プレビュー',
  'preview.tab-group-label': 'プレビュー形式',
  'preview.tab.preview': 'プレビュー',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'デスクトップのプレビュー',
  'preview.device.mobile': 'モバイルのプレビュー',
  'preview.close': 'プレビューを閉じる',
  'preview.loading': 'レンダリング中...',

  // template picker
  'template.heading': 'テンプレート',
  'template.close': '閉じる',
  'template.section.choose': 'テンプレートを選択',
  'template.empty': '利用できるテンプレートはまだありません。',
  'template.section.save': '現在の内容をテンプレートとして保存',
  'template.field.name': '名前',
  'template.field.name-placeholder': 'マイテンプレート',
  'template.field.category': 'カテゴリ',
  'template.field.description': '説明 (任意)',
  'template.field.description-placeholder': 'このテンプレートの用途は?',
  'template.cancel': 'キャンセル',
  'template.save': 'テンプレートを保存',
  'template.error.name-required': '名前は必須です',

  // asset manager
  'asset.title': 'アセットを選択',
  'asset.title-upload': '画像を選択',
  'asset.close': '閉じる',
  'asset.tab.library': 'ライブラリ',
  'asset.tab.upload': 'アップロード',
  'asset.folder.all': 'すべてのフォルダー',
  'asset.search': 'アセットを検索',
  'asset.tag-filter-label': 'タグで絞り込み',
  'asset.loading': '読み込み中…',
  'asset.empty.filtered': 'フィルターに一致するアセットはありません。',
  'asset.empty.no-assets': '保存済みのアセットはまだありません。まずはアップロードしてください。',
  'asset.drop-zone.label': 'ここに画像をドラッグ&ドロップ',
  'asset.drop-zone.hint': 'またはクリックして参照',
  'asset.url.separator': 'または URL を入力',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'URL を使用',

  // asset manager — stock tab
  'asset.tab.stock': 'ストック',
  'asset.stock.search': '無料写真を検索…',
  'asset.stock.idle': 'Unsplash と Pexels で無料写真を検索します。',
  'asset.stock.empty': '写真が見つかりません。別のキーワードで検索してください。',
  'asset.stock.load-more': 'さらに読み込む',
  'asset.stock.photo-by': '撮影:',
  'asset.stock.on': '/',
  'asset.stock.error': '写真を読み込めませんでした。API キーを確認するか、もう一度お試しください。',
  'asset.stock.rate-limited': 'レート制限に達しました。しばらくしてからもう一度お試しください。',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': '背景色',
  'panel.common.padding': '余白',
  'panel.common.outerPadding': '外側の余白',
  'panel.common.innerPadding': '内側の余白',
  'panel.common.alignment': '配置',
  'panel.common.fontSize': 'フォントサイズ',
  'panel.common.borderRadius': '角の丸み',
  'panel.common.linkUrl': 'リンク URL',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'コンテンツ (HTML)',
  'panel.common.displayCondition': '表示条件',
  'panel.common.insertMergeTag': '差し込みタグを挿入',
  'panel.common.tagBtn': '{ } タグ',
  'panel.common.uploadImage': '画像をアップロード',
  'panel.common.left': '左',
  'panel.common.center': '中央',

  // property panels — body
  'panel.body.title': 'メール本文',
  'panel.body.contentWidth': 'コンテンツ幅',
  'panel.body.fontFamily': 'フォントファミリー',
  'panel.body.contentAlignment': 'コンテンツの配置',
  'panel.body.emailName': 'メール名',
  'panel.body.previewText': 'プレビューテキスト',
  'panel.body.previewTextPlaceholder': 'メールのプレビューテキスト...',
  'panel.body.language': '言語',
  'panel.body.languagePlaceholder': '例: en, pt-BR',
  'panel.body.textDirection': '文字方向',
  'panel.body.directionAuto': '自動',
  'panel.body.directionLtr': '左から右',
  'panel.body.directionRtl': '右から左',

  // property panels — text
  'panel.text.title': 'テキストのプロパティ',
  'panel.text.textAlign': 'テキストの配置',
  'panel.text.lineHeight': '行の高さ',

  // property panels — button
  'panel.button.title': 'ボタンのプロパティ',
  'panel.button.buttonText': 'ボタンのテキスト',
  'panel.button.textColor': '文字色',
  'panel.button.fontWeight': 'フォントの太さ',
  'panel.button.fontWeight.normal': '標準 (400)',
  'panel.button.fontWeight.medium': 'ミディアム (500)',
  'panel.button.fontWeight.semibold': 'セミボールド (600)',
  'panel.button.fontWeight.bold': '太字 (700)',
  'panel.button.fullWidth': '全幅',

  // property panels — image
  'panel.image.title': '画像のプロパティ',
  'panel.image.imageUrl': '画像 URL',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': '代替テキスト (alt)',
  'panel.image.altPlaceholder': '画像の説明',
  'panel.image.width': '幅 (0 = 自動)',

  // property panels — hero
  'panel.hero.title': 'ヒーローのプロパティ',
  'panel.hero.backgroundUrl': '背景 URL',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': '背景の位置',
  'panel.hero.mode': 'モード',
  'panel.hero.modeFluidHeight': '可変の高さ',
  'panel.hero.modeFixedHeight': '固定の高さ',
  'panel.hero.height': '高さ',
  'panel.hero.width': '幅',
  'panel.hero.verticalAlign': '垂直方向の配置',
  'panel.hero.verticalAlignTop': '上',
  'panel.hero.verticalAlignMiddle': '中央',
  'panel.hero.verticalAlignBottom': '下',

  // property panels — navbar
  'panel.navbar.title': 'ナビゲーションバーのプロパティ',
  'panel.navbar.links': 'リンク',
  'panel.navbar.linkLabel': 'リンク',
  'panel.navbar.removeLink': '削除',
  'panel.navbar.linkText': 'テキスト',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ リンクを追加',
  'panel.navbar.hamburger': 'ハンバーガーメニュー (モバイル)',
  'panel.navbar.hamburgerShow': '表示',
  'panel.navbar.hamburgerHide': '非表示',
  'panel.navbar.linkColor': 'リンクの色',
  'panel.navbar.linkFontSize': 'リンクのフォントサイズ',
  'panel.navbar.linkPadding': 'リンクの余白',

  // property panels — divider
  'panel.divider.title': '区切り線のプロパティ',
  'panel.divider.style': 'スタイル',
  'panel.divider.styleSolid': '実線',
  'panel.divider.styleDashed': '破線',
  'panel.divider.styleDotted': '点線',
  'panel.divider.color': '色',
  'panel.divider.width': '幅',
  'panel.divider.lineWidth': '線の太さ',

  // property panels — spacer
  'panel.spacer.title': 'スペーサーのプロパティ',
  'panel.spacer.height': '高さ',

  // property panels — social
  'panel.social.title': 'ソーシャルのプロパティ',
  'panel.social.icons': 'アイコン',
  'panel.social.iconLabel': 'アイコン',
  'panel.social.removeIcon': '削除',
  'panel.social.network': 'ネットワーク',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'アイコン URL',
  'panel.social.altText': 'ラベル (alt テキスト)',
  'panel.social.addIcon': '+ アイコンを追加',
  'panel.social.iconSize': 'アイコンサイズ',
  'panel.social.spacing': '間隔',

  // property panels — html
  'panel.html.title': 'HTML のプロパティ',
  'panel.html.rawHtml': '生の HTML',

  // property panels — row
  'panel.row.title': '行のプロパティ',
  'panel.row.columnLayout': '列レイアウト',
  'panel.row.layout1col': '1 列',
  'panel.row.layout2col': '2 等分',
  'panel.row.layout3col': '3 等分',
  'panel.row.layout4col': '4 等分',
  'panel.row.backgroundImageUrl': '背景画像 URL',
  'panel.row.fullWidth': '全幅',
  'panel.row.displayCondition': '表示条件',
  'panel.row.repeat': '各項目で繰り返す',

  // controls — color picker
  'control.color.label': '色',

  // controls — font picker
  'control.fontPicker.label': 'フォントファミリー',

  // controls — link type picker
  'control.linkType.ariaLabel': '特殊リンクを挿入',
  'control.linkType.placeholder': '+ 特殊リンク',
  'control.linkType.emailPrompt': 'メールアドレス',
  'control.linkType.telPrompt': '電話番号',

  // controls — spacing input
  'control.spacing.top': '上',
  'control.spacing.right': '右',
  'control.spacing.bottom': '下',
  'control.spacing.left': '左',
  'control.spacing.topTitle': '上 (px)',
  'control.spacing.rightTitle': '右 (px)',
  'control.spacing.bottomTitle': '下 (px)',
  'control.spacing.leftTitle': '左 (px)',

  // controls — alignment picker
  'control.alignment.left': '左揃え',
  'control.alignment.center': '中央揃え',
  'control.alignment.right': '右揃え',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'タグを検索...',
  'control.mergeTag.noMatches': '一致するタグはありません',

  // rich text bubble toolbar
  'richtext.bold': '太字 (Cmd+B)',
  'richtext.italic': '斜体 (Cmd+I)',
  'richtext.underline': '下線 (Cmd+U)',
  'richtext.strike': '取り消し線',
  'richtext.code': 'コード',
  'richtext.link': 'リンク',
  'richtext.apply': '適用',
  'richtext.removeLink': 'リンクを削除',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
