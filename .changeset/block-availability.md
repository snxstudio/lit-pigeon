---
'@lit-pigeon/core': minor
'@lit-pigeon/editor': minor
'@lit-pigeon/mcp-server': minor
---

Let a host choose which blocks the editor offers, with `EditorConfig.blocks`.

The palette rendered every registered block unconditionally, so an embedder who needed a subset — a platform that cannot host arbitrary markup and must remove the `html` block, a transactional product that wants text, image and button only — had to fork the palette component.

```ts
editor.config = { blocks: ['text', 'image', 'button'] };
```

The list sets both membership and palette order. Unset means every registered block, which is the default, and a listed type nobody registered is skipped.

The restriction is enforced in the `insertBlock` command rather than by hiding the palette chip, so the keyboard and paste paths are held to it too — a chip is only one of the routes into insertion. `DocumentStore.addBlock` in `@lit-pigeon/mcp-server` mutates the document directly instead of going through commands, so it checks availability itself and throws for an unavailable type.

Availability gates insertion, not rendering: a document that already contains an omitted type still renders, so narrowing the palette never blanks a saved template.

Like `locale`, the setting is global to the page — the last editor to apply it wins for every instance.
