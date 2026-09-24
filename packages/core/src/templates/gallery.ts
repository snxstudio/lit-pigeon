import type { Template, TemplateCategory } from '../types/template.js';
import type { ColumnNode, ContentBlock, RowNode, Spacing } from '../types/document.js';

// Loaded on demand by loadGalleryTemplates() so these documents stay out of
// the eager bundle. Same shape and stable-id convention as starters.ts.

const STAMP = '2026-09-23T10:00:00.000Z';
const FONT = 'Inter, Helvetica, Arial, sans-serif';
const INK = '#0f172a';
const MUTED = '#64748b';
const LINE = '#e2e8f0';

const pad = (top: number, right = top, bottom = top, left = right): Spacing => ({ top, right, bottom, left });
const NONE = pad(0);

interface RowOptions {
  ratios?: number[];
  background?: string;
  padding?: Spacing;
  fullWidth?: boolean;
  align?: ColumnNode['attributes']['verticalAlign'];
}

/** Builds one template, numbering row, column and block ids within it. */
function template(
  meta: { id: string; name: string; description: string; category: TemplateCategory; previewText: string; background: string },
  build: (b: ReturnType<typeof builders>) => RowNode[],
): Template {
  return {
    id: `starter-${meta.id}`,
    name: meta.name,
    description: meta.description,
    category: meta.category,
    createdAt: STAMP,
    updatedAt: STAMP,
    document: {
      version: '1.0',
      metadata: { name: meta.name, previewText: meta.previewText, createdAt: STAMP, updatedAt: STAMP },
      body: {
        attributes: { width: 600, backgroundColor: meta.background, fontFamily: FONT, contentAlignment: 'center' },
        rows: build(builders(meta.id)),
      },
    },
  };
}

