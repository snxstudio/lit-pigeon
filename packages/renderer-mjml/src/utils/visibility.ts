import type { DeviceVisibility } from '@lit-pigeon/core';

/** The hide classes for an element's visibility flags, or '' when it shows everywhere. */
export function visibilityClass(v: DeviceVisibility): string {
  return [v.hideOnMobile && 'pigeon-hide-mobile', v.hideOnDesktop && 'pigeon-hide-desktop'].filter(Boolean).join(' ');
}

/**
 * Adds `cls` to the `css-class` of the MJML element that opens `markup`,
 * keeping any class already there. `mj-raw` takes no css-class, so markup
 * that opens with it (or with anything other than an `mj-` tag) is returned
 * unchanged.
 */
export function withCssClass(markup: string, cls: string): string {
  if (!cls) return markup;
  return markup.replace(/^\s*<mj-(?!raw\b)[\w-]+[^>]*?(?=\/?>)/, (tag) =>
    / css-class="/.test(tag) ? tag.replace(/( css-class="[^"]*)/, `$1 ${cls}`) : `${tag} css-class="${cls}"`,
  );
}

/**
 * Hide-on-desktop is the default state; the mobile media query (MJML's own
 * 479px breakpoint) swaps it for hide-on-mobile. mj-column adds a
 * `<class>-outlook` class to its Outlook table cell, which is hidden too.
 */
export const VISIBILITY_STYLE = `    <mj-style>
      .pigeon-hide-desktop, .pigeon-hide-desktop-outlook { display: none !important; mso-hide: all !important; }
      @media only screen and (max-width:479px) {
        .pigeon-hide-mobile { display: none !important; }
        td.pigeon-hide-desktop { display: table-cell !important; }
        div.pigeon-hide-desktop { display: block !important; }
      }
    </mj-style>`;
