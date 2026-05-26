import type { Template } from '../types/template.js';

// All starter templates share these stable ids — the editor's "Save as new"
// flow generates UUID-shaped ids to avoid collisions with starters.

const STAMP = '2026-05-26T10:00:00.000Z';

const welcome: Template = {
  id: 'starter-welcome',
  name: 'Welcome',
  description: 'A clean welcome email with a hero, intro paragraph, and call-to-action.',
  category: 'welcome',
  createdAt: STAMP,
  updatedAt: STAMP,
  document: {
    version: '1.0',
    metadata: {
      name: 'Welcome',
      previewText: "We're glad you're here.",
      createdAt: STAMP,
      updatedAt: STAMP,
    },
    body: {
      attributes: { width: 600, backgroundColor: '#f5f7fb', fontFamily: 'Inter, sans-serif', contentAlignment: 'center' },
      rows: [
        {
          id: 'r-hero', type: 'row', locked: false,
          attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, fullWidth: true },
          columnRatios: [12],
          columns: [{
            id: 'c-hero', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-hero', type: 'hero',
              values: {
                backgroundUrl: 'https://placehold.co/600x280/0f172a/ffffff?text=Welcome',
                backgroundPosition: 'center center', mode: 'fixed-height',
                width: 600, height: 280, verticalAlign: 'middle',
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                innerPadding: { top: 40, right: 40, bottom: 40, left: 40 },
                backgroundColor: '#0f172a',
                content: '<h1 style="color:#ffffff;font-size:32px;margin:0;">Welcome, {{firstName}}</h1>',
              },
            }],
          }],
        },
        {
          id: 'r-intro', type: 'row', locked: false,
          attributes: { backgroundColor: '#ffffff', padding: { top: 32, right: 24, bottom: 8, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-intro', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-intro', type: 'text',
              values: {
                content: "<p>Thanks for joining — we've put together a quick guide to help you get the most out of your account.</p>",
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                lineHeight: '1.6', textAlign: 'left',
              },
            }],
          }],
        },
        {
          id: 'r-cta', type: 'row', locked: false,
          attributes: { backgroundColor: '#ffffff', padding: { top: 16, right: 24, bottom: 32, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-cta', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-cta', type: 'button',
              values: {
                content: '<p>Get started</p>', href: 'https://example.com/start',
                backgroundColor: '#3b82f6', textColor: '#ffffff',
                borderRadius: 6,
                padding: { top: 8, right: 8, bottom: 8, left: 8 },
                innerPadding: { top: 12, right: 24, bottom: 12, left: 24 },
                fontSize: 16, fontWeight: '600', alignment: 'center', fullWidth: false,
              },
            }],
          }],
        },
      ],
    },
  },
};

const newsletter: Template = {
  id: 'starter-newsletter',
  name: 'Newsletter',
  description: 'A simple 3-section newsletter — headline + body + footer.',
  category: 'newsletter',
  createdAt: STAMP,
  updatedAt: STAMP,
  document: {
    version: '1.0',
    metadata: { name: 'Newsletter', previewText: 'This month\'s updates', createdAt: STAMP, updatedAt: STAMP },
    body: {
      attributes: { width: 600, backgroundColor: '#ffffff', fontFamily: 'Inter, sans-serif', contentAlignment: 'center' },
      rows: [
        {
          id: 'r-head', type: 'row', locked: false,
          attributes: { padding: { top: 24, right: 24, bottom: 8, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-head', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-head', type: 'text',
              values: {
                content: '<h1 style="font-size:24px;margin:0;">This month at Acme</h1>',
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                lineHeight: '1.3', textAlign: 'left',
              },
            }],
          }],
        },
        {
          id: 'r-body', type: 'row', locked: false,
          attributes: { padding: { top: 8, right: 24, bottom: 24, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-body', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-body', type: 'text',
              values: {
                content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sodales, mauris vel rhoncus sodales, eros lectus rutrum lectus.</p><p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.</p>',
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                lineHeight: '1.6', textAlign: 'left',
              },
            }],
          }],
        },
        {
          id: 'r-foot', type: 'row', locked: false,
          attributes: { backgroundColor: '#f5f7fb', padding: { top: 16, right: 24, bottom: 16, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-foot', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-foot', type: 'text',
              values: {
                content: '<p style="color:#64748b;font-size:12px;">© Acme · <a href="https://example.com/unsubscribe">Unsubscribe</a></p>',
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                lineHeight: '1.5', textAlign: 'center',
              },
            }],
          }],
        },
      ],
    },
  },
};