function builders(prefix: string) {
  let n = 0;
  const id = (kind: string) => `${prefix}-${kind}${++n}`;

  const row = (columns: ContentBlock[][], opts: RowOptions = {}): RowNode => ({
    id: id('r'),
    type: 'row',
    locked: false,
    attributes: {
      ...(opts.background ? { backgroundColor: opts.background } : {}),
      padding: opts.padding ?? pad(16, 32),
      fullWidth: opts.fullWidth ?? false,
    },
    columnRatios: opts.ratios ?? [12],
    columns: columns.map((blocks) => ({
      id: id('c'),
      type: 'column',
      attributes: { padding: NONE, verticalAlign: opts.align ?? 'top' },
      blocks,
    })),
  });

  const text = (content: string, textAlign: 'left' | 'center' | 'right' = 'left', padding = NONE): ContentBlock => ({
    id: id('b'),
    type: 'text',
    values: { content, padding, lineHeight: '1.6', textAlign },
  });

  const button = (
    label: string,
    href: string,
    opts: { color?: string; align?: 'left' | 'center' | 'right'; fullWidth?: boolean } = {},
  ): ContentBlock => ({
    id: id('b'),
    type: 'button',
    values: {
      content: `<p>${label}</p>`,
      href,
      backgroundColor: opts.color ?? INK,
      textColor: '#ffffff',
      borderRadius: 6,
      padding: pad(16, 0),
      innerPadding: pad(14, 28),
      fontSize: 16,
      fontWeight: '600',
      alignment: opts.align ?? 'left',
      fullWidth: opts.fullWidth ?? false,
    },
  });

  const image = (src: string, alt: string, opts: { href?: string; width?: number; radius?: number } = {}): ContentBlock => ({
    id: id('b'),
    type: 'image',
    values: {
      src,
      alt,
      width: opts.width ?? 'auto',
      ...(opts.href ? { href: opts.href } : {}),
      padding: NONE,
      alignment: 'center',
      ...(opts.radius ? { borderRadius: opts.radius } : {}),
    },
  });

  const divider = (padding = pad(8, 0)): ContentBlock => ({
    id: id('b'),
    type: 'divider',
    values: { borderColor: LINE, borderWidth: 1, borderStyle: 'solid', padding, width: '100%' },
  });

  const social = (): ContentBlock => ({
    id: id('b'),
    type: 'social',
    values: {
      icons: [
        { type: 'instagram', href: 'https://instagram.com/' },
        { type: 'linkedin', href: 'https://linkedin.com/' },
        { type: 'youtube', href: 'https://youtube.com/' },
      ],
      iconSize: 24,
      spacing: 8,
      alignment: 'center',
      padding: pad(8, 0),
    },
  });

  const logo = (color = INK) =>
    row([[text(`<p style="margin:0;font-size:18px;font-weight:700;color:${color};">{{company}}</p>`)]], { padding: pad(24, 32, 8) });

  /** Transactional footer: no unsubscribe link, since these are service messages. */
  const serviceFooter = (note: string) =>
    row(
      [[text(`<p style="margin:0;color:${MUTED};font-size:12px;">${note}<br>{{company}} · {{companyAddress}}</p>`, 'center')]],
      { padding: pad(24, 32) },
    );

  const marketingFooter = () =>
    row(
      [[
        social(),
        text(
          `<p style="margin:0;color:${MUTED};font-size:12px;">You're receiving this because you subscribed to {{company}}.<br><a href="{{unsubscribeUrl}}" style="color:${MUTED};">Unsubscribe</a> · <a href="{{webViewUrl}}" style="color:${MUTED};">View in browser</a></p>`,
          'center',
        ),
      ]],
      { padding: pad(24, 32) },
    );

  /** A two-column label / amount line, used for order and invoice summaries. */
  const line = (label: string, amount: string, opts: { strong?: boolean; background?: string } = {}) => {
    const wrap = (s: string) => (opts.strong ? `<strong>${s}</strong>` : s);
    return row([[text(`<p style="margin:0;">${wrap(label)}</p>`)], [text(`<p style="margin:0;">${wrap(amount)}</p>`, 'right')]], {
      ratios: [8, 4],
      background: opts.background ?? '#ffffff',
      padding: pad(6, 32),
    });
  };

  return { row, text, button, image, divider, social, logo, serviceFooter, marketingFooter, line };
}

const orderConfirmation = template(
  {
    id: 'order-confirmation',
    name: 'Order confirmation',
    description: 'Itemised receipt with totals, delivery address and a link to the order.',
    category: 'transactional',
    previewText: 'We have your order {{orderNumber}}.',
    background: '#f1f5f9',
  },
  ({ row, text, button, divider, logo, serviceFooter, line }) => [
    logo(),
    row(
      [[
        text(`<h1 style="margin:0 0 8px;font-size:26px;color:${INK};">Thanks for your order, {{firstName}}</h1><p style="margin:0;color:${MUTED};">Order <strong>{{orderNumber}}</strong> · placed {{orderDate}}</p>`),
      ]],
      { background: '#ffffff', padding: pad(32, 32, 16) },
    ),
    row([[divider()]], { background: '#ffffff', padding: pad(0, 32) }),
    line('Linen shirt × 1', '$48.00'),
    line('Wool jumper × 1', '$84.00'),
    row([[divider()]], { background: '#ffffff', padding: pad(0, 32) }),
    line('Subtotal', '{{subtotal}}'),
    line('Shipping', '{{shipping}}'),
    line('Total', '{{total}}', { strong: true }),
    row(
      [
        [text(`<p style="margin:0 0 4px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">Delivering to</p><p style="margin:0;">{{shippingName}}<br>{{shippingAddress}}</p>`)],
        [text(`<p style="margin:0 0 4px;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">Estimated delivery</p><p style="margin:0;">{{deliveryDate}}</p>`)],
      ],
      { ratios: [6, 6], background: '#f8fafc', padding: pad(20, 32) },
    ),
    row([[button('View your order', '{{orderUrl}}')]], { background: '#ffffff', padding: pad(24, 32, 32) }),
    serviceFooter('Questions about your order? Reply to this email.'),
  ],
);

