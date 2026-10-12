#!/bin/bash
# Render the cartoon program ads (with music) into apps/web/public/programs.
# Needs: ffmpeg (with libx264, libvpx-vp9, libopus, libwebp), Python 3 with numpy + scipy,
# and Node with Playwright. Usage: tools/program-ads/make.sh [slug ...]
#   PYTHON=/path/to/python   a Python that has numpy and scipy (default: python3)
#   CHROMIUM=/path/to/chrome a Chromium for Playwright if its own download is not installed
#   MASTERS=/some/folder     also keep the 1920x1080 versions (for social media)
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd)
OUT="$ROOT/apps/web/public/programs"; WORK=$(mktemp -d); PORT=${PORT:-8855}; PYTHON=${PYTHON:-python3}
mkdir -p "$OUT" "$WORK/site" "$WORK/master" "$WORK/audio"
cp "$HERE"/*.html "$HERE"/*.js "$WORK/site/"; cp -r "$HERE/assets" "$WORK/site/assets"
cp "$ROOT/apps/web/public/crest.png" "$WORK/site/assets/crest.png"
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$WORK/site" >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER 2>/dev/null; rm -rf "$WORK"' EXIT
sleep 1
export PW_PATH=${PW_PATH:-$(npm root -g)/playwright} PORT
SLUGS=("$@"); [ ${#SLUGS[@]} -eq 0 ] && SLUGS=(gathering-of-the-adelphos night-of-solemnities academic-excellence-retreat prophetic-convocation business-masterclass)
for s in "${SLUGS[@]}"; do
  "$PYTHON" "$HERE/music.py" "$s" "$WORK/audio/$s.wav"
  node "$HERE/render.cjs" "$s" "$WORK/audio/$s.wav" "$WORK/master/$s.mp4" 30
  M="$WORK/master/$s.mp4"
  ffmpeg -y -loglevel error -i "$M" -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$OUT/$s.mp4"
  ffmpeg -y -loglevel error -i "$M" -vf scale=1280:720:flags=lanczos -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -c:a libopus -b:a 112k "$OUT/$s.webm"
  ffmpeg -y -loglevel error -ss 4.5 -i "$M" -frames:v 1 -vf scale=1280:720:flags=lanczos -c:v libwebp -quality 85 "$OUT/$s.webp"
  if [ -n "${MASTERS:-}" ]; then mkdir -p "$MASTERS"; cp "$M" "$MASTERS/$s.mp4"; fi
  echo "done: $s"
done
