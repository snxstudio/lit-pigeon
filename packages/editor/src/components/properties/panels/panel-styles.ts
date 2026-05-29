import { css } from 'lit';

/**
 * Shared property-panel styling — the common label / text input / textarea /
 * select / number-field rules that every panel needs. Imported into each
 * panel's `static styles` array so the CSS lives once instead of being copied
 * into a dozen components.
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
  }

  .field {
    margin-bottom: 12px;
  }

  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--pigeon-text-secondary, #64748b);
    margin-bottom: 4px;
    font-family: var(--pigeon-font);
  }

  input[type='text'],
  input[type='url'],
  input[type='number'],
  textarea,
  select {
    width: 100%;
    border: 1px solid var(--pigeon-input, #cbd5e1);
    border-radius: var(--pigeon-radius-sm, 4px);
    padding: 0 8px;
    font-family: var(--pigeon-font);
    font-size: 13px;
    color: var(--pigeon-text, #1e293b);
    background: var(--pigeon-bg, #ffffff);
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  input[type='text'],
  input[type='url'],
  input[type='number'],
  select {
    height: 32px;
  }

  select {
    cursor: pointer;
  }

  textarea {
    min-height: 80px;
    padding: 8px;
    resize: vertical;
  }

  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    border-color: var(--pigeon-ring);
    box-shadow: var(--pigeon-ring-shadow);
  }

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;