const shippingUpdate = template(
  {
    id: 'shipping-update',
    name: 'Shipping update',
    description: 'Dispatch notice with carrier, tracking number and a progress line.',
    category: 'transactional',
    previewText: 'Order {{orderNumber}} has shipped.',
    background: '#f1f5f9',
  },
  ({ row, text, button, logo, serviceFooter }) => [
    logo(),
    row(
      [[
        text(`<p style="margin:0 0 8px;font-size:12px;color:#2563eb;font-weight:600;text-transform:uppercase;letter-spacing:1px;">On its way</p><h1 style="margin:0 0 8px;font-size:26px;color:${INK};">Your order has shipped</h1><p style="margin:0;color:${MUTED};">Good news, {{firstName}}: order <strong>{{orderNumber}}</strong> left our warehouse today.</p>`),
      ]],
      { background: '#ffffff', padding: pad(32, 32, 16) },
    ),
    row(
      [
        [text('<p style="margin:0;color:#2563eb;font-weight:600;">● Ordered</p>', 'left')],
        [text('<p style="margin:0;color:#2563eb;font-weight:600;">● Shipped</p>', 'center')],
        [text(`<p style="margin:0;color:${MUTED};">○ Delivered</p>`, 'right')],
      ],
      { ratios: [4, 4, 4], background: '#ffffff', padding: pad(8, 32) },
    ),
    row(
      [
        [text(`<p style="margin:0 0 4px;font-size:12px;color:${MUTED};">Carrier</p><p style="margin:0;"><strong>{{carrier}}</strong></p>`)],
        [text(`<p style="margin:0 0 4px;font-size:12px;color:${MUTED};">Tracking number</p><p style="margin:0;"><strong>{{trackingNumber}}</strong></p>`)],
        [text(`<p style="margin:0 0 4px;font-size:12px;color:${MUTED};">Expected</p><p style="margin:0;"><strong>{{deliveryDate}}</strong></p>`)],
      ],
      { ratios: [4, 4, 4], background: '#f8fafc', padding: pad(20, 32) },
    ),
    row([[button('Track your parcel', '{{trackingUrl}}', { color: '#2563eb' })]], { background: '#ffffff', padding: pad(24, 32, 32) }),
    serviceFooter('Tracking can take up to 24 hours to show the first scan.'),
  ],
);

const passwordReset = template(
  {
    id: 'password-reset',
    name: 'Password reset',
    description: 'Short, single-action reset email with an expiry note and a safety line.',
    category: 'transactional',
    previewText: 'Reset your {{company}} password.',
    background: '#f1f5f9',
  },
  ({ row, text, button, divider, logo, serviceFooter }) => [
    logo(),
    row(
      [[
        text(`<h1 style="margin:0 0 12px;font-size:24px;color:${INK};">Reset your password</h1><p style="margin:0;">Hi {{firstName}}, we received a request to reset the password for <strong>{{email}}</strong>. Choose a new one with the button below.</p>`),
        button('Choose a new password', '{{resetUrl}}'),
        text(`<p style="margin:0;color:${MUTED};font-size:14px;">This link expires in {{expiryMinutes}} minutes and can only be used once.</p>`),
        divider(pad(16, 0)),
        text(`<p style="margin:0;color:${MUTED};font-size:13px;">Didn't ask for this? You can ignore this email; your password won't change. If you think someone else is trying to access your account, <a href="{{supportUrl}}" style="color:${MUTED};">contact support</a>.</p>`),
      ]],
      { background: '#ffffff', padding: pad(32) },
    ),
    serviceFooter('This is an automated security message.'),
  ],
);

