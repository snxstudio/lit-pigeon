#!/usr/bin/env bash
# Assemble the narrated 90s-style reference clip from its parts.
# Requires: ffmpeg. Produces out/lit-pigeon-demo.mp4 (~54s, 1280x720, VO included).
#
# Inputs expected in out/ (regenerate with the steps noted):
#   demo.cast / demo.mp4   -> node demo/generate.mjs  (then: agg + ffmpeg, see README.md)
#   audio/narration.m4a    -> bash demo/narrate.sh    (macOS `say` TTS)
#   email-fullpage.png     -> screenshot of order-confirmation.html (browser, full page)
#   card-title.png         -> screenshot of title.html at 1280x720
#   card-end.png           -> screenshot of end.html at 1280x720
# The card + email screenshots are captured by serving out/ over HTTP and using a
# headless browser (the cards are plain HTML in title.html / end.html).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$HERE/out"; W="$(mktemp -d)"
ENC=(-c:v libx264 -pix_fmt yuv420p -r 30 -preset medium)
DRAC=0x282a36
GAP=0.5

# Derive scene durations from the actual VO segments so cuts land on each line,
# regardless of which voice/engine generated them.
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
A=$(echo "$(dur "$OUT/audio/01-hook.m4a") + $GAP" | bc)
B=$(echo "$(dur "$OUT/audio/02-prompt.m4a") + $GAP + $(dur "$OUT/audio/03-build.m4a") + $GAP" | bc)
C=$(echo "$(dur "$OUT/audio/04-render.m4a") + $GAP" | bc)
D=$(echo "$(dur "$OUT/audio/05-cta.m4a") + $GAP" | bc)
TERM_RAW=$(dur "$OUT/demo.mp4")
SPEED=$(echo "scale=4; $B / $TERM_RAW" | bc)   # stretch terminal clip to fill scene B
printf "scenes  A=%.2f  B=%.2f (term x%.3f)  C=%.2f  D=%.2f\n" "$A" "$B" "$SPEED" "$C" "$D"

ffmpeg -y -loop 1 -i "$OUT/card-title.png" -t "$A" \
  -vf "scale=1280:720,fade=t=in:st=0:d=0.5,fade=t=out:st=$(echo "$A-0.5"|bc):d=0.5" "${ENC[@]}" -an "$W/A.mp4" -loglevel error

ffmpeg -y -i "$OUT/demo.mp4" \
  -vf "setpts=$SPEED*PTS,scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=$DRAC,fade=t=in:st=0:d=0.4" \
  "${ENC[@]}" -an "$W/B.mp4" -loglevel error

ffmpeg -y -i "$OUT/email-fullpage.png" -vf "crop=680:600:0:0" "$W/email-crop.png" -loglevel error
Cframes=$(echo "$C * 30 / 1" | bc)
ffmpeg -y -loop 1 -i "$W/email-crop.png" -t "$C" \
  -vf "scale=-2:1320,zoompan=z='min(zoom+0.0004,1.08)':d=$Cframes:x='iw/2-(iw/zoom/2)':y=0:s=600x720:fps=30,pad=1280:720:(ow-iw)/2:0:color=0x161616,fade=t=in:st=0:d=0.5,fade=t=out:st=$(echo "$C-0.5"|bc):d=0.5" \
  "${ENC[@]}" -an "$W/C.mp4" -loglevel error

ffmpeg -y -loop 1 -i "$OUT/card-end.png" -t "$D" \
  -vf "scale=1280:720,fade=t=in:st=0:d=0.5,fade=t=out:st=$(echo "$D-0.6"|bc):d=0.6" "${ENC[@]}" -an "$W/D.mp4" -loglevel error

printf "file '%s/A.mp4'\nfile '%s/B.mp4'\nfile '%s/C.mp4'\nfile '%s/D.mp4'\n" "$W" "$W" "$W" "$W" > "$W/list.txt"
ffmpeg -y -f concat -safe 0 -i "$W/list.txt" "${ENC[@]}" "$W/video.mp4" -loglevel error
ffmpeg -y -i "$W/video.mp4" -i "$OUT/audio/narration.m4a" \
  -map 0:v -map 1:a -c:v copy -c:a aac -movflags faststart -shortest "$OUT/lit-pigeon-demo.mp4" -loglevel error

rm -rf "$W"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/lit-pigeon-demo.mp4")
printf "✓ lit-pigeon-demo.mp4  %.1fs → %s\n" "$dur" "$OUT"
