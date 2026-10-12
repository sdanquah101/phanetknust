# Program video ads

15-second ads for each program, shown on the main site instead of illustrations
(`apps/web/public/programs/<slug>.webm` and `<slug>.mp4` at 1280x720, with a `<slug>.webp` poster).

Each ad is a web page (`ad.html` + `ad.js`) built from kente cloth (painted in code, same as
the site), the fellowship photos in `apps/web/public/photos`, and Bricolage Grotesque. A recorder
(`render.cjs`) steps through it frame by frame with Playwright and pipes the frames to ffmpeg.

- Words, schedule and photos for each program: `programs.js`.
- Timeline and look: `ad.js` and the styles in `ad.html`.
- Render all (or some) and update the site: `tools/program-ads/make.sh [slug ...]`.
  Set `MASTERS=/some/folder` to also keep 1920x1080 versions for social media.

The videos have no sound (they autoplay muted on the site).