const transactional: Template = {
  id: 'starter-transactional',
  name: 'Transactional (order confirmation)',
  description: 'Order confirmation pattern with summary and a primary button.',
  category: 'transactional',
  createdAt: STAMP,
  updatedAt: STAMP,
  document: {
    version: '1.0',
    metadata: { name: 'Order confirmation', previewText: 'Order {{orderNumber}} is on its way.', createdAt: STAMP, updatedAt: STAMP },
    body: {
      attributes: { width: 600, backgroundColor: '#ffffff', fontFamily: 'Inter, sans-serif', contentAlignment: 'center' },
      rows: [
        {
          id: 'r-h', type: 'row', locked: false,
          attributes: { padding: { top: 32, right: 24, bottom: 8, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-h', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-h', type: 'text',
              values: {
                content: '<h1 style="font-size:24px;margin:0 0 8px;">Thanks for your order, {{firstName}}</h1><p style="margin:0;">Order <strong>{{orderNumber}}</strong> is on its way.</p>',
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                lineHeight: '1.5', textAlign: 'left',
              },
            }],
          }],
        },
        {
          id: 'r-summary', type: 'row', locked: false,
          attributes: { backgroundColor: '#f8fafc', padding: { top: 16, right: 24, bottom: 16, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-summary', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-summary', type: 'text',
              values: {
                content: '<p style="margin:0 0 8px;"><strong>Summary</strong></p><p style="margin:0;">{{itemCount}} item(s) · {{total}}</p><p style="margin:8px 0 0;color:#64748b;font-size:12px;">Estimated delivery: {{deliveryDate}}</p>',
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                lineHeight: '1.5', textAlign: 'left',
              },
            }],
          }],
        },
        {
          id: 'r-cta', type: 'row', locked: false,
          attributes: { padding: { top: 24, right: 24, bottom: 24, left: 24 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-cta', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-cta', type: 'button',
              values: {
                content: '<p>View order</p>', href: 'https://example.com/orders/{{orderNumber}}',
                backgroundColor: '#0f172a', textColor: '#ffffff',
                borderRadius: 6,
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                innerPadding: { top: 12, right: 24, bottom: 12, left: 24 },
                fontSize: 16, fontWeight: '600', alignment: 'left', fullWidth: false,
              },
            }],
          }],
        },
      ],
    },
  },
};