const invoice = template(
  {
    id: 'invoice',
    name: 'Invoice / receipt',
    description: 'Invoice with billing details, line items, tax, total due and a pay button.',
    category: 'transactional',
    previewText: 'Invoice {{invoiceNumber}} for {{total}}.',
    background: '#f1f5f9',
  },
  ({ row, text, button, divider, serviceFooter, line }) => [
    row(
      [
        [text(`<p style="margin:0;font-size:18px;font-weight:700;color:${INK};">{{company}}</p>`)],
        [text(`<p style="margin:0;font-size:22px;font-weight:700;color:${MUTED};letter-spacing:2px;">INVOICE</p>`, 'right')],
      ],
      { ratios: [6, 6], padding: pad(24, 32, 8), align: 'middle' },
    ),
    row(
      [
        [text(`<p style="margin:0 0 4px;font-size:12px;color:${MUTED};">Billed to</p><p style="margin:0;">{{customerName}}<br>{{billingAddress}}</p>`)],
        [text(`<p style="margin:0;font-size:14px;">Invoice <strong>{{invoiceNumber}}</strong><br>Issued {{invoiceDate}}<br>Due {{dueDate}}</p>`, 'right')],
      ],
      { ratios: [6, 6], background: '#ffffff', padding: pad(28, 32, 16) },
    ),
    row(
      [
        [text(`<p style="margin:0;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">Description</p>`)],
        [text(`<p style="margin:0;font-size:12px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">Amount</p>`, 'right')],
      ],
      { ratios: [8, 4], background: '#f8fafc', padding: pad(10, 32) },
    ),
    line('Pro plan, monthly', '$49.00'),
    line('Additional seats × 3', '$27.00'),
    row([[divider()]], { background: '#ffffff', padding: pad(0, 32) }),
    line('Subtotal', '{{subtotal}}'),
    line('Tax', '{{tax}}'),
    line('Total due', '{{total}}', { strong: true }),
    row([[button('Pay this invoice', '{{paymentUrl}}', { color: '#16a34a' })]], { background: '#ffffff', padding: pad(24, 32, 32) }),
    serviceFooter('Keep this email for your records. A PDF copy is available from your billing page.'),
  ],
);

const eventInvite = template(
  {
    id: 'event-invite',
    name: 'Event invitation',
    description: 'Invitation with date, time and venue, an agenda and an RSVP button.',
    category: 'announcement',
    previewText: 'You are invited: {{eventName}}.',
    background: '#faf5ff',
  },
  ({ row, text, button, image, divider, marketingFooter }) => [
    row([[image('https://placehold.co/600x260/6d28d9/ffffff?text=You%27re+invited', "You're invited")]], { padding: NONE, fullWidth: true }),
    row(
      [[
        text(`<h1 style="margin:0 0 12px;font-size:28px;color:${INK};">{{eventName}}</h1><p style="margin:0;">Hi {{firstName}}, join us for an evening of short talks, demos and conversation with the people building {{company}}.</p>`),
      ]],
      { background: '#ffffff', padding: pad(32, 32, 16) },
    ),
    row(
      [
        [text(`<p style="margin:0 0 4px;font-size:12px;color:#6d28d9;font-weight:600;">DATE</p><p style="margin:0;">{{eventDate}}</p>`)],
        [text(`<p style="margin:0 0 4px;font-size:12px;color:#6d28d9;font-weight:600;">TIME</p><p style="margin:0;">{{eventTime}}</p>`)],
        [text(`<p style="margin:0 0 4px;font-size:12px;color:#6d28d9;font-weight:600;">WHERE</p><p style="margin:0;">{{venue}}</p>`)],
      ],
      { ratios: [4, 4, 4], background: '#f5f3ff', padding: pad(20, 32) },
    ),
    row(
      [[
        text('<p style="margin:0 0 8px;"><strong>Agenda</strong></p><p style="margin:0;">18:00 · Doors and drinks<br>18:30 · Talks<br>19:30 · Demos and Q&amp;A<br>20:30 · Close</p>'),
        divider(pad(16, 0)),
        button('RSVP now', '{{rsvpUrl}}', { color: '#6d28d9', align: 'center', fullWidth: true }),
        text(`<p style="margin:0;color:${MUTED};font-size:13px;">Places are limited. Please reply by {{rsvpDeadline}}.</p>`, 'center', pad(8, 0, 0)),
      ]],
      { background: '#ffffff', padding: pad(24, 32, 32) },
    ),
    marketingFooter(),
  ],
);

