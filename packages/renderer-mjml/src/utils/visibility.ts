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
  const open = cls && /^\s*<mj-([\w-]+)/.exec(markup);
  const end = open && open[1] !== 'raw' ? markup.search(/ ?\/?>/) : -1;
  if (end < 0) return markup;
  const tag = markup.slice(0, end);
  return (tag.includes(' css-class="') ? tag.replace(/( css-class="[^"]*)/, `$1 ${cls}`) : `${tag} css-class="${cls}"`) + markup.slice(end);
}

/**
 * Hide-on-desktop is the default state; the mobile media query (MJML's own
 * 479px breakpoint) swaps it for hide-on-mobile. mj-column adds a
 * `<class>-outlook` class to its Outlook table cell, which is hidden too.
 * The mobile hide rule comes last, at the restore rules' specificity, so an
 * element hidden on both stays hidden on mobile.
 */
export const VISIBILITY_STYLE = `    <mj-style>
      .pigeon-hide-desktop, .pigeon-hide-desktop-outlook { display: none !important; mso-hide: all !important; }
      @media only screen and (max-width:479px) {
        td.pigeon-hide-desktop { display: table-cell !important; }
        div.pigeon-hide-desktop { display: block !important; }
        .pigeon-hide-mobile, td.pigeon-hide-mobile, div.pigeon-hide-mobile { display: none !important; }
      }
    </mj-style>`;
