# Program video ads

16-second cartoon ads with music for each program, shown on the main site
(`apps/web/public/programs/<slug>.webm` and `<slug>.mp4` at 1280x720 with sound, plus a `<slug>.webp` poster).
No photos: everything is drawn in code — characters, sets, kente cloth (painted the same way as the site)
and Bricolage Grotesque type.

How it fits together:

- `music.py` writes each program's track from scratch: an Afro-house / amapiano groove at 120 BPM
  (kick, claps, shakers, congas, log-drum bass, marimba, pads, a bell hook), 8 bars = 16 seconds,
  with a riser into the drop at 2s and hits on every scene change. Key, chords and hook per program: `SONGS`.
- `engine.js` — timing on the music grid (scene changes land on bar lines at 2, 6, 10 and 14s),
  easing, SVG helpers, kinetic type and the transitions: the opening kente cloth that lifts on the drop,
  three giant stoles that swing across, a gold ring that opens, and the loom that closes into the end card.
- `cast.js` — the rigged characters (skin, hair, clothes, kente stoles), dance poses on the beat and hand props.
- `sets.js` — the backgrounds (hall, night campus with dawn, vigil, classroom, stage, skyline, boardroom, market).
- `programs.js` — the words, schedule, sets and cast for each program's three scenes and end card.
- `ad.js` + `ad.html` — the timeline. `window.seek(t)` draws any moment, so every frame is exact.
- `render.cjs` steps through the page with Playwright, pipes the frames to ffmpeg and adds the music.

Render all (or some) and update the site: `tools/program-ads/make.sh [slug ...]`.
Needs ffmpeg, Node with Playwright, and Python 3 with numpy and scipy (`PYTHON=...` to pick one).
Set `MASTERS=/some/folder` to also keep 1920x1080 versions for social media.

To preview while editing, serve this folder (copy `apps/web/public/crest.png` to `assets/crest.png` first)
and open `ad.html?program=<slug>`; `seek(5)` in the console jumps to 5 seconds.

On the site the videos autoplay muted (browsers only allow silent autoplay); the programs page has a
"Sound on" button on each video.
