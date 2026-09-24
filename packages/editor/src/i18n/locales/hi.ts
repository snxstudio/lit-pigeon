/**
 * Hindi UI strings. Machine-translated, native review welcome.
 * Keys mirror en.ts; any key missing here falls back to English.
 */
const messages: Record<string, string> = {
  // toolbar
  'toolbar.undo': 'पूर्ववत करें',
  'toolbar.redo': 'फिर से करें',
  'toolbar.preview-device': 'प्रीव्यू डिवाइस',
  'toolbar.desktop-view': 'डेस्कटॉप व्यू',
  'toolbar.tablet-view-title': 'टैबलेट व्यू (768px)',
  'toolbar.tablet-view': 'टैबलेट व्यू',
  'toolbar.mobile-view-title': 'मोबाइल व्यू (375px)',
  'toolbar.mobile-view': 'मोबाइल व्यू',
  'toolbar.fullscreen': 'फ़ुलस्क्रीन',
  'toolbar.exit-fullscreen': 'फ़ुलस्क्रीन से बाहर निकलें',
  'toolbar.enter-fullscreen': 'फ़ुलस्क्रीन में देखें',
  'toolbar.templates': 'टेम्पलेट',
  'toolbar.preview': 'प्रीव्यू',
  'toolbar.export': 'एक्सपोर्ट',
  'toolbar.export-format': 'एक्सपोर्ट फ़ॉर्मैट',
  'toolbar.export-html': 'HTML एक्सपोर्ट करें',
  'toolbar.export-mjml': 'MJML एक्सपोर्ट करें',
  'toolbar.export-json': 'JSON एक्सपोर्ट करें',

  // palette
  'palette.label': 'पैलेट',
  'palette.tab.content': 'सामग्री',
  'palette.tab.layers': 'लेयर',
  'palette.tab.brand': 'ब्रांड',
  'palette.tab.saved': 'सहेजे गए',

  // palette — layout section
  'palette.layout.section-content': 'सामग्री',
  'palette.layout.section-layout': 'लेआउट',
  'palette.layout.1-col': '1 कॉलम',
  'palette.layout.2-col': '2 कॉलम',
  'palette.layout.3-col': '3 कॉलम',
  'palette.layout.4-col': '4 कॉलम',

  // palette — brand tab
  'palette.brand.colors': 'रंग',
  'palette.brand.fonts': 'फ़ॉन्ट',
  'palette.brand.logos': 'लोगो',
  'palette.brand.add': '+ जोड़ें',
  'palette.brand.no-colors': 'अभी कोई रंग नहीं',
  'palette.brand.no-fonts': 'अभी कोई फ़ॉन्ट नहीं',
  'palette.brand.no-logos': 'अभी कोई लोगो नहीं',
  'palette.brand.color-name-label': 'रंग का नाम',
  'palette.brand.color-value-label': 'रंग का मान',
  'palette.brand.delete-title': 'हटाएँ',
  'palette.brand.insert-logo-title': 'लोगो डालें',

  // palette — saved tab
  'palette.saved.empty': 'अभी कोई सहेजी गई पंक्ति नहीं है। किसी पंक्ति को यहाँ सहेजने के लिए उस पर बुकमार्क ऐक्शन का उपयोग करें।',
  'palette.saved.delete-title': 'हटाएँ',

  // preview
  'preview.heading': 'प्रीव्यू',
  'preview.tab-group-label': 'प्रीव्यू फ़ॉर्मैट',
  'preview.tab.preview': 'प्रीव्यू',
  'preview.tab.html': 'HTML',
  'preview.tab.mjml': 'MJML',
  'preview.tab.json': 'JSON',
  'preview.device.desktop': 'डेस्कटॉप प्रीव्यू',
  'preview.device.mobile': 'मोबाइल प्रीव्यू',
  'preview.close': 'प्रीव्यू बंद करें',
  'preview.loading': 'रेंडर हो रहा है...',

  // template picker
  'template.heading': 'टेम्पलेट',
  'template.close': 'बंद करें',
  'template.section.choose': 'टेम्पलेट चुनें',
  'template.empty': 'अभी कोई टेम्पलेट उपलब्ध नहीं है।',
  'template.section.save': 'वर्तमान को टेम्पलेट के रूप में सहेजें',
  'template.field.name': 'नाम',
  'template.field.name-placeholder': 'मेरा टेम्पलेट',
  'template.field.category': 'श्रेणी',
  'template.field.description': 'विवरण (वैकल्पिक)',
  'template.field.description-placeholder': 'यह टेम्पलेट किसलिए है?',
  'template.cancel': 'रद्द करें',
  'template.save': 'टेम्पलेट सहेजें',
  'template.error.name-required': 'नाम आवश्यक है',

  // asset manager
  'asset.title': 'एसेट चुनें',
  'asset.title-upload': 'इमेज चुनें',
  'asset.close': 'बंद करें',
  'asset.tab.library': 'लाइब्रेरी',
  'asset.tab.upload': 'अपलोड',
  'asset.folder.all': 'सभी फ़ोल्डर',
  'asset.search': 'एसेट खोजें',
  'asset.tag-filter-label': 'टैग से फ़िल्टर करें',
  'asset.loading': 'लोड हो रहा है…',
  'asset.empty.filtered': 'आपके फ़िल्टर से कोई एसेट मेल नहीं खाता।',
  'asset.empty.no-assets': 'अभी कोई सहेजा गया एसेट नहीं है। शुरू करने के लिए एक अपलोड करें।',
  'asset.drop-zone.label': 'इमेज को यहाँ ड्रैग और ड्रॉप करें',
  'asset.drop-zone.hint': 'या ब्राउज़ करने के लिए क्लिक करें',
  'asset.url.separator': 'या URL डालें',
  'asset.url.placeholder': 'https://example.com/image.jpg',
  'asset.url.use': 'URL उपयोग करें',

  // asset manager — stock tab
  'asset.tab.stock': 'स्टॉक',
  'asset.stock.search': 'मुफ़्त फ़ोटो खोजें…',
  'asset.stock.idle': 'मुफ़्त फ़ोटो के लिए Unsplash और Pexels में खोजें।',
  'asset.stock.empty': 'कोई फ़ोटो नहीं मिली। कुछ और खोजकर देखें।',
  'asset.stock.load-more': 'और लोड करें',
  'asset.stock.photo-by': 'फ़ोटो:',
  'asset.stock.on': 'पर',
  'asset.stock.error': 'फ़ोटो लोड नहीं हो सकीं। API कुंजी जाँचें या फिर से कोशिश करें।',
  'asset.stock.rate-limited': 'रेट लिमिट पूरी हो गई। थोड़ी देर बाद फिर से कोशिश करें।',

  // property panels — shared (common) labels
  'panel.common.backgroundColor': 'बैकग्राउंड रंग',
  'panel.common.padding': 'पैडिंग',
  'panel.common.outerPadding': 'बाहरी पैडिंग',
  'panel.common.innerPadding': 'भीतरी पैडिंग',
  'panel.common.alignment': 'संरेखण',
  'panel.common.fontSize': 'फ़ॉन्ट आकार',
  'panel.common.borderRadius': 'बॉर्डर रेडियस',
  'panel.common.linkUrl': 'लिंक URL',
  'panel.common.urlPlaceholder': 'https://example.com',
  'panel.common.contentHtml': 'सामग्री (HTML)',
  'panel.common.displayCondition': 'प्रदर्शन शर्त',
  'panel.common.insertMergeTag': 'मर्ज टैग डालें',
  'panel.common.tagBtn': '{ } टैग',
  'panel.common.uploadImage': 'इमेज अपलोड करें',
  'panel.common.left': 'बाएँ',
  'panel.common.center': 'बीच में',

  // property panels — body
  'panel.body.title': 'ईमेल बॉडी',
  'panel.body.contentWidth': 'सामग्री की चौड़ाई',
  'panel.body.fontFamily': 'फ़ॉन्ट फ़ैमिली',
  'panel.body.contentAlignment': 'सामग्री संरेखण',
  'panel.body.emailName': 'ईमेल का नाम',
  'panel.body.previewText': 'प्रीव्यू टेक्स्ट',
  'panel.body.previewTextPlaceholder': 'ईमेल प्रीव्यू टेक्स्ट...',

  // property panels — text
  'panel.text.title': 'टेक्स्ट गुण',
  'panel.text.textAlign': 'टेक्स्ट संरेखण',
  'panel.text.lineHeight': 'पंक्ति ऊँचाई',

  // property panels — button
  'panel.button.title': 'बटन गुण',
  'panel.button.buttonText': 'बटन टेक्स्ट',
  'panel.button.textColor': 'टेक्स्ट रंग',
  'panel.button.fontWeight': 'फ़ॉन्ट वेट',
  'panel.button.fontWeight.normal': 'सामान्य (400)',
  'panel.button.fontWeight.medium': 'मध्यम (500)',
  'panel.button.fontWeight.semibold': 'अर्ध-बोल्ड (600)',
  'panel.button.fontWeight.bold': 'बोल्ड (700)',
  'panel.button.border': 'बॉर्डर',
  'panel.button.borderNone': 'कोई नहीं',
  'panel.button.borderSolid': 'ठोस',
  'panel.button.borderDashed': 'डैश वाली',
  'panel.button.borderDotted': 'बिंदुदार',
  'panel.button.borderWidth': 'बॉर्डर चौड़ाई',
  'panel.button.borderColor': 'बॉर्डर रंग',
  'panel.button.fullWidth': 'पूरी चौड़ाई',

  // property panels — image
  'panel.image.title': 'इमेज गुण',
  'panel.image.imageUrl': 'इमेज URL',
  'panel.image.urlPlaceholder': 'https://example.com/image.jpg',
  'panel.image.altText': 'Alt टेक्स्ट',
  'panel.image.altPlaceholder': 'इमेज का विवरण',
  'panel.image.width': 'चौड़ाई (0 = ऑटो)',

  // property panels — hero
  'panel.hero.title': 'हीरो गुण',
  'panel.hero.backgroundUrl': 'बैकग्राउंड URL',
  'panel.hero.backgroundUrlPlaceholder': 'https://example.com/hero.jpg',
  'panel.hero.backgroundPosition': 'बैकग्राउंड स्थिति',
  'panel.hero.mode': 'मोड',
  'panel.hero.modeFluidHeight': 'फ़्लूइड ऊँचाई',
  'panel.hero.modeFixedHeight': 'निश्चित ऊँचाई',
  'panel.hero.height': 'ऊँचाई',
  'panel.hero.width': 'चौड़ाई',
  'panel.hero.verticalAlign': 'लंबवत संरेखण',
  'panel.hero.verticalAlignTop': 'ऊपर',
  'panel.hero.verticalAlignMiddle': 'बीच में',
  'panel.hero.verticalAlignBottom': 'नीचे',

  // property panels — navbar
  'panel.navbar.title': 'नेवबार गुण',
  'panel.navbar.links': 'लिंक',
  'panel.navbar.linkLabel': 'लिंक',
  'panel.navbar.removeLink': 'हटाएँ',
  'panel.navbar.linkText': 'टेक्स्ट',
  'panel.navbar.url': 'URL',
  'panel.navbar.addLink': '+ लिंक जोड़ें',
  'panel.navbar.hamburger': 'हैमबर्गर (मोबाइल)',
  'panel.navbar.hamburgerShow': 'दिखाएँ',
  'panel.navbar.hamburgerHide': 'छिपाएँ',
  'panel.navbar.linkColor': 'लिंक रंग',
  'panel.navbar.linkFontSize': 'लिंक फ़ॉन्ट आकार',
  'panel.navbar.linkPadding': 'लिंक पैडिंग',

  // property panels — divider
  'panel.divider.title': 'डिवाइडर गुण',
  'panel.divider.style': 'शैली',
  'panel.divider.styleSolid': 'ठोस',
  'panel.divider.styleDashed': 'डैश वाली',
  'panel.divider.styleDotted': 'बिंदुदार',
  'panel.divider.color': 'रंग',
  'panel.divider.width': 'चौड़ाई',
  'panel.divider.lineWidth': 'रेखा की मोटाई',

  // property panels — spacer
  'panel.spacer.title': 'स्पेसर गुण',
  'panel.spacer.height': 'ऊँचाई',

  // property panels — social
  'panel.social.title': 'सोशल गुण',
  'panel.social.icons': 'आइकन',
  'panel.social.iconLabel': 'आइकन',
  'panel.social.removeIcon': 'हटाएँ',
  'panel.social.network': 'नेटवर्क',
  'panel.social.url': 'URL',
  'panel.social.iconUrl': 'आइकन URL',
  'panel.social.altText': 'लेबल (alt टेक्स्ट)',
  'panel.social.addIcon': '+ आइकन जोड़ें',
  'panel.social.iconSize': 'आइकन आकार',
  'panel.social.spacing': 'अंतराल',

  // property panels — html
  'panel.html.title': 'HTML गुण',
  'panel.html.rawHtml': 'रॉ HTML',

  // property panels — row
  'panel.row.title': 'पंक्ति गुण',
  'panel.row.columnLayout': 'कॉलम लेआउट',
  'panel.row.layout1col': '1 कॉलम',
  'panel.row.layout2col': '2 बराबर',
  'panel.row.layout3col': '3 बराबर',
  'panel.row.layout4col': '4 बराबर',
  'panel.row.backgroundImageUrl': 'बैकग्राउंड इमेज URL',
  'panel.row.fullWidth': 'पूरी चौड़ाई',
  'panel.row.displayCondition': 'प्रदर्शन शर्त',
  'panel.row.repeat': 'प्रत्येक के लिए दोहराएँ',

  // controls — color picker
  'control.color.label': 'रंग',

  // controls — font picker
  'control.fontPicker.label': 'फ़ॉन्ट फ़ैमिली',

  // controls — link type picker
  'control.linkType.ariaLabel': 'विशेष लिंक डालें',
  'control.linkType.placeholder': '+ विशेष लिंक',
  'control.linkType.emailPrompt': 'ईमेल पता',
  'control.linkType.telPrompt': 'फ़ोन नंबर',

  // controls — spacing input
  'control.spacing.top': 'ऊपर',
  'control.spacing.right': 'दाएँ',
  'control.spacing.bottom': 'नीचे',
  'control.spacing.left': 'बाएँ',
  'control.spacing.topTitle': 'ऊपर (px)',
  'control.spacing.rightTitle': 'दाएँ (px)',
  'control.spacing.bottomTitle': 'नीचे (px)',
  'control.spacing.leftTitle': 'बाएँ (px)',

  // controls — alignment picker
  'control.alignment.left': 'बाएँ संरेखित करें',
  'control.alignment.center': 'बीच में संरेखित करें',
  'control.alignment.right': 'दाएँ संरेखित करें',

  // controls — merge tag picker
  'control.mergeTag.searchPlaceholder': 'टैग खोजें...',
  'control.mergeTag.noMatches': 'कोई मेल खाता टैग नहीं',

  // rich text bubble toolbar
  'richtext.bold': 'बोल्ड (Cmd+B)',
  'richtext.italic': 'इटैलिक (Cmd+I)',
  'richtext.underline': 'अंडरलाइन (Cmd+U)',
  'richtext.strike': 'स्ट्राइकथ्रू',
  'richtext.code': 'कोड',
  'richtext.link': 'लिंक',
  'richtext.apply': 'लागू करें',
  'richtext.removeLink': 'लिंक हटाएँ',
  'richtext.urlPlaceholder': 'https://…',
};

export default messages;
