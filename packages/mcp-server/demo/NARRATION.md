# 90-second reference clip — narration + shot list

**Premise:** an AI agent builds a real, sendable transactional email from one
prompt, using `@lit-pigeon/mcp-server`. No drag-and-drop, no proprietary editor.

**Assets you already have:**
- `out/demo.cast` → `demo.gif` (the terminal session, ~14 s)
- `out/order-confirmation.html` (the rendered email — open in a browser for the reveal)

Pace the 14 s cast to fill ~50 s of screen time (agg `--speed 0.4`, or just
let it play and hold on the final frame). Three scenes: **terminal → browser → CTA.**

---

| Time | On screen | Voiceover | Caption (burn-in) |
|---|---|---|---|
| **0:00–0:06** | Black → title card: "Lit Pigeon" + tagline. Cursor logo + "MCP" badge. | "Email's the last thing devs still build by hand. Watch an AI agent do it instead." | `Open-source email, built by an AI agent` |
| **0:06–0:14** | Cut to terminal. The prompt types in (cyan `you ›` line). | "One prompt. We ask for a transactional order-confirmation — logo, heading, order summary, a branded button." | `One prompt → a sendable email` |
| **0:14–0:22** | `lit-pigeon is building your email…` then the first few `⏺ create_document / add_row` lines tick in. | "The agent calls the Lit Pigeon MCP server — these are real tool calls against a real document model." | `@lit-pigeon/mcp-server · 27 tools` |
| **0:22–0:40** | The `add_block` lines stream — image, headings, order summary, the indigo button, divider, footer. Each `✓ <id>`. | "Logo, heading, the line items, a call-to-action button in the brand color, footer fine print — block by block, thirteen calls." | `Real document model — not HTML soup` |
| **0:40–0:48** | `render_to_html` → the green `✓ rendered cleanly — 11.1 kB · 0 errors`. | "Then it renders to email-safe HTML. Eleven kilobytes, zero errors, Outlook workarounds baked in." | `Email-safe HTML · Outlook-ready` |
| **0:48–1:05** | Cut to browser: `order-confirmation.html` open. Slow scroll through the rendered email. | "And this is the actual output — a clean, responsive order confirmation you can drop into Litmus or send through any provider." | `This is the real rendered email` |
| **1:05–1:18** | Split or quick cuts: the live editor at lit-pigeon.wearesnx.studio + `npm i @lit-pigeon/editor`. | "It's also a full visual editor when you want one. MIT-licensed, framework-agnostic, on npm today." | `npm i @lit-pigeon/editor` |
| **1:18–1:30** | End card: logo, demo URL, GitHub URL. | "Lit Pigeon. Open-source email for humans and agents. Link below." | `lit-pigeon.wearesnx.studio · github.com/snxstudio/lit-pigeon` |

---

## Tighter 60-second cut

Drop the browser scroll to a 4-second hold and merge scenes 4–5:

- 0:00–0:06 hook + title
- 0:06–0:12 prompt
- 0:12–0:38 tool calls stream → render
- 0:38–0:48 browser reveal (hold, no scroll)
- 0:48–0:60 CTA end card

## Voiceover-free version (captions only)

If you'd rather not record audio, the burn-in captions above stand alone — set
each as a 2–3 s lower-third over the matching beat and add a soft keyboard/click
SFX on the prompt and a chime on the green `✓ rendered cleanly`.

## Show HN / post copy to ship alongside

> **Show HN: Lit Pigeon – an open-source email editor an AI agent can drive (MCP)**
>
> It's an MIT, framework-agnostic drag-and-drop email editor (React/Vue/Angular/
> Svelte/vanilla) — but the part I'm proud of is `@lit-pigeon/mcp-server`: 27
> tools that let Cursor/Claude build and render a real email from a prompt. The
> clip shows it building a transactional order-confirmation end to end. Renders
> to Outlook-safe HTML. Live demo + npm in the README.
