---
'@lit-pigeon/parser-mjml': patch
---

mj-navbar `base-url` is now applied to the link hrefs on import, as MJML does. Previously it was ignored, so relative links such as `/tracking` were saved without their domain.
