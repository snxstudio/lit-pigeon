import { css } from 'lit';

/**
 * Shared property-panel styling — the common label / text input / textarea /
 * select / number-field rules that every panel needs. Imported into each
 * panel's `static styles` array so the CSS lives once instead of being copied
 * into a dozen components.
 *
 * Aesthetic target: shadcn/ui inputs. Heights and padding match shadcn's
 * `Input` component (h-9 + px-3 + text-sm). Hover darkens the border using
 * `color-mix` so the same rule works in light and dark theme without
 * declaring a separate `--pigeon-input-hover` token.
 */
export const panelStyles = css`
  :host {
    display: block;
  }

  h3 {
    margin: 0 0 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--pigeon-text, #1e293b);
    font-family: var(--pigeon-font);
    letter-spacing: -0.01em;
  }

  .field {
    margin-bottom: 14px;
  }

  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--pigeon-text-secondary, #64748b);
    margin-bottom: 6px;
    font-family: var(--pigeon-font);
    line-height: 1.4;
  }

  input[type='text'],
  input[type='url'],
  input[type='number'],
  textarea,
  select {
    width: 100%;
    border: 1px solid var(--pigeon-input, #cbd5e1);
    border-radius: var(--pigeon-radius-sm, 6px);
    padding: 0 12px;
    font-family: var(--pigeon-font);
    font-size: 14px;
    line-height: 1.4;
    color: var(--pigeon-text, #1e293b);
    background: var(--pigeon-bg, #ffffff);
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease,
      background-color 0.15s ease;
  }

  input[type='text'],
  input[type='url'],
  input[type='number'],
  select {
    height: 36px;
  }

  select {
    cursor: pointer;
    /* Custom caret — the native one varies wildly by browser/theme. Embedded
       SVG keeps the asset count at zero and the colour follows the text
       token via 'currentColor' through stroke. */
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 12px 12px;
    padding-right: 32px;
  }

  textarea {
    min-height: 80px;
    padding: 8px 12px;
    resize: vertical;
  }

  /* Hover — darken the border slightly without leaving the resting state.
     color-mix lets one rule cover both light and dark themes. */
  input[type='text']:hover:not(:focus-visible):not(:disabled),
  input[type='url']:hover:not(:focus-visible):not(:disabled),
  input[type='number']:hover:not(:focus-visible):not(:disabled),
  textarea:hover:not(:focus-visible):not(:disabled),
  select:hover:not(:focus-visible):not(:disabled) {
    border-color: color-mix(
      in srgb,
      var(--pigeon-input, #cbd5e1) 60%,
      var(--pigeon-text, #0f172a)
    );
  }

  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    border-color: var(--pigeon-ring);
    box-shadow: var(--pigeon-ring-shadow);
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--pigeon-text-secondary, #64748b);
    opacity: 0.6;
  }

  input:disabled,
  textarea:disabled,
  select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--pigeon-muted, #f1f5f9);
  }

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Toggle switch — label left, switch right. Shared by the Full Width rows
     (button/row panels) and the schema-driven checkbox field, so boolean
     options look the same everywhere instead of falling back to the native
     checkbox. */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .toggle-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--pigeon-text-secondary, #64748b);
    font-family: var(--pigeon-font);
  }

  .toggle {
    position: relative;
    width: 40px;
    height: 22px;
    flex-shrink: 0;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-track {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--pigeon-border, #e2e8f0);
    border-radius: 11px;
    transition: background 0.2s ease;
  }

  .toggle-track::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    left: 2px;
    top: 2px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: var(--pigeon-shadow-sm);
  }

  .toggle input:checked + .toggle-track {
    background: var(--pigeon-primary, #4f46e5);
  }

  .toggle input:checked + .toggle-track::after {
    transform: translateX(18px);
  }

  .toggle input:focus-visible + .toggle-track {
    box-shadow: var(--pigeon-ring-shadow);
  }

  /* Secondary action button (e.g. "Upload Image") — matches the input
     chrome so panel actions don't read as unstyled native buttons. */
  .btn-secondary {
    height: 32px;
    padding: 0 12px;
    border: 1px solid var(--pigeon-input, #cbd5e1);
    border-radius: var(--pigeon-radius-sm, 6px);
    background: var(--pigeon-bg, #ffffff);
    color: var(--pigeon-text, #1e293b);
    cursor: pointer;
    font-family: var(--pigeon-font);
    font-size: 12px;
    font-weight: 500;
    transition: background 0.15s ease, border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .btn-secondary:hover {
    background: var(--pigeon-surface-hover, #f1f5f9);
    border-color: color-mix(
      in srgb,
      var(--pigeon-input, #cbd5e1) 60%,
      var(--pigeon-text, #0f172a)
    );
  }

  .btn-secondary:focus-visible {
    outline: none;
    border-color: var(--pigeon-ring);
    box-shadow: var(--pigeon-ring-shadow);
  }
`;
