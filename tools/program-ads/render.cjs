// Render one ad: step the page frame by frame, pipe JPEG frames into ffmpeg and mux in the music.
// Usage: node render.cjs <slug> <music.wav> <out.mp4> [fps]
const { spawn } = require("child_process");
const { chromium } = require(process.env.PW_PATH);

(async () => {
  const [slug, music, out, fpsArg] = process.argv.slice(2);
  const fps = Number(fpsArg || 30);
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${process.env.PORT || 8855}/ad.html?program=${slug}`);
  await page.evaluate(() => window.ready);
  if (errors.length) throw new Error(errors.join("\n"));
  const dur = await page.evaluate(() => window.DURATION);
  const frames = Math.round(dur * fps);
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-i", music, "-map", "0:v", "-map", "1:a", "-t", String(dur),
    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / fps);
    const buf = await page.screenshot({ type: "jpeg", quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`${slug}: ${frames} frames -> ${out}`);
})();
