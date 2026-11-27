/**
 * The renderer emits a few non-inline `<mj-style>` blocks of its own — device
 * visibility, link styling — and the parser has to tell them from CSS a user
 * wrote. Without that it collects them into `body.attributes.css`, and the next
 * export emits each one twice: once because the renderer still generates it,
 * once out of `css`. That repeats every cycle.
 *
 * Every generated block opens with this comment and a name, so the parser can
 * skip it and, where the name says so, read it back into the field it came
 * from. Matching on the rules themselves would work until either side is
 * edited; the marker is the contract instead.
 */
const PREFIX = '/* pigeon-generated:';

/** The comment that opens a generated style block. */
export function generatedStyleMarker(name: string): string {
  return `${PREFIX} ${name} */`;
}

/** The name in `css`'s marker, or undefined if the renderer did not write it. */
export function generatedStyleName(css: string): string | undefined {
  return /^\s*\/\*\s*pigeon-generated:\s*([\w-]+)\s*\*\//.exec(css)?.[1];
}
