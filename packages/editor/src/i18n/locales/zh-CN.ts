/**
 * Simplified Chinese UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': '撤销',
  'toolbar.redo': '重做',
  'toolbar.preview-device': '预览设备',
  'toolbar.desktop-view': '桌面视图',
  'toolbar.tablet-view-title': '平板视图 (768px)',
  'toolbar.tablet-view': '平板视图',
  'toolbar.mobile-view-title': '移动视图 (375px)',
  'toolbar.mobile-view': '移动视图',
  'toolbar.fullscreen': '全屏',
  'toolbar.exit-fullscreen': '退出全屏',
  'toolbar.enter-fullscreen': '进入全屏',
  'toolbar.templates': '模板',
  'toolbar.preview': '预览',
  'toolbar.export': '导出',
  'toolbar.export-format': '导出格式',
  'toolbar.export-html': '导出 HTML',
  'toolbar.export-mjml': '导出 MJML',
  'toolbar.export-json': '导出 JSON',

  // palette
  'palette.label': '组件面板',
  'palette.tab.content': '内容',
  'palette.tab.layers': '图层',
  'palette.tab.brand': '品牌',
  'palette.tab.saved': '已保存',

  // palette — layout section
  'palette.layout.section-content': '内容',
  'palette.layout.section-layout': '布局',
  'palette.layout.1-col': '1 列',
  'palette.layout.2-col': '2 列',
  'palette.layout.3-col': '3 列',
  'palette.layout.4-col': '4 列',

  // palette — brand tab
  'palette.brand.colors': '颜色',
  'palette.brand.fonts': '字体',
  'palette.brand.logos': '徽标',
  'palette.brand.add': '+ 添加',
  'palette.brand.no-colors': '暂无颜色',
  'palette.brand.no-fonts': '暂无字体',
  'palette.brand.no-logos': '暂无徽标',
  'palette.brand.color-name-label': '颜色名称',
  'palette.brand.color-value-label': '颜色值',
  'palette.brand.delete-title': '删除',
  'palette.brand.insert-logo-title': '插入徽标',

  // palette — saved tab
  'palette.saved.empty': '暂无已保存的行。使用行上的书签操作即可将其保存到此处。',
  'palette.saved.delete-title': '删除',

  // preview
  'preview.heading': '预览',
  'preview.tab-group-label': '预览格式',
  'preview.tab.preview': '预览',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': '桌面预览',
  'preview.device.mobile': '移动预览',
  'preview.close': '关闭预览',
  'preview.loading': '正在渲染...',

  // template picker
  'template.heading': '模板',
  'template.close': '关闭',
  'template.section.choose': '选择模板',
  'template.empty': '暂无可用模板。',
  'template.section.save': '将当前内容保存为模板',
  'template.field.name': '名称',
  'template.field.name-placeholder': '我的模板',
  'template.field.category': '类别',
  'template.field.description': '描述 (可选)',
  'template.field.description-placeholder': '此模板的用途是什么?',
  'template.cancel': '取消',
  'template.save': '保存模板',
  'template.error.name-required': '名称为必填项',

  // asset manager
  'asset.title': '选择素材',
  'asset.title-upload': '选择图片',
  'asset.close': '关闭',
  'asset.tab.library': '素材库',
  'asset.tab.upload': '上传',
  'asset.folder.all': '所有文件夹',
  'asset.search': '搜索素材',
  'asset.tag-filter-label': '按标签筛选',
  'asset.loading': '正在加载…',
  'asset.empty.filtered': '没有符合筛选条件的素材。',
  'asset.empty.no-assets': '暂无已保存的素材。上传一个即可开始。',
  'asset.drop-zone.label': '将图片拖放到此处',
  'asset.drop-zone.hint': '或点击浏览',
  'asset.url.separator': '或输入 URL',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': '使用 URL',

  // asset manager — stock tab
  'asset.tab.stock': '图库',
  'asset.stock.search': '搜索免费照片…',
  'asset.stock.idle': '在 Unsplash 和 Pexels 上搜索免费照片。',
  'asset.stock.empty': '未找到照片。请尝试其他搜索词。',
  'asset.stock.load-more': '加载更多',
  'asset.stock.photo-by': '摄影:',
  'asset.stock.on': '来自',
  'asset.stock.error': '无法加载照片。请检查 API 密钥或重试。',
  'asset.stock.rate-limited': '已达到速率限制。请稍后重试。',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': '背景颜色',
  'panel.common.padding': '内边距',
  'panel.common.outerPadding': '外部内边距',
  'panel.common.innerPadding': '内部内边距',
  'panel.common.alignment': '对齐',
  'panel.common.fontSize': '字号',
  'panel.common.borderRadius': '圆角',
  'panel.common.linkUrl': '链接 URL',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': '内容 (HTML)',
  'panel.common.insertMergeTag': '插入合并标签',
  'panel.common.tagBtn': '{ } 标签',
  'panel.common.uploadImage': '上传图片',
  'panel.common.left': '左',
  'panel.common.center': '居中',

  // property panels — body
  'panel.body.title': '邮件正文',
  'panel.body.contentWidth': '内容宽度',
  'panel.body.fontFamily': '字体',
  'panel.body.contentAlignment': '内容对齐',
  'panel.body.emailName': '邮件名称',
  'panel.body.previewText': '预览文本',
  'panel.body.previewTextPlaceholder': '邮件预览文本...',

  // property panels — text
  'panel.text.title': '文本属性',
  'panel.text.textAlign': '文本对齐',
  'panel.text.lineHeight': '行高',

  // property panels — button
  'panel.button.title': '按钮属性',
  'panel.button.buttonText': '按钮文本',
  'panel.button.textColor': '文本颜色',
  'panel.button.fontWeight': '字重',
  'panel.button.fontWeight.normal': '常规 (400)',
  'panel.button.fontWeight.medium': '中等 (500)',
  'panel.button.fontWeight.semibold': '半粗 (600)',
  'panel.button.fontWeight.bold': '粗体 (700)',
  'panel.button.fullWidth': '全宽',

  // property panels — image
  'panel.image.title': '图片属性',
  'panel.image.imageUrl': '图片 URL',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': '替代文本 (alt)',
  'panel.image.altPlaceholder': '图片描述',
  'panel.image.width': '宽度 (0 = 自动)',

  // property panels — hero
  'panel.hero.title': '主视觉属性',
  'panel.hero.backgroundUrl': '背景 URL',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': '背景位置',
  'panel.hero.mode': '模式',
  'panel.hero.modeFluidHeight': '自适应高度',
  'panel.hero.modeFixedHeight': '固定高度',
  'panel.hero.height': '高度',
  'panel.hero.width': '宽度',
  'panel.hero.verticalAlign': '垂直对齐',
  'panel.hero.verticalAlignTop': '顶部',
  'panel.hero.verticalAlignMiddle': '居中',
  'panel.hero.verticalAlignBottom': '底部',

  // property panels — navbar
  'panel.navbar.title': '导航栏属性',
  'panel.navbar.links': '链接',
  'panel.navbar.linkLabel': '链接',
  'panel.navbar.removeLink': '移除',
  'panel.navbar.linkText': '文本',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ 添加链接',
  'panel.navbar.hamburger': '汉堡菜单 (移动端)',
  'panel.navbar.hamburgerShow': '显示',
  'panel.navbar.hamburgerHide': '隐藏',
  'panel.navbar.linkColor': '链接颜色',
  'panel.navbar.linkFontSize': '链接字号',
  'panel.navbar.linkPadding': '链接内边距',

  // property panels — divider
  'panel.divider.title': '分隔线属性',
  'panel.divider.style': '样式',
  'panel.divider.styleSolid': '实线',
  'panel.divider.styleDashed': '虚线',
  'panel.divider.styleDotted': '点线',
  'panel.divider.color': '颜色',
  'panel.divider.width': '宽度',
  'panel.divider.lineWidth': '线宽',

  // property panels — spacer
  'panel.spacer.title': '间隔属性',
  'panel.spacer.height': '高度',

  // property panels — social
  'panel.social.title': '社交属性',
  'panel.social.icons': '图标',
  'panel.social.iconLabel': '图标',
  'panel.social.removeIcon': '移除',
  'panel.social.network': '网络',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': '图标 URL',
  'panel.social.altText': '标签 (alt 文本)',
  'panel.social.addIcon': '+ 添加图标',
  'panel.social.iconSize': '图标大小',
  'panel.social.spacing': '间距',

  // property panels — html
  'panel.html.title': 'HTML 属性',
  'panel.html.rawHtml': '原始 HTML',

  // property panels — row
  'panel.row.title': '行属性',
  'panel.row.columnLayout': '列布局',
  'panel.row.layout1col': '1 列',
  'panel.row.layout2col': '2 等分',
  'panel.row.layout3col': '3 等分',
  'panel.row.layout4col': '4 等分',
  'panel.row.backgroundImageUrl': '背景图片 URL',
  'panel.row.fullWidth': '全宽',
  'panel.row.displayCondition': '显示条件',

  // controls — color picker
  'control.color.label': '颜色',

  // controls — font picker
  'control.fontPicker.label': '字体',

  // controls — link type picker
  'control.linkType.ariaLabel': '插入特殊链接',
  'control.linkType.placeholder': '+ 特殊链接',
  'control.linkType.emailPrompt': '电子邮件地址',
  'control.linkType.telPrompt': '电话号码',

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
  'control.alignment.left': '左对齐',
  'control.alignment.center': '居中对齐',
  'control.alignment.right': '右对齐',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': '搜索标签...',
  'control.mergeTag.noMatches': '没有匹配的标签',

  // rich text bubble toolbar
  'richtext.bold': '粗体 (Cmd+B)',
  'richtext.italic': '斜体 (Cmd+I)',
  'richtext.underline': '下划线 (Cmd+U)',
  'richtext.strike': '删除线',
  'richtext.code': '代码',
  'richtext.link': '链接',
  'richtext.apply': '应用',
  'richtext.removeLink': '移除链接',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
