// Hand-written designs in the shape Unlayer's `editor.saveDesign()` returns,
// so visitors without a template to hand can still watch an import work.

const pad = (containerPadding: string) => ({ containerPadding });

const newsletter = {
  counters: { u_row: 6, u_column: 7, u_content_text: 4, u_content_image: 3 },
  schemaVersion: 16,
  body: {
    id: 'sample-newsletter',
    rows: [
      {
        id: 'r-menu',
        cells: [1],
        columns: [
          {
            id: 'c-menu',
            contents: [
              {
                id: 'menu-1',
                type: 'menu',
                values: {
                  ...pad('16px 10px'),
                  menu: {
                    items: [
                      { key: '1', text: 'Journal', link: { name: 'web', values: { href: 'https://example.com/journal' } } },
                      { key: '2', text: 'Shop', link: { name: 'web', values: { href: 'https://example.com/shop' } } },
                      { key: '3', text: 'Stories', link: { name: 'web', values: { href: 'https://example.com/stories' } } },
                    ],
                  },
                  fontSize: '14px',
                  textColor: '#1f2933',
                  linkColor: '#1f2933',
                  align: 'center',
                  padding: '5px 14px',
                },
              },
            ],
            values: { backgroundColor: '', padding: '0px' },
          },
        ],
        values: { backgroundColor: '#ffffff', padding: '0px', columnsBackgroundColor: '' },
      },
      {
        id: 'r-hero',
        cells: [1],
        columns: [
          {
            id: 'c-hero',
            contents: [
              {
                id: 'hero-img',
                type: 'image',
                values: {
                  ...pad('0px'),
                  src: { url: 'https://placehold.co/1200x520/e8590c/ffffff?text=Autumn+Field+Notes', width: 1200, height: 520, autoWidth: true },
                  textAlign: 'center',
                  altText: 'Autumn field notes',
                  action: { name: 'web', values: { href: 'https://example.com/autumn', target: '_blank' } },
                },
              },
              {
                id: 'hero-heading',
                type: 'heading',
                values: {
                  ...pad('28px 32px 4px'),
                  headingType: 'h1',
                  fontSize: '30px',
                  color: '#1f2933',
                  textAlign: 'left',
                  lineHeight: '130%',
                  text: 'Field notes for the season ahead',
                },
              },
              {
                id: 'hero-text',
                type: 'text',
                values: {
                  ...pad('8px 32px 16px'),
                  fontSize: '16px',
                  color: '#52606d',
                  textAlign: 'left',
                  lineHeight: '160%',
                  text: '<p>Hi {{first_name}}, this month we tested twelve rain shells on the same wet ridge, and three were worth keeping. Here is what we learned.</p>',
                },
              },
              {
                id: 'hero-button',
                type: 'button',
                values: {
                  ...pad('8px 32px 32px'),
                  href: { name: 'web', values: { href: 'https://example.com/autumn', target: '_blank' } },
                  buttonColors: { color: '#ffffff', backgroundColor: '#1f2933' },
                  size: { autoWidth: true, width: '100%' },
                  fontSize: '15px',
                  textAlign: 'left',
                  padding: '12px 26px',
                  borderRadius: '4px',
                  text: '<span>Read the review</span>',
                },
              },
            ],
            values: { padding: '0px' },
          },
        ],
        values: { backgroundColor: '#ffffff', padding: '0px' },
      },
      {
        id: 'r-two-up',
        cells: [1, 1],
        columns: [
          {
            id: 'c-left',
            contents: [
              {
                id: 'left-img',
                type: 'image',
                values: {
                  ...pad('0px 8px'),
                  src: { url: 'https://placehold.co/560x360/efe6d3/242b32?text=Packing+list', width: 280, height: 180, autoWidth: false },
                  textAlign: 'center',
                  altText: 'Packing list',
                },
              },
              {
                id: 'left-text',
                type: 'text',
                values: {
                  ...pad('12px 8px'),
                  fontSize: '14px',
                  textAlign: 'left',
                  lineHeight: '150%',
                  text: '<p><strong>The 10-item packing list</strong></p><p>What we actually carried on a three-day walk, and what stayed home.</p>',
                },
              },
            ],
            values: { padding: '0px 16px' },
          },
          {
            id: 'c-right',
            contents: [
              {
                id: 'right-img',
                type: 'image',
                values: {
                  ...pad('0px 8px'),
                  src: { url: 'https://placehold.co/560x360/efe6d3/242b32?text=Trail+food', width: 280, height: 180, autoWidth: false },
                  textAlign: 'center',
                  altText: 'Trail food',
                },
              },
              {
                id: 'right-text',
                type: 'text',
                values: {
                  ...pad('12px 8px'),
                  fontSize: '14px',
                  textAlign: 'left',
                  lineHeight: '150%',
                  text: '<p><strong>Trail food that travels</strong></p><p>Five recipes that survive a rucksack and still taste good on day three.</p>',
                },
              },
            ],
            values: { padding: '0px 16px' },
          },
        ],
        values: { backgroundColor: '#ffffff', padding: '0px 0px 24px' },
      },
      {
        id: 'r-footer',
        cells: [1],
        columns: [
          {
            id: 'c-footer',
            contents: [
              {
                id: 'footer-divider',
                type: 'divider',
                values: {
                  ...pad('8px 32px'),
                  width: '100%',
                  border: { borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#d9d2c3' },
                },
              },
              {
                id: 'footer-social',
                type: 'social',
                values: {
                  ...pad('12px'),
                  icons: {
                    iconType: 'circle',
                    iconSize: 28,
                    icons: [
                      { name: 'Instagram', url: 'https://instagram.com/' },
                      { name: 'YouTube', url: 'https://youtube.com/' },
                      { name: 'LinkedIn', url: 'https://linkedin.com/' },
                    ],
                  },
                  align: 'center',
                  spacing: 10,
                },
              },
              {
                id: 'footer-text',
                type: 'text',
                values: {
                  ...pad('4px 32px 28px'),
                  fontSize: '12px',
                  color: '#7b8794',
                  textAlign: 'center',
                  lineHeight: '150%',
                  text: '<p>You are receiving this because you subscribed at example.com.<br><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
                },
              },
            ],
            values: { padding: '0px' },
          },
        ],
        values: { backgroundColor: '#ffffff', padding: '0px' },
      },
    ],
    values: {
      contentWidth: '600px',
      contentAlign: 'center',
      fontFamily: { label: 'Arial', value: 'arial,helvetica,sans-serif' },
      textColor: '#1f2933',
      backgroundColor: '#f7f1e5',
      preheaderText: 'Three rain shells worth keeping, and two recipes for the trail.',
    },
  },
};

// Deliberately uses content the importer cannot carry across, so the warnings
// panel has something real to show.
const promo = {
  counters: { u_row: 4, u_column: 4 },
  schemaVersion: 16,
  body: {
    id: 'sample-promo',
    rows: [
      {
        id: 'p-head',
        cells: [1],
        columns: [
          {
            id: 'p-head-col',
            contents: [
              {
                id: 'p-heading',
                type: 'heading',
                values: {
                  ...pad('32px 24px 8px'),
                  headingType: 'h1',
                  fontSize: '34px',
                  color: '#ffffff',
                  textAlign: 'center',
                  lineHeight: '120%',
                  text: 'The winter sale ends Sunday',
                },
              },
              {
                id: 'p-kicker',
                type: 'heading',
                values: {
                  ...pad('0px 24px 16px'),
                  headingType: 'h5',
                  fontSize: '14px',
                  color: '#fcd9bd',
                  textAlign: 'center',
                  text: 'Up to 40% off outerwear',
                },
              },
              {
                id: 'p-timer',
                type: 'timer',
                values: { ...pad('10px'), endTime: '2026-12-20T23:59:59Z', countdown: 'classic' },
              },
            ],
            values: { padding: '0px' },
          },
        ],
        values: { backgroundColor: '#242b32', padding: '0px' },
      },
      {
        id: 'p-video-row',
        cells: [1],
        columns: [
          {
            id: 'p-video-col',
            contents: [
              {
                id: 'p-video',
                type: 'video',
                values: { ...pad('0px'), videoUrl: 'https://www.youtube.com/watch?v=example' },
              },
              {
                id: 'p-product',
                type: 'custom#product_card',
                values: { productId: 'SKU-1042' },
              },
            ],
            values: { padding: '0px' },
          },
        ],
        values: { backgroundColor: '#ffffff', padding: '16px 0px' },
      },
      {
        id: 'p-vip',
        cells: [2, 1],
        columns: [
          {
            id: 'p-vip-text',
            contents: [
              {
                id: 'p-vip-copy',
                type: 'text',
                values: {
                  ...pad('16px 24px'),
                  fontSize: '15px',
                  lineHeight: '150%',
                  textAlign: 'left',
                  text: '<p><strong>Members get early access.</strong> Sign in before Friday to shop the sale a day early.</p>',
                },
              },
            ],
            values: { padding: '0px' },
          },
          {
            id: 'p-vip-cta',
            contents: [
              {
                id: 'p-vip-button',
                type: 'button',
                values: {
                  ...pad('16px 24px'),
                  href: { name: 'web', values: { href: 'https://example.com/members' } },
                  buttonColors: { color: '#ffffff', backgroundColor: '#e8590c' },
                  size: { autoWidth: false, width: '100%' },
                  fontSize: '15px',
                  padding: '12px 20px',
                  borderRadius: '4px',
                  text: 'Sign in',
                },
              },
            ],
            values: { padding: '0px', verticalAlign: 'middle' },
          },
        ],
        values: {
          backgroundColor: '#fff6ed',
          padding: '0px',
          displayCondition: {
            type: 'Members',
            label: 'Members only',
            description: 'Only show to logged-in members',
            before: '{% if customer.member %}',
            after: '{% endif %}',
          },
        },
      },
      {
        id: 'p-html-row',
        cells: [1],
        columns: [
          {
            id: 'p-html-col',
            contents: [
              {
                id: 'p-html',
                type: 'html',
                values: {
                  ...pad('16px 24px 28px'),
                  html: '<p style="margin:0;font-size:12px;color:#7b8794;text-align:center">Prices include VAT. <a href="{{unsubscribe_url}}" style="color:#7b8794">Unsubscribe</a></p>',
                },
              },
            ],
            values: { padding: '0px' },
          },
        ],
        values: { backgroundColor: '#ffffff', padding: '0px' },
      },
    ],
    values: {
      contentWidth: 600,
      fontFamily: { label: 'Helvetica', value: 'helvetica,sans-serif' },
      textColor: '#242b32',
      backgroundColor: '#efe6d3',
    },
  },
};

export const unlayerSamples = {
  newsletter: { label: 'Newsletter (imports cleanly)', design: newsletter },
  promo: { label: 'Promo with timer, video and a custom tool (shows warnings)', design: promo },
};
