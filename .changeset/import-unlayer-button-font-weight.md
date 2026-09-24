---
'@lit-pigeon/import-unlayer': patch
---

Read the button font weight from the Unlayer design instead of pinning every imported button to `600`. Keyword weights (`normal`, `bold`) and numeric ones are both carried across, whether the design stores the number as a number or as a string; designs that leave the field unset still import as `600`.