const productLaunch = template(
  {
    id: 'product-launch',
    name: 'Product launch',
    description: 'Launch announcement with a hero, three feature highlights and a primary CTA.',
    category: 'announcement',
    previewText: 'Introducing {{productName}}.',
    background: '#0f172a',
  },
  ({ row, text, button, image, marketingFooter }) => [
    row(
      [[
        text('<p style="margin:0 0 12px;font-size:12px;color:#38bdf8;font-weight:600;letter-spacing:2px;">NEW</p><h1 style="margin:0 0 12px;font-size:34px;color:#ffffff;">Meet {{productName}}</h1><p style="margin:0;color:#cbd5e1;font-size:17px;">The fastest way to ship the thing your team keeps putting off.</p>', 'center'),
        button('See what’s new', '{{productUrl}}', { color: '#0284c7', align: 'center' }),
      ]],
      { padding: pad(48, 32, 24) },
    ),
    row([[image('https://placehold.co/560x320/1e293b/94a3b8?text=Product+screenshot', 'Product screenshot', { radius: 8 })]], { padding: pad(0, 20, 32) }),
    row(
      [
        [text('<p style="margin:0 0 6px;font-size:16px;"><strong>Faster</strong></p><p style="margin:0;color:#475569;font-size:14px;">Starts in under a second, even on large projects.</p>')],
        [text('<p style="margin:0 0 6px;font-size:16px;"><strong>Simpler</strong></p><p style="margin:0;color:#475569;font-size:14px;">One settings page instead of twelve.</p>')],
        [text('<p style="margin:0 0 6px;font-size:16px;"><strong>Yours</strong></p><p style="margin:0;color:#475569;font-size:14px;">Export everything, any time, in open formats.</p>')],
      ],
      { ratios: [4, 4, 4], background: '#ffffff', padding: pad(32, 24) },
    ),
    row(
      [[
        text(`<p style="margin:0;">{{firstName}}, existing customers get {{productName}} at no extra cost from today.</p>`, 'center'),
        button('Try it now', '{{productUrl}}', { align: 'center' }),
      ]],
      { background: '#ffffff', padding: pad(0, 32, 32) },
    ),
    marketingFooter(),
  ],
);

const abandonedCart = template(
  {
    id: 'abandoned-cart',
    name: 'Abandoned cart',
    description: 'Friendly reminder with the saved item, price and a return-to-cart button.',
    category: 'promo',
    previewText: 'You left something in your cart.',
    background: '#fdf6ee',
  },
  ({ row, text, button, image, divider, logo, marketingFooter }) => [
    logo('#9a3412'),
    row(
      [[
        text(`<h1 style="margin:0 0 12px;font-size:26px;color:${INK};">Still thinking it over?</h1><p style="margin:0;">Hi {{firstName}}, you left something in your cart. We've saved it for you, but stock is limited.</p>`),
      ]],
      { background: '#ffffff', padding: pad(32, 32, 16) },
    ),
    row(
      [
        [image('https://placehold.co/200x200/fed7aa/9a3412?text=Item', '{{cartItemName}}', { width: 160, radius: 6, href: '{{cartUrl}}' })],
        [text('<p style="margin:0 0 4px;font-size:18px;"><strong>{{cartItemName}}</strong></p><p style="margin:0 0 4px;color:#64748b;">Qty {{cartItemQuantity}}</p><p style="margin:0;font-size:18px;">{{cartItemPrice}}</p>')],
      ],
      { ratios: [5, 7], background: '#ffffff', padding: pad(8, 32), align: 'middle' },
    ),
    row(
      [[
        divider(pad(16, 0)),
        button('Return to your cart', '{{cartUrl}}', { color: '#ea580c', fullWidth: true }),
        text(`<p style="margin:0;color:${MUTED};font-size:13px;">Free returns within 30 days. Need help? Reply to this email.</p>`, 'center', pad(8, 0, 0)),
      ]],
      { background: '#ffffff', padding: pad(8, 32, 32) },
    ),
    marketingFooter(),
  ],
);

