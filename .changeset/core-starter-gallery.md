---
'@lit-pigeon/core': minor
---

Add eight starter templates: order confirmation, shipping update, password reset, invoice, event invite, product launch, abandoned cart and monthly digest. They are code-split and loaded with `loadGalleryTemplates()`, and `InMemoryTemplateStorage` merges them in on first access (unless `includeStarters: false`), so the editor's template picker and the MCP server's `list_templates` show all twelve without adding them to the eager bundle.
