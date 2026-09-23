/**
 * Arabic UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'تراجع',
  'toolbar.redo': 'إعادة',
  'toolbar.preview-device': 'جهاز المعاينة',
  'toolbar.desktop-view': 'عرض سطح المكتب',
  'toolbar.tablet-view-title': 'عرض الجهاز اللوحي (768px)',
  'toolbar.tablet-view': 'عرض الجهاز اللوحي',
  'toolbar.mobile-view-title': 'عرض الجوال (375px)',
  'toolbar.mobile-view': 'عرض الجوال',
  'toolbar.fullscreen': 'ملء الشاشة',
  'toolbar.exit-fullscreen': 'الخروج من ملء الشاشة',
  'toolbar.enter-fullscreen': 'الدخول إلى ملء الشاشة',
  'toolbar.templates': 'القوالب',
  'toolbar.preview': 'معاينة',
  'toolbar.export': 'تصدير',
  'toolbar.export-format': 'صيغة التصدير',
  'toolbar.export-html': 'تصدير HTML',
  'toolbar.export-mjml': 'تصدير MJML',
  'toolbar.export-json': 'تصدير JSON',

  // palette
  'palette.label': 'لوحة العناصر',
  'palette.tab.content': 'المحتوى',
  'palette.tab.layers': 'الطبقات',
  'palette.tab.brand': 'العلامة التجارية',
  'palette.tab.saved': 'المحفوظات',

  // palette — layout section
  'palette.layout.section-content': 'المحتوى',
  'palette.layout.section-layout': 'التخطيط',
  'palette.layout.1-col': 'عمود واحد',
  'palette.layout.2-col': 'عمودان',
  'palette.layout.3-col': '3 أعمدة',
  'palette.layout.4-col': '4 أعمدة',

  // palette — brand tab
  'palette.brand.colors': 'الألوان',
  'palette.brand.fonts': 'الخطوط',
  'palette.brand.logos': 'الشعارات',
  'palette.brand.add': '+ إضافة',
  'palette.brand.no-colors': 'لا توجد ألوان بعد',
  'palette.brand.no-fonts': 'لا توجد خطوط بعد',
  'palette.brand.no-logos': 'لا توجد شعارات بعد',
  'palette.brand.color-name-label': 'اسم اللون',
  'palette.brand.color-value-label': 'قيمة اللون',
  'palette.brand.delete-title': 'حذف',
  'palette.brand.insert-logo-title': 'إدراج شعار',

  // palette — saved tab
  'palette.saved.empty': 'لا توجد صفوف محفوظة بعد. استخدم إجراء الإشارة المرجعية على صف لحفظه هنا.',
  'palette.saved.delete-title': 'حذف',

  // preview
  'preview.heading': 'معاينة',
  'preview.tab-group-label': 'صيغة المعاينة',
  'preview.tab.preview': 'معاينة',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'معاينة سطح المكتب',
  'preview.device.mobile': 'معاينة الجوال',
  'preview.close': 'إغلاق المعاينة',
  'preview.loading': 'جارٍ العرض...',

  // template picker
  'template.heading': 'القوالب',
  'template.close': 'إغلاق',
  'template.section.choose': 'اختر قالبًا',
  'template.empty': 'لا توجد قوالب متاحة بعد.',
  'template.section.save': 'حفظ الحالي كقالب',
  'template.field.name': 'الاسم',
  'template.field.name-placeholder': 'قالبي',
  'template.field.category': 'الفئة',
  'template.field.description': 'الوصف (اختياري)',
  'template.field.description-placeholder': 'ما الغرض من هذا القالب؟',
  'template.cancel': 'إلغاء',
  'template.save': 'حفظ القالب',
  'template.error.name-required': 'الاسم مطلوب',

  // asset manager
  'asset.title': 'اختيار ملف وسائط',
  'asset.title-upload': 'اختيار صورة',
  'asset.close': 'إغلاق',
  'asset.tab.library': 'المكتبة',
  'asset.tab.upload': 'رفع',
  'asset.folder.all': 'كل المجلدات',
  'asset.search': 'البحث في الوسائط',
  'asset.tag-filter-label': 'تصفية حسب الوسم',
  'asset.loading': 'جارٍ التحميل…',
  'asset.empty.filtered': 'لا توجد وسائط تطابق عوامل التصفية.',
  'asset.empty.no-assets': 'لا توجد وسائط محفوظة بعد. ارفع ملفًا للبدء.',
  'asset.drop-zone.label': 'اسحب صورة وأفلتها هنا',
  'asset.drop-zone.hint': 'أو انقر للاستعراض',
  'asset.url.separator': 'أو أدخل URL',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'استخدام URL',

  // asset manager — stock tab
  'asset.tab.stock': 'صور مجانية',
  'asset.stock.search': 'ابحث عن صور مجانية…',
  'asset.stock.idle': 'ابحث في Unsplash وPexels عن صور مجانية.',
  'asset.stock.empty': 'لم يتم العثور على صور. جرّب بحثًا آخر.',
  'asset.stock.load-more': 'تحميل المزيد',
  'asset.stock.photo-by': 'صورة بواسطة',
  'asset.stock.on': 'على',
  'asset.stock.error': 'تعذّر تحميل الصور. تحقق من مفتاح API أو حاول مرة أخرى.',
  'asset.stock.rate-limited': 'تم بلوغ حد الطلبات. حاول مرة أخرى بعد قليل.',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'لون الخلفية',
  'panel.common.padding': 'الحشو',
  'panel.common.outerPadding': 'الحشو الخارجي',
  'panel.common.innerPadding': 'الحشو الداخلي',
  'panel.common.alignment': 'المحاذاة',
  'panel.common.fontSize': 'حجم الخط',
  'panel.common.borderRadius': 'استدارة الحواف',
  'panel.common.linkUrl': 'URL الرابط',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'المحتوى (HTML)',
  'panel.common.insertMergeTag': 'إدراج وسم دمج',
  'panel.common.tagBtn': '{ } وسم',
  'panel.common.uploadImage': 'رفع صورة',
  'panel.common.left': 'يسار',
  'panel.common.center': 'وسط',

  // property panels — body
  'panel.body.title': 'نص الرسالة',
  'panel.body.contentWidth': 'عرض المحتوى',
  'panel.body.fontFamily': 'عائلة الخط',
  'panel.body.contentAlignment': 'محاذاة المحتوى',
  'panel.body.emailName': 'اسم الرسالة',
  'panel.body.previewText': 'نص المعاينة',
  'panel.body.previewTextPlaceholder': 'نص معاينة الرسالة...',

  // property panels — text
  'panel.text.title': 'خصائص النص',
  'panel.text.textAlign': 'محاذاة النص',
  'panel.text.lineHeight': 'ارتفاع السطر',

  // property panels — button
  'panel.button.title': 'خصائص الزر',
  'panel.button.buttonText': 'نص الزر',
  'panel.button.textColor': 'لون النص',
  'panel.button.fontWeight': 'سُمك الخط',
  'panel.button.fontWeight.normal': 'عادي (400)',
  'panel.button.fontWeight.medium': 'متوسط (500)',
  'panel.button.fontWeight.semibold': 'شبه عريض (600)',
  'panel.button.fontWeight.bold': 'عريض (700)',
  'panel.button.fullWidth': 'العرض الكامل',

  // property panels — image
  'panel.image.title': 'خصائص الصورة',
  'panel.image.imageUrl': 'URL الصورة',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'النص البديل (alt)',
  'panel.image.altPlaceholder': 'وصف الصورة',
  'panel.image.width': 'العرض (0 = تلقائي)',

  // property panels — hero
  'panel.hero.title': 'خصائص القسم الرئيسي',
  'panel.hero.backgroundUrl': 'URL الخلفية',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'موضع الخلفية',
  'panel.hero.mode': 'الوضع',
  'panel.hero.modeFluidHeight': 'ارتفاع مرن',
  'panel.hero.modeFixedHeight': 'ارتفاع ثابت',
  'panel.hero.height': 'الارتفاع',
  'panel.hero.width': 'العرض',
  'panel.hero.verticalAlign': 'المحاذاة العمودية',
  'panel.hero.verticalAlignTop': 'أعلى',
  'panel.hero.verticalAlignMiddle': 'وسط',
  'panel.hero.verticalAlignBottom': 'أسفل',

  // property panels — navbar
  'panel.navbar.title': 'خصائص شريط التنقل',
  'panel.navbar.links': 'الروابط',
  'panel.navbar.linkLabel': 'رابط',
  'panel.navbar.removeLink': 'إزالة',
  'panel.navbar.linkText': 'النص',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ إضافة رابط',
  'panel.navbar.hamburger': 'قائمة الهامبرغر (الجوال)',
  'panel.navbar.hamburgerShow': 'إظهار',
  'panel.navbar.hamburgerHide': 'إخفاء',
  'panel.navbar.linkColor': 'لون الرابط',
  'panel.navbar.linkFontSize': 'حجم خط الرابط',
  'panel.navbar.linkPadding': 'حشو الرابط',

  // property panels — divider
  'panel.divider.title': 'خصائص الفاصل',
  'panel.divider.style': 'النمط',
  'panel.divider.styleSolid': 'متصل',
  'panel.divider.styleDashed': 'متقطع',
  'panel.divider.styleDotted': 'منقط',
  'panel.divider.color': 'اللون',
  'panel.divider.width': 'العرض',
  'panel.divider.lineWidth': 'سُمك الخط',

  // property panels — spacer
  'panel.spacer.title': 'خصائص المسافة',
  'panel.spacer.height': 'الارتفاع',

  // property panels — social
  'panel.social.title': 'خصائص الشبكات الاجتماعية',
  'panel.social.icons': 'الأيقونات',
  'panel.social.iconLabel': 'أيقونة',
  'panel.social.removeIcon': 'إزالة',
  'panel.social.network': 'الشبكة',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'URL الأيقونة',
  'panel.social.altText': 'التسمية (نص alt)',
  'panel.social.addIcon': '+ إضافة أيقونة',
  'panel.social.iconSize': 'حجم الأيقونة',
  'panel.social.spacing': 'التباعد',

  // property panels — html
  'panel.html.title': 'خصائص HTML',
  'panel.html.rawHtml': 'HTML خام',

  // property panels — row
  'panel.row.title': 'خصائص الصف',
  'panel.row.columnLayout': 'تخطيط الأعمدة',
  'panel.row.layout1col': 'عمود واحد',
  'panel.row.layout2col': '2 متساويان',
  'panel.row.layout3col': '3 متساوية',
  'panel.row.layout4col': '4 متساوية',
  'panel.row.backgroundImageUrl': 'URL صورة الخلفية',
  'panel.row.fullWidth': 'العرض الكامل',
  'panel.row.displayCondition': 'شرط العرض',

  // controls — color picker
  'control.color.label': 'اللون',

  // controls — font picker
  'control.fontPicker.label': 'عائلة الخط',

  // controls — link type picker
  'control.linkType.ariaLabel': 'إدراج رابط خاص',
  'control.linkType.placeholder': '+ رابط خاص',
  'control.linkType.emailPrompt': 'عنوان البريد الإلكتروني',
  'control.linkType.telPrompt': 'رقم الهاتف',

  // controls — spacing input
  'control.spacing.top': 'أعلى',
  'control.spacing.right': 'يمين',
  'control.spacing.bottom': 'أسفل',
  'control.spacing.left': 'يسار',
  'control.spacing.topTitle': 'أعلى (px)',
  'control.spacing.rightTitle': 'يمين (px)',
  'control.spacing.bottomTitle': 'أسفل (px)',
  'control.spacing.leftTitle': 'يسار (px)',

  // controls — alignment picker
  'control.alignment.left': 'محاذاة لليسار',
  'control.alignment.center': 'توسيط',
  'control.alignment.right': 'محاذاة لليمين',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'البحث عن وسوم...',
  'control.mergeTag.noMatches': 'لا توجد وسوم مطابقة',

  // rich text bubble toolbar
  'richtext.bold': 'غامق (Cmd+B)',
  'richtext.italic': 'مائل (Cmd+I)',
  'richtext.underline': 'تسطير (Cmd+U)',
  'richtext.strike': 'يتوسطه خط',
  'richtext.code': 'تعليمات برمجية',
  'richtext.link': 'رابط',
  'richtext.apply': 'تطبيق',
  'richtext.removeLink': 'إزالة الرابط',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
