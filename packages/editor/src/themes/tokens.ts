import { css, type CSSResult } from 'lit';

/**
 * Design tokens for the Pigeon editor — a shadcn-inspired system built on a
 * neutral slate scale with an indigo brand accent, soft radii, layered
 * shadows and an explicit focus ring.
 *
 * These are the single source of truth for editor chrome. Every internal
 * component styles itself with `var(--pigeon-*, fallback)`, so overriding any
 * of these variables — either from light DOM (`pigeon-editor { --pigeon-…: … }`)
 * or via the `theme` property's token map — re-skins the whole editor.
 *
 * Light tokens live on `:host`. Dark tokens are applied when the host carries
 * `.pigeon-dark` (set by `theme="dark"`) or `.pigeon-auto` under
 * `prefers-color-scheme: dark` (set by `theme="auto"`). The editor toggles
 * those classes; see `PigeonEditor.theme`.
 */

/**
 * Dark-mode variable overrides, authored once and shared between the explicit
 * `.pigeon-dark` selector and the `prefers-color-scheme` media query so the
 * two never drift. This is a bare declaration block — only ever interpolated
 * into a real rule below, never registered as a stylesheet on its own.
 */
const darkVars: CSSResult = css`
  /* base palette */
  --pigeon-bg: #0f172a; /* slate-900 */
  --pigeon-surface: #1e293b; /* slate-800 */
  --pigeon-surface-hover: #334155; /* slate-700 */
  --pigeon-muted: #1e293b;
  --pigeon-muted-foreground: #94a3b8; /* slate-400 */
  --pigeon-text: #f8fafc; /* slate-50 */
  --pigeon-text-secondary: #94a3b8;
  --pigeon-border: #334155; /* slate-700 */
  --pigeon-input: #475569; /* slate-600 */

  /* brand */
  --pigeon-primary: #6366f1; /* indigo-500 reads brighter on dark */
  --pigeon-primary-hover: #818cf8; /* indigo-400 */
  --pigeon-primary-foreground: #ffffff;
  --pigeon-accent: #312e81; /* indigo-900 */
  --pigeon-accent-foreground: #c7d2fe; /* indigo-200 */
  --pigeon-ring: #818cf8; /* indigo-400 */

  /* status */
  --pigeon-danger: #f87171; /* red-400 */
  --pigeon-danger-foreground: #ffffff;
  --pigeon-success: #4ade80; /* green-400 */
  --pigeon-success-foreground: #052e16;

  /* canvas */
  --pigeon-canvas-bg: #020617; /* slate-950 */

  /* shadows */
  --pigeon-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --pigeon-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4);
  --pigeon-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4),
    0 2px 4px -2px rgb(0 0 0 / 0.4);
  --pigeon-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5),
    0 4px 6px -4px rgb(0 0 0 / 0.5);
`;

/**
 * Complete token sheet: light defaults plus the two dark-mode activation
 * paths. Imported into `PigeonEditor.styles`.
 */
export const themeStyles: CSSResult = css`
  :host {
    /* base palette */
    --pigeon-bg: #ffffff;
    --pigeon-surface: #f8fafc; /* slate-50 */
    --pigeon-surface-hover: #f1f5f9; /* slate-100 */
    --pigeon-muted: #f1f5f9; /* slate-100 — subtle fills */
    --pigeon-muted-foreground: #64748b; /* slate-500 */
    --pigeon-text: #0f172a; /* slate-900 */
    --pigeon-text-secondary: #64748b; /* slate-500 */
    --pigeon-border: #e2e8f0; /* slate-200 */
    --pigeon-input: #cbd5e1; /* slate-300 — input borders */
    --pigeon-border-focus: var(--pigeon-ring);

    /* brand */
    --pigeon-primary: #4f46e5; /* indigo-600 */
    --pigeon-primary-hover: #4338ca; /* indigo-700 */
    --pigeon-primary-foreground: #ffffff;
    --pigeon-accent: #eef2ff; /* indigo-50 — subtle accent fill */
    --pigeon-accent-foreground: #4338ca; /* indigo-700 */
    --pigeon-ring: #6366f1; /* indigo-500 — focus ring */
    /* Reusable focus halo — recomputes from --pigeon-ring in any theme. */
    --pigeon-ring-shadow: 0 0 0 3px
      color-mix(in srgb, var(--pigeon-ring) 30%, transparent);

    /* status */
    --pigeon-danger: #ef4444; /* red-500 */
    --pigeon-danger-foreground: #ffffff;
    --pigeon-success: #22c55e; /* green-500 */
    --pigeon-success-foreground: #ffffff;

    /* canvas */
    --pigeon-canvas-bg: #f1f5f9; /* slate-100 */
    --pigeon-drop-color: var(--pigeon-primary);
    --pigeon-selected-outline: var(--pigeon-primary);

    /* radii — shadcn-ish soft corners */
    --pigeon-radius: 0.5rem; /* 8px */
    --pigeon-radius-sm: 0.375rem; /* 6px */
    --pigeon-radius-lg: 0.75rem; /* 12px */

    /* typography */
    --pigeon-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
      sans-serif;
    --pigeon-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

    /* shadows */
    --pigeon-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --pigeon-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --pigeon-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    --pigeon-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);

    /* layout */
    --pigeon-palette-width: 248px;
    --pigeon-properties-width: 312px;
    --pigeon-toolbar-height: 52px;
  }

  :host(.pigeon-dark) {
    ${darkVars}
  }

  @media (prefers-color-scheme: dark) {
    :host(.pigeon-auto) {
      ${darkVars}
    }
  }
`;
