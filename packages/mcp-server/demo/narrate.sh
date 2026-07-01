#!/usr/bin/env bash
# Generate the voiceover for the reference clip using macOS `say` (TTS),
# one file per narration beat plus a combined track. Re-run after editing the
# LINES below. Requires: say (built in), ffmpeg.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="${1:-$HERE/out/audio}"
VOICE="${VOICE:-Samantha}"
RATE="${RATE:-168}"   # words per minute
GAP="${GAP:-0.5}"     # seconds of silence between beats in the combined track

mkdir -p "$OUT"

# One entry per beat: "filename|spoken text"
LINES=(
  "01-hook|Email is the last thing developers still build by hand. Watch an A.I. agent do it instead."
  "02-prompt|One prompt. We ask for a transactional order confirmation — logo, heading, order summary, and a branded button."
  "03-build|The agent calls the Lit Pigeon M.C.P. server. These are real tool calls against a real document model. Logo, heading, the line items, a call-to-action button in the brand color, footer fine print — block by block, thirteen calls."
  "04-render|Then it renders to email-safe H.T.M.L. Eleven kilobytes, zero errors, Outlook workarounds baked in. And this is the actual output — a clean, responsive order confirmation you can drop into Litmus or send through any provider."
  "05-cta|Lit Pigeon is also a full visual editor when you want one. M.I.T. licensed, framework agnostic, and on N.P.M. today. Open-source email for humans and agents. Link below."
)

echo "voice=$VOICE rate=$RATE → $OUT"
concat_list="$OUT/.concat.txt"
: > "$concat_list"

# Build a short silence clip to insert between beats.
silence="$OUT/.gap.m4a"
ffmpeg -y -f lavfi -i "anullsrc=channel_layout=mono:sample_rate=44100" -t "$GAP" -c:a aac "$silence" >/dev/null 2>&1

for entry in "${LINES[@]}"; do
  name="${entry%%|*}"
  text="${entry#*|}"
  aiff="$OUT/$name.aiff"
  m4a="$OUT/$name.m4a"
  say -v "$VOICE" -r "$RATE" -o "$aiff" "$text"
  ffmpeg -y -i "$aiff" -ac 1 -ar 44100 -c:a aac "$m4a" >/dev/null 2>&1
  rm -f "$aiff"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$m4a")
  printf "  %-10s %5.1fs  %s\n" "$name" "$dur" "$(echo "$text" | cut -c1-48)…"
  echo "file '$m4a'" >> "$concat_list"
  echo "file '$silence'" >> "$concat_list"
done

# Combined narration track.
ffmpeg -y -f concat -safe 0 -i "$concat_list" -c copy "$OUT/narration.m4a" >/dev/null 2>&1
total=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/narration.m4a")
rm -f "$concat_list" "$silence"
printf "\n✓ narration.m4a  %.1fs total → %s\n" "$total" "$OUT"
