# Email-client rendering proof

Screenshots backing the "Tested across email clients" section in the root README.

## How to regenerate the source HTML

```bash
node packages/ssr/render-starters.mjs ./docs/email-proof/html
```

Produces one file per starter template (`starter-welcome.html`,
`starter-newsletter.html`, `starter-transactional.html`, `starter-promo.html`)
with sample merge-tag values filled in. This is the same output as the editor's
**Export to HTML**.

## How to capture the screenshots

1. Paste each `.html` into [Litmus](https://litmus.com) or
   [Email on Acid](https://www.emailonacid.com) (free tiers cover the clients below).
2. Screenshot each client and save with the exact filenames the README expects:

| File | Template | Client |
|---|---|---|
| `welcome-gmail.png` | Welcome | Gmail (web) |
| `newsletter-apple-mail.png` | Newsletter | Apple Mail |
| `transactional-outlook.png` | Transactional | Outlook 2016 (Win) |
| `promo-ios.png` | Promo / Sale | iOS Mail |

Add more as you capture them, and extend the matrix/table in the root README to match.
