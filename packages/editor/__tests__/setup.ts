// Vitest setup — runs before any test file.
//
// The editor template always contains <pigeon-rich-text-bubble>, but in
// production that component is registered lazily (it ships in the code-split
// rich-text chunk). Under happy-dom, connecting an element whose custom-element
// definition hasn't fully upgraded trips the CustomElementReactionStack
// ("createRenderRoot is not a function"), which made editor-mounting tests
// flaky. Registering the lightweight rich-text UI components here — they only
// *type*-import TipTap, so this pulls in no engine code — removes the
// registration race without changing production code-splitting.
import '../src/rich-text/ui/bubble.js';
import '../src/rich-text/ui/format-panel.js';
