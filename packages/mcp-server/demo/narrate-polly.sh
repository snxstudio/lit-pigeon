#!/usr/bin/env bash
# Generate the voiceover with Amazon Polly (generative engine) — far more natural
# than macOS `say`. Produces one file per beat plus a combined narration.m4a, same
# layout as narrate.sh, so build-video.sh picks it up unchanged.
#
# Requires: aws CLI configured (Polly: SynthesizeSpeech), ffmpeg.
# Override voice/engine: VOICE=Matthew ENGINE=generative bash narrate-polly.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-$HERE/out/audio}"
VOICE="${VOICE:-Ruth}"        # Ruth/Joanna/Danielle (warm female), Matthew/Stephen (male)
ENGINE="${ENGINE:-generative}"
GAP="${GAP:-0.5}"
mkdir -p "$OUT"

LINES=(
  "01-hook|Email is the last thing developers still build by hand. Watch an AI agent do it instead."
  "02-prompt|One prompt. We ask for a transactional order confirmation — logo, heading, the order summary, and a branded button."
  "03-build|The agent calls the Lit Pigeon MCP server. These are real tool calls against a real document model. Logo, heading, the line items, a call-to-action button in the brand color, footer fine print — block by block, thirteen calls."
  "04-render|Then it renders to email-safe HTML. Eleven kilobytes, zero errors, Outlook workarounds baked in. And this is the actual output: a clean, responsive order confirmation you can drop into Litmus, or send through any provider."
  "05-cta|Lit Pigeon is also a full visual editor when you want one. MIT licensed, framework agnostic, and on npm today. Open-source email for humans and agents. Link in the description."
)

echo "voice=$VOICE engine=$ENGINE → $OUT"
silence="$OUT/.gap.m4a"
ffmpeg -y -f lavfi -i "anullsrc=channel_layout=mono:sample_rate=44100" -t "$GAP" -c:a aac "$silence" -loglevel error
concat="$OUT/.concat.txt"; : > "$concat"

for entry in "${LINES[@]}"; do
  name="${entry%%|*}"; text="${entry#*|}"
  mp3="$OUT/$name.mp3"; m4a="$OUT/$name.m4a"
  aws polly synthesize-speech \
    --engine "$ENGINE" --voice-id "$VOICE" \
    --output-format mp3 --text "$text" "$mp3" >/dev/null
  ffmpeg -y -i "$mp3" -ac 1 -ar 44100 -c:a aac "$m4a" -loglevel error
  rm -f "$mp3"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$m4a")
  printf "  %-10s %5.1fs  %s…\n" "$name" "$dur" "$(echo "$text" | cut -c1-46)"
  echo "file '$m4a'" >> "$concat"
  echo "file '$silence'" >> "$concat"
done

ffmpeg -y -f concat -safe 0 -i "$concat" -c copy "$OUT/narration.m4a" -loglevel error
total=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/narration.m4a")
rm -f "$concat" "$silence"
printf "\n✓ narration.m4a  %.1fs total (voice=%s)\n" "$total" "$VOICE"
