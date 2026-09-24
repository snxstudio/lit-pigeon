import { html, css } from 'lit';
import type { DeviceVisibility } from '@lit-pigeon/core';

/** Tablet previews at 768px, above MJML's 480px breakpoint, so it follows desktop. */
export function hiddenOnDevice(v: DeviceVisibility, device: string): boolean {
  return !!(device === 'mobile' ? v.hideOnMobile : v.hideOnDesktop);
}

export function visibilityBadge(v: DeviceVisibility) {
  const on = [v.hideOnMobile && 'mobile', v.hideOnDesktop && 'desktop'].filter(Boolean).join(' and ');
  return on ? html`<span class="visibility-badge">Hidden on ${on}</span>` : '';
}

export const visibilityStyles = css`
  .device-hidden {
    display: none !important;
  }

  .visibility-badge {
    position: absolute;
    top: 2px;
    left: 2px;
    z-index: 5;
    padding: 1px 6px;
    border-radius: 3px;
    background: var(--pigeon-muted, #f1f5f9);
    color: var(--pigeon-muted-foreground, #64748b);
    font-family: var(--pigeon-font);
    font-size: 10px;
    pointer-events: none;
  }
`;
