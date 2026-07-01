# Reference clip — build an email from an AI prompt

Generates the "build a transactional email from a Cursor prompt with
`@lit-pigeon/mcp-server`" demo, end to end. It spawns the **real** MCP server
over stdio and runs the actual tool-call sequence an AI agent would issue, then
renders the result to HTML. The terminal recording is built from that live run —
block ids, byte size and error count all come from real server responses,
nothing is faked.

## Generate

```bash
pnpm --filter @lit-pigeon/mcp-server build   # ensure dist/ is current
node packages/mcp-server/demo/generate.mjs
```

Outputs into `demo/out/`:

| File | What it is |
|---|---|
| `order-confirmation.html` | the real rendered email (open in a browser) |
| `demo.cast` | asciinema v2 recording of the agent session (~14 s) |

## Turn the cast into a shareable GIF / MP4

```bash
brew install agg          # one-time (asciinema gif generator)
agg packages/mcp-server/demo/out/demo.cast demo.gif
```

Or play it locally: `asciinema play packages/mcp-server/demo/out/demo.cast`.

For an MP4 (e.g. for Twitter/Show HN), convert the GIF with ffmpeg:

```bash
ffmpeg -i demo.gif -movflags faststart -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" demo.mp4
```

## Customise

Edit `generate.mjs`: the `PROMPT` string (the narration line shown to the
viewer) and the `call(...)` sequence (the actual email being built). Re-run to
regenerate both artifacts. `cast.mjs` is a tiny dependency-free asciinema-v2
writer (typewriter + timing helpers) if you want to restyle the scene.
