#!/bin/bash
# Render the program video ads into apps/web/public/programs.
# Needs: ffmpeg, Python 3, Node with Playwright and Chromium.  Usage: tools/program-ads/make.sh [slug ...]
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd)
OUT="$ROOT/apps/web/public/programs"; WORK=$(mktemp -d); PORT=${PORT:-8833}
mkdir -p "$OUT" "$WORK/site" "$WORK/master"
cp -r "$HERE"/ad.html "$HERE"/ad.js "$HERE"/programs.js "$HERE"/kente.js "$HERE"/assets "$WORK/site/"
ln -s "$ROOT/apps/web/public/photos" "$WORK/site/photos"
cp "$ROOT/apps/web/public/crest.png" "$WORK/site/crest.png"
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$WORK/site" >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER 2>/dev/null; rm -rf "$WORK"' EXIT
sleep 1
export PW_PATH=${PW_PATH:-$(npm root -g)/playwright} PORT
SLUGS=("$@"); [ ${#SLUGS[@]} -eq 0 ] && SLUGS=(gathering-of-the-adelphos night-of-solemnities academic-excellence-retreat prophetic-convocation business-masterclass)
for s in "${SLUGS[@]}"; do
  node "$HERE/render.cjs" "$s" "$WORK/master/$s.mp4" 30
  ffmpeg -y -loglevel error -i "$WORK/master/$s.mp4" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart -an "$OUT/$s.mp4"
  ffmpeg -y -loglevel error -i "$WORK/master/$s.mp4" -vf scale=1280:720:flags=lanczos -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -an "$OUT/$s.webm"
  ffmpeg -y -loglevel error -ss 5.2 -i "$WORK/master/$s.mp4" -frames:v 1 -vf scale=1280:720:flags=lanczos -c:v libwebp -quality 82 "$OUT/$s.webp"
  [ -n "${MASTERS:-}" ] && mkdir -p "$MASTERS" && cp "$WORK/master/$s.mp4" "$MASTERS/$s.mp4"
  echo "done: $s"
done