const promo: Template = {
  id: 'starter-promo',
  name: 'Promo / Sale',
  description: 'Two-column product grid with a primary CTA and a social-link footer.',
  category: 'promo',
  createdAt: STAMP,
  updatedAt: STAMP,
  document: {
    version: '1.0',
    metadata: { name: 'Spring sale', previewText: 'Two days only — 30% off.', createdAt: STAMP, updatedAt: STAMP },
    body: {
      attributes: { width: 600, backgroundColor: '#fdf6ee', fontFamily: 'Inter, sans-serif', contentAlignment: 'center' },
      rows: [
        {
          id: 'r-hero', type: 'row', locked: false,
          attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, fullWidth: true },
          columnRatios: [12],
          columns: [{
            id: 'c-hero', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'middle' },
            blocks: [{
              id: 'b-hero', type: 'hero',
              values: {
                backgroundUrl: 'https://placehold.co/600x240/e76f51/ffffff?text=30%25+off',
                backgroundPosition: 'center center', mode: 'fluid-height',
                width: 600, height: 240, verticalAlign: 'middle',
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
                innerPadding: { top: 32, right: 32, bottom: 32, left: 32 },
                backgroundColor: '#e76f51',
                content: '<h1 style="color:#ffffff;font-size:36px;margin:0 0 8px;">30% off, this weekend only</h1><p style="color:#ffffff;font-size:16px;margin:0;">Code <strong>SPRING30</strong> at checkout.</p>',
              },
            }],
          }],
        },
        {
          id: 'r-grid', type: 'row', locked: false,
          attributes: { backgroundColor: '#ffffff', padding: { top: 24, right: 16, bottom: 24, left: 16 }, fullWidth: false },
          columnRatios: [6, 6],
          columns: [
            {
              id: 'c-l', type: 'column',
              attributes: { padding: { top: 0, right: 8, bottom: 0, left: 0 }, verticalAlign: 'top' },
              blocks: [
                {
                  id: 'b-l-img', type: 'image',
                  values: {
                    src: 'https://placehold.co/280x200', alt: 'Linen shirt',
                    width: 'auto', href: 'https://example.com/p/shirt',
                    padding: { top: 0, right: 0, bottom: 8, left: 0 },
                    alignment: 'center', borderRadius: 6,
                  },
                },
                {
                  id: 'b-l-txt', type: 'text',
                  values: {
                    content: '<p style="text-align:center;margin:0;"><strong>Linen shirt</strong><br><span style="color:#64748b;">$48 · was $69</span></p>',
                    padding: { top: 0, right: 0, bottom: 0, left: 0 }, lineHeight: '1.5', textAlign: 'center',
                  },
                },
              ],
            },
            {
              id: 'c-r', type: 'column',
              attributes: { padding: { top: 0, right: 0, bottom: 0, left: 8 }, verticalAlign: 'top' },
              blocks: [
                {
                  id: 'b-r-img', type: 'image',
                  values: {
                    src: 'https://placehold.co/280x200', alt: 'Wool jumper',
                    width: 'auto', href: 'https://example.com/p/jumper',
                    padding: { top: 0, right: 0, bottom: 8, left: 0 },
                    alignment: 'center', borderRadius: 6,
                  },
                },
                {
                  id: 'b-r-txt', type: 'text',
                  values: {
                    content: '<p style="text-align:center;margin:0;"><strong>Wool jumper</strong><br><span style="color:#64748b;">$84 · was $120</span></p>',
                    padding: { top: 0, right: 0, bottom: 0, left: 0 }, lineHeight: '1.5', textAlign: 'center',
                  },
                },
              ],
            },
          ],
        },
        {
          id: 'r-cta', type: 'row', locked: false,
          attributes: { backgroundColor: '#ffffff', padding: { top: 8, right: 16, bottom: 24, left: 16 }, fullWidth: false },
          columnRatios: [12],
          columns: [{
            id: 'c-cta', type: 'column',
            attributes: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, verticalAlign: 'top' },
            blocks: [{
              id: 'b-cta', type: 'button',
              values: {
                content: '<p>Shop the sale</p>', href: 'https://example.com/sale',
                backgroundColor: '#0f172a', textColor: '#ffffff', borderRadius: 6,
                padding: { top: 8, right: 0, bottom: 8, left: 0 },
                innerPadding: { top: 14, right: 28, bottom: 14, left: 28 },
                fontSize: 16, fontWeight: '600', alignment: 'center', fullWidth: true,
              },
            }],
          }],
        },
      ],
    },
  },
};

const STARTER_TEMPLATES: readonly Template[] = Object.freeze([welcome, newsletter, transactional, promo]);

export function getStarterTemplates(): Template[] {
  // Return a deep copy so callers can mutate without poisoning the cached starters.
  return STARTER_TEMPLATES.map((t) => structuredClone(t));
}

export function getStarterTemplate(id: string): Template | null {
  const t = STARTER_TEMPLATES.find((x) => x.id === id);
  return t ? structuredClone(t) : null;
}
