// Render one ad: step the page frame by frame and pipe JPEG frames into ffmpeg.
// Usage: node render.cjs <slug> <out.mp4> [fps] [stills-dir]
const { spawn } = require("child_process");
const path = require("path");
const { chromium } = require(process.env.PW_PATH);

(async () => {
  const [slug, out, fpsArg, stills] = process.argv.slice(2);
  const fps = Number(fpsArg || 30);
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${process.env.PORT || 8833}/ad.html?program=${slug}`);
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DURATION);
  const frames = Math.round(dur * fps);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    const t = f / fps;
    await page.evaluate((s) => window.seek(s), t);
    const buf = await page.screenshot({ type: "jpeg", quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (stills && [1.2, 4.6, 9.2, 12.0, 14.6].some((s) => Math.abs(s - t) < 0.5 / fps)) {
      require("fs").writeFileSync(path.join(stills, `${slug}-${t.toFixed(1)}.jpg`), buf);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`${slug}: ${frames} frames -> ${out}`);
})();