const monthlyDigest = template(
  {
    id: 'monthly-digest',
    name: 'Monthly digest',
    description: 'Round-up with a lead story, two secondary stories and a numbers strip.',
    category: 'newsletter',
    previewText: 'Your {{month}} round-up from {{company}}.',
    background: '#f8fafc',
  },
  ({ row, text, button, image, divider, logo, marketingFooter }) => [
    logo(),
    row(
      [[text(`<p style="margin:0;color:${MUTED};font-size:13px;">{{month}} digest · Issue {{issueNumber}}</p>`)]],
      { padding: pad(0, 32, 16) },
    ),
    row(
      [[
        image('https://placehold.co/536x240/cbd5e1/334155?text=Lead+story', 'Lead story', { radius: 6, href: 'https://example.com/lead' }),
        text(`<h2 style="margin:16px 0 8px;font-size:22px;color:${INK};">What we shipped this month</h2><p style="margin:0;">A faster editor, a cleaner export and a long-requested dark mode. Here is the short version, {{firstName}}.</p>`),
        button('Read the full story', 'https://example.com/lead'),
      ]],
      { background: '#ffffff', padding: pad(32) },
    ),
    row(
      [
        [
          image('https://placehold.co/260x160/e2e8f0/475569?text=Story+two', 'Story two', { radius: 6, href: 'https://example.com/two' }),
          text('<p style="margin:12px 0 4px;"><strong>How one team halved its send time</strong></p><p style="margin:0;color:#475569;font-size:14px;">A customer story in five charts.</p>'),
        ],
        [
          image('https://placehold.co/260x160/e2e8f0/475569?text=Story+three', 'Story three', { radius: 6, href: 'https://example.com/three' }),
          text('<p style="margin:12px 0 4px;"><strong>Five layouts that work in every inbox</strong></p><p style="margin:0;color:#475569;font-size:14px;">Tested in Outlook, Gmail and Apple Mail.</p>'),
        ],
      ],
      { ratios: [6, 6], background: '#ffffff', padding: pad(0, 32, 24) },
    ),
    row([[divider()]], { background: '#ffffff', padding: pad(0, 32) }),
    row(
      [
        [text(`<p style="margin:0;font-size:24px;font-weight:700;color:${INK};">{{stat1}}</p><p style="margin:0;color:${MUTED};font-size:13px;">emails sent</p>`, 'center')],
        [text(`<p style="margin:0;font-size:24px;font-weight:700;color:${INK};">{{stat2}}</p><p style="margin:0;color:${MUTED};font-size:13px;">new customers</p>`, 'center')],
        [text(`<p style="margin:0;font-size:24px;font-weight:700;color:${INK};">{{stat3}}</p><p style="margin:0;color:${MUTED};font-size:13px;">uptime</p>`, 'center')],
      ],
      { ratios: [4, 4, 4], background: '#ffffff', padding: pad(16, 32, 32) },
    ),
    marketingFooter(),
  ],
);

export const GALLERY_TEMPLATES: readonly Template[] = Object.freeze([
  orderConfirmation,
  shippingUpdate,
  passwordReset,
  invoice,
  eventInvite,
  productLaunch,
  abandonedCart,
  monthlyDigest,
]);
