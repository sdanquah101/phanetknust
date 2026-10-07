import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { ACADEMY_URL, CERTIFICATE_ISSUER } from "./brand";

export type CertificateData = { code: string; recipient_name: string; course_title: string; issued_at: string };

/* ------------------------------------------------------------------------------------------------
 * PHANET Academy certificate: A4 landscape, ivory paper, navy ink, gold foil.
 * Everything (guilloche, borders, seal, ribbons) is drawn in code; only the fonts are files.
 * ---------------------------------------------------------------------------------------------- */

const W = 841.89;
const H = 595.28;
const TAU = Math.PI * 2;

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const PAPER = hex("#FBF8F0");
const PAPER_SHADE = hex("#F3ECDD");
const INK = hex("#12265E");
const INK_DEEP = hex("#0B1A45");
const SIGNATURE_INK = hex("#1B3A8C");
const MUTED = hex("#6B6F7E");
const GOLD = hex("#B38B45");
const GOLD_LIGHT = hex("#E2C88F");
const GOLD_DARK = hex("#7C5E26");

/* ---------- fonts ---------- */

const FONT_FILES = {
  caps: "Cinzel_500Medium.ttf",
  capsBold: "Cinzel_600SemiBold.ttf",
  serif: "CormorantGaramond_500Medium.ttf",
  italic: "CormorantGaramond_400Regular_Italic.ttf",
  name: "CormorantGaramond_500Medium_Italic.ttf",
  script: "PinyonScript_400Regular.ttf",
  signature: "MrsSaintDelafield_400Regular.ttf",
} as const;
type FontKey = keyof typeof FONT_FILES;
type Fonts = Record<FontKey, PDFFont> & { standard: boolean };

const fontCache = new Map<string, Uint8Array>();

/** Fonts ship in public/fonts/certificate. Read them from disk; fall back to fetching them from the site. */
async function fontBytes(file: string, origin?: string): Promise<Uint8Array | null> {
  const hit = fontCache.get(file);
  if (hit) return hit;
  const dirs = [join(process.cwd(), "public/fonts/certificate"), join(process.cwd(), "apps/academy/public/fonts/certificate")];
  for (const dir of dirs) {
    try {
      const bytes = new Uint8Array(await readFile(join(dir, file)));
      fontCache.set(file, bytes);
      return bytes;
    } catch {
      /* try the next place */
    }
  }
  if (origin) {
    try {
      const res = await fetch(`${origin}/fonts/certificate/${file}`);
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        fontCache.set(file, bytes);
        return bytes;
      }
    } catch {
      /* fall through to the standard fonts */
    }
  }
  return null;
}

async function loadFonts(pdf: PDFDocument, origin?: string): Promise<Fonts> {
  pdf.registerFontkit(fontkit);
  const keys = Object.keys(FONT_FILES) as FontKey[];
  const bytes = await Promise.all(keys.map((k) => fontBytes(FONT_FILES[k], origin)));
  if (bytes.every(Boolean)) {
    const fonts = await Promise.all(bytes.map((b) => pdf.embedFont(b!, { features: { liga: false, clig: false, dlig: false } }) /* files are pre-subset; pdf-lib's subsetter and ligatures misplace glyphs */));
    return { ...(Object.fromEntries(keys.map((k, i) => [k, fonts[i]])) as Record<FontKey, PDFFont>), standard: false };
  }
  // Never fail a download over fonts: degrade to the built-in Times family.
  const [roman, bold, italic] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman),
    pdf.embedFont(StandardFonts.TimesRomanBold),
    pdf.embedFont(StandardFonts.TimesRomanItalic),
  ]);
  return { caps: roman, capsBold: bold, serif: roman, italic, name: italic, script: italic, signature: italic, standard: true };
}

const LOOKALIKE: Record<string, string> = { "ɔ": "o", "Ɔ": "O", "ɛ": "e", "Ɛ": "E", "ŋ": "n", "Ŋ": "N", "’": "'", "‘": "'", "“": '"', "”": '"' };

/** Replace characters the font can't draw (e.g. Akan ɔ/ɛ in the fallback font) with the closest letter. */
function printable(font: PDFFont, text: string, standard: boolean): string {
  const set = standard ? null : new Set(font.getCharacterSet());
  const ok = (ch: string) => {
    if (set) return set.has(ch.codePointAt(0)!);
    try {
      font.encodeText(ch);
      return true;
    } catch {
      return false;
    }
  };
  return [...text]
    .map((ch) => {
      if (ok(ch)) return ch;
      const alt = LOOKALIKE[ch] ?? ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return [...alt].every(ok) ? alt : "";
    })
    .join("");
}

/* ---------- drawing helpers ---------- */

type Align = "left" | "center" | "right";
type TextOpts = { font: PDFFont; size: number; color?: RGB; tracking?: number; align?: Align; opacity?: number };

function measure(text: string, { font, size, tracking = 0 }: TextOpts) {
  if (!tracking) return font.widthOfTextAtSize(text, size);
  const chars = [...text];
  return chars.reduce((w, ch) => w + font.widthOfTextAtSize(ch, size), 0) + tracking * (chars.length - 1);
}

function drawText(page: PDFPage, text: string, x: number, y: number, opts: TextOpts) {
  const { font, size, color = INK, tracking = 0, align = "center", opacity = 1 } = opts;
  const width = measure(text, opts);
  let cx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  if (!tracking) {
    page.drawText(text, { x: cx, y, size, font, color, opacity });
    return width;
  }
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color, opacity });
    cx += font.widthOfTextAtSize(ch, size) + tracking;
  }
  return width;
}

/** Largest size (down to min) at which the text fits maxWidth. */
function fit(text: string, opts: TextOpts, maxWidth: number, min: number) {
  let size = opts.size;
  while (size > min && measure(text, { ...opts, size }) > maxWidth) size -= 0.5;
  return size;
}

/** Split into at most two balanced lines when one line would be too small. */
function balance(text: string, opts: TextOpts, maxWidth: number, min: number): { lines: string[]; size: number } {
  const one = fit(text, opts, maxWidth, min);
  const words = text.split(/\s+/);
  if (one >= opts.size * 0.8 || words.length < 2) return { lines: [text], size: one };
  let best = { lines: [text], size: one, diff: Infinity };
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const diff = Math.abs(measure(a, opts) - measure(b, opts));
    if (diff < best.diff) best = { lines: [a, b], size: 0, diff };
  }
  const size = Math.min(...best.lines.map((l) => fit(l, opts, maxWidth, min)));
  return { lines: best.lines, size };
}

/** SVG path helpers: we work in PDF coordinates (y up) and flip when writing the path. */
const P = (x: number, y: number) => `${x.toFixed(2)} ${(H - y).toFixed(2)}`;
const polyline = (pts: [number, number][], closed = false) => `M ${pts.map(([x, y]) => P(x, y)).join(" L ")}${closed ? " Z" : ""}`;

function stroke(page: PDFPage, d: string, color: RGB, width: number, opacity = 1) {
  page.drawSvgPath(d, { x: 0, y: H, borderColor: color, borderWidth: width, borderOpacity: opacity });
}
function fill(page: PDFPage, d: string, color: RGB, opacity = 1) {
  page.drawSvgPath(d, { x: 0, y: H, color, opacity, borderWidth: 0 });
}

const circle = (cx: number, cy: number, r: number, steps = 180) =>
  polyline(Array.from({ length: steps }, (_, i) => [cx + r * Math.cos((i / steps) * TAU), cy + r * Math.sin((i / steps) * TAU)] as [number, number]), true);

/** Guilloche ring: k phase-shifted waves around a circle, the moiré lattice seen on banknotes. */
function guillocheRing(cx: number, cy: number, r: number, amp: number, lobes: number, k: number, steps = 900) {
  const paths: string[] = [];
  for (let j = 0; j < k; j++) {
    const phase = (j / k) * TAU;
    const pts: [number, number][] = [];
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * TAU;
      const rho = r + amp * Math.sin(lobes * t + phase);
      pts.push([cx + rho * Math.cos(t), cy + rho * Math.sin(t)]);
    }
    paths.push(polyline(pts, true));
  }
  return paths;
}

/** Spirograph rose (hypotrochoid), closed after `turns` revolutions. */
function rose(cx: number, cy: number, R: number, r: number, d: number, turns: number, scale: number, rot = 0, steps = 1600) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * TAU * turns;
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    pts.push([cx + scale * (x * c - y * s), cy + scale * (x * s + y * c)]);
  }
  return polyline(pts);
}

/** Braided guilloche band along a straight edge. */
function bandSide(x0: number, y0: number, x1: number, y1: number, half: number, waves = 4) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const ux = (x1 - x0) / len;
  const uy = (y1 - y0) / len;
  const nx = -uy;
  const ny = ux;
  const periods = Math.max(1, Math.round(len / 10));
  const steps = periods * 24;
  const paths: string[] = [];
  for (let j = 0; j < waves; j++) {
    const phase = (j / waves) * TAU;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const s = (i / steps) * len;
      const o = half * Math.sin((s / len) * periods * TAU + phase);
      pts.push([x0 + ux * s + nx * o, y0 + uy * s + ny * o]);
    }
    paths.push(polyline(pts));
  }
  return paths;
}

/** Rule that fades out towards both ends, with a diamond in the middle. */
function fadingRule(page: PDFPage, cx: number, y: number, half: number, color: RGB, width = 0.6, diamond = 3) {
  const n = 28;
  const gap = diamond ? diamond * 2.4 : 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < n; i++) {
      const a = gap + ((half - gap) * i) / n;
      const b = gap + ((half - gap) * (i + 1)) / n;
      page.drawLine({ start: { x: cx + side * a, y }, end: { x: cx + side * b, y }, thickness: width, color, opacity: 1 - (i / n) ** 1.6 });
    }
  }
  if (diamond) fill(page, polyline([[cx - diamond, y], [cx, y + diamond], [cx + diamond, y], [cx, y - diamond]], true), color);
}

function diamondAt(page: PDFPage, x: number, y: number, r: number, color: RGB) {
  fill(page, polyline([[x - r, y], [x, y + r], [x + r, y], [x, y - r]], true), color);
}

function roman(n: number) {
  const map: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Text set around a circle, reading clockwise, centred on the top. */
function circularText(page: PDFPage, text: string, cx: number, cy: number, r: number, font: PDFFont, size: number, color: RGB, tracking: number) {
  const chars = [...text];
  const widths = chars.map((ch) => font.widthOfTextAtSize(ch, size));
  // A negative tracking means: spread the letters so the legend closes exactly around the ring.
  if (tracking < 0) tracking = (TAU * r - widths.reduce((a, b) => a + b, 0)) / chars.length;
  const total = widths.reduce((a, b) => a + b, 0) + tracking * chars.length;
  let theta = Math.PI / 2 + total / r / 2;
  chars.forEach((ch, i) => {
    const w = widths[i];
    const mid = theta - w / 2 / r;
    const px = cx + r * Math.cos(mid);
    const py = cy + r * Math.sin(mid);
    const tx = Math.sin(mid);
    const ty = -Math.cos(mid);
    page.drawText(ch, { x: px - (tx * w) / 2, y: py - (ty * w) / 2, size, font, color, rotate: degrees(((mid - Math.PI / 2) * 180) / Math.PI) });
    theta -= (w + tracking) / r;
  });
}

/* ---------- composition ---------- */

function drawBackground(page: PDFPage) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  // A soft warm vignette towards the edges.
  for (let i = 0; i < 8; i++) {
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, borderColor: PAPER_SHADE, borderWidth: (40 + i * 14) * 2, borderOpacity: 0.09 });
  }
}

/** Watermark rosette behind the recipient's name. */
function drawWatermark(page: PDFPage) {
  const cx = W / 2;
  const cy = 300;
  for (const d of guillocheRing(cx, cy, 170, 12, 40, 10)) stroke(page, d, GOLD, 0.35, 0.13);
  for (const d of guillocheRing(cx, cy, 132, 9, 32, 8)) stroke(page, d, GOLD, 0.3, 0.1);
  for (const d of guillocheRing(cx, cy, 98, 6, 24, 6)) stroke(page, d, GOLD, 0.3, 0.08);
}

function drawFrame(page: PDFPage) {
  const outer = 22;
  const b0 = 30; // band outer edge
  const b1 = 46; // band inner edge
  const inner = 54;

  // Outer gold hairlines (double rule).
  page.drawRectangle({ x: outer, y: outer, width: W - outer * 2, height: H - outer * 2, borderColor: GOLD, borderWidth: 1.1 });
  page.drawRectangle({ x: outer + 3, y: outer + 3, width: W - (outer + 3) * 2, height: H - (outer + 3) * 2, borderColor: GOLD, borderWidth: 0.4 });

  // Guilloche band, navy on a faintly shaded ground.
  page.drawRectangle({ x: b0, y: b0, width: W - b0 * 2, height: H - b0 * 2, color: PAPER_SHADE, opacity: 0.55 });
  page.drawRectangle({ x: b1, y: b1, width: W - b1 * 2, height: H - b1 * 2, color: PAPER });
  const mid = (b0 + b1) / 2;
  const half = (b1 - b0) / 2 - 1.6;
  const sides: [number, number, number, number][] = [
    [b1, mid, W - b1, mid],
    [b1, H - mid, W - b1, H - mid],
    [mid, b1, mid, H - b1],
    [W - mid, b1, W - mid, H - b1],
  ];
  for (const [x0, y0, x1, y1] of sides) for (const d of bandSide(x0, y0, x1, y1, half)) stroke(page, d, INK, 0.38, 0.9);
  page.drawRectangle({ x: b0, y: b0, width: W - b0 * 2, height: H - b0 * 2, borderColor: INK, borderWidth: 0.9 });
  page.drawRectangle({ x: b1, y: b1, width: W - b1 * 2, height: H - b1 * 2, borderColor: INK, borderWidth: 0.9 });

  // Corner medallions over the band joints.
  for (const [x, y] of [[b0, b0], [W - b1, b0], [b0, H - b1], [W - b1, H - b1]] as [number, number][]) {
    const s = b1 - b0;
    page.drawRectangle({ x, y, width: s, height: s, color: INK });
    page.drawRectangle({ x: x + 2, y: y + 2, width: s - 4, height: s - 4, borderColor: GOLD_LIGHT, borderWidth: 0.5 });
    stroke(page, rose(x + s / 2, y + s / 2, 8, 5, 4, 5, 0.62), GOLD_LIGHT, 0.35);
    diamondAt(page, x + s / 2, y + s / 2, 1.3, GOLD_LIGHT);
  }

  // Inner gold frame with concave corners.
  const r = 12;
  const x0 = inner;
  const y0 = inner;
  const x1 = W - inner;
  const y1 = H - inner;
  const d = [
    `M ${P(x0 + r, y0)}`,
    `L ${P(x1 - r, y0)}`,
    `A ${r} ${r} 0 0 1 ${P(x1, y0 + r)}`,
    `L ${P(x1, y1 - r)}`,
    `A ${r} ${r} 0 0 1 ${P(x1 - r, y1)}`,
    `L ${P(x0 + r, y1)}`,
    `A ${r} ${r} 0 0 1 ${P(x0, y1 - r)}`,
    `L ${P(x0, y0 + r)}`,
    `A ${r} ${r} 0 0 1 ${P(x0 + r, y0)}`,
    "Z",
  ].join(" ");
  stroke(page, d, GOLD, 0.9);
  for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as [number, number, number, number][]) {
    diamondAt(page, cx, cy, 2.4, GOLD);
    const arc = `M ${P(cx + sx * (r + 6), cy)} A ${r + 6} ${r + 6} 0 0 ${sx * sy > 0 ? 0 : 1} ${P(cx, cy + sy * (r + 6))}`;
    stroke(page, arc, GOLD, 0.4);
  }
}

function drawSeal(page: PDFPage, cx: number, cy: number, fonts: Fonts, year: number) {
  const R = 49;

  // Ribbon tails behind the seal.
  for (const side of [-1, 1]) {
    const a = (side * 22 * Math.PI) / 180;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    const px = -dy;
    const py = dx;
    const w = 11;
    const L = 58;
    const sx = cx + side * 12;
    const sy = cy - 14;
    const ex = sx + dx * L;
    const ey = sy + dy * L;
    const nx = sx + dx * (L - 11);
    const ny = sy + dy * (L - 11);
    fill(page, polyline([[sx + px * w, sy + py * w], [ex + px * w, ey + py * w], [nx, ny], [ex - px * w, ey - py * w], [sx - px * w, sy - py * w]], true), INK);
    for (const o of [w - 2.4, -(w - 2.4)]) {
      const stop = L - 11 * (1 - Math.abs(o) / w) - 1.5;
      page.drawLine({ start: { x: sx + px * o, y: sy + py * o }, end: { x: sx + px * o + dx * stop, y: sy + py * o + dy * stop }, thickness: 0.5, color: GOLD_LIGHT });
    }
  }

  // Serrated foil edge, with a darker under-edge for depth.
  const teeth = 72;
  const edge = (outer: number, inner: number, dx = 0, dy = 0) =>
    polyline(Array.from({ length: teeth * 2 }, (_, i) => {
      const t = (i / (teeth * 2)) * TAU;
      const rr = i % 2 ? inner : outer;
      return [cx + dx + rr * Math.cos(t), cy + dy + rr * Math.sin(t)] as [number, number];
    }), true);
  fill(page, edge(R, R - 3, 0.8, -1), GOLD_DARK);
  fill(page, edge(R, R - 3), GOLD);

  fill(page, circle(cx, cy, R - 4.5), GOLD);
  for (const d of guillocheRing(cx, cy, R - 10.5, 3.2, 30, 6, 600)) stroke(page, d, GOLD_LIGHT, 0.4, 0.95);
  stroke(page, circle(cx, cy, R - 4.5), GOLD_DARK, 0.7);
  stroke(page, circle(cx, cy, R - 16), GOLD_DARK, 0.7);

  // Navy band with the circular legend.
  fill(page, circle(cx, cy, R - 16.5), INK);
  stroke(page, circle(cx, cy, R - 18.2), GOLD_LIGHT, 0.35);
  stroke(page, circle(cx, cy, R - 29.6), GOLD_LIGHT, 0.35);
  const legend = "PHANET ACADEMY • KNUST • ";
  circularText(page, legend, cx, cy, R - 27, fonts.capsBold, fonts.standard ? 5.2 : 5.7, GOLD_LIGHT, -1);

  // Inner gold disc with monogram and year.
  fill(page, circle(cx, cy, R - 30.5), GOLD);
  stroke(page, circle(cx, cy, R - 33), GOLD_LIGHT, 0.35, 0.9);
  drawText(page, "PA", cx, cy - 2.2, { font: fonts.capsBold, size: 11, color: INK_DEEP, tracking: 0.6 });
  drawText(page, roman(year), cx, cy - 9.6, { font: fonts.capsBold, size: 3.6, color: INK_DEEP, tracking: 0.5 });
}

/** A4 landscape certificate with verification code and URL. */
export async function renderCertificatePdf(cert: CertificateData, opts: { origin?: string } = {}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`PHANET Academy certificate ${cert.code}`);
  pdf.setAuthor("PHANET Academy");
  pdf.setSubject(`${cert.recipient_name}: ${cert.course_title}`);
  pdf.setCreator("PHANET Academy");
  const page = pdf.addPage([W, H]);
  const fonts = await loadFonts(pdf, opts.origin);
  const say = (font: PDFFont, text: string) => printable(font, text, fonts.standard);

  drawBackground(page);
  drawFrame(page);
  drawWatermark(page);

  const cx = W / 2;

  // Masthead
  const mast = "PHANET ACADEMY";
  const mastW = drawText(page, mast, cx, 494, { font: fonts.capsBold, size: 11.5, color: INK, tracking: 4.2 });
  for (const side of [-1, 1]) {
    const from = cx + side * (mastW / 2 + 12);
    const to = cx + side * (mastW / 2 + 52);
    page.drawLine({ start: { x: from, y: 498 }, end: { x: to, y: 498 }, thickness: 0.6, color: GOLD });
    diamondAt(page, to + side * 3.2, 498, 2.2, GOLD);
  }
  drawText(page, "PHANET  KNUST  ·  KUMASI,  GHANA", cx, 479, { font: fonts.caps, size: 6.6, color: MUTED, tracking: 2.2 });

  // Title
  drawText(page, "CERTIFICATE", cx, 418, { font: fonts.caps, size: 44, color: INK, tracking: 9 });
  drawText(page, "of Completion", cx, 384, { font: fonts.script, size: 31, color: GOLD });

  // Recipient
  drawText(page, say(fonts.italic, "This is to certify that"), cx, 341, { font: fonts.italic, size: 15, color: MUTED });
  const name = say(fonts.name, cert.recipient_name.trim() || "PHANET Academy student");
  const nameOpts = { font: fonts.name, size: 50, color: INK };
  const nameSize = fit(name, nameOpts, 560, 26);
  drawText(page, name, cx, 286, { ...nameOpts, size: nameSize });
  fadingRule(page, cx, 270, 230, GOLD, 0.7, 3.2);

  // Course
  const course = say(fonts.capsBold, cert.course_title.trim().toUpperCase());
  const courseOpts = { font: fonts.capsBold, size: 17, color: INK, tracking: 2.2 };
  const { lines, size: courseSize } = balance(course, courseOpts, 540, 10);
  drawText(page, say(fonts.italic, "has successfully completed the course"), cx, lines.length > 1 ? 246 : 243, { font: fonts.italic, size: 15, color: MUTED });
  const lineGap = courseSize * 1.35;
  const courseTop = lines.length > 1 ? 220 : 213;
  lines.forEach((line, i) => drawText(page, line, cx, courseTop - i * lineGap, { ...courseOpts, size: courseSize, tracking: courseSize * 0.13 }));

  // Footer: date | seal | signature
  const footLine = 128;
  const leftX = 214;
  const rightX = W - 214;
  const blockHalf = 92;

  const issued = new Date(cert.issued_at);
  const dateText = issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" });
  drawText(page, dateText, leftX, footLine + 8, { font: fonts.serif, size: 18, color: INK });
  page.drawLine({ start: { x: leftX - blockHalf, y: footLine }, end: { x: leftX + blockHalf, y: footLine }, thickness: 0.6, color: GOLD });
  drawText(page, "DATE OF ISSUE", leftX, footLine - 15, { font: fonts.capsBold, size: 7, color: INK, tracking: 2.4 });
  drawText(page, "Kumasi, Ghana", leftX, footLine - 29, { font: fonts.italic, size: 11, color: MUTED });

  page.drawText(say(fonts.signature, CERTIFICATE_ISSUER.signature), {
    x: rightX - measure(CERTIFICATE_ISSUER.signature, { font: fonts.signature, size: 50 }) / 2 + 4,
    y: footLine + 12,
    size: 50,
    font: fonts.signature,
    color: SIGNATURE_INK,
    rotate: degrees(3),
  });
  page.drawLine({ start: { x: rightX - blockHalf, y: footLine }, end: { x: rightX + blockHalf, y: footLine }, thickness: 0.6, color: GOLD });
  drawText(page, say(fonts.capsBold, CERTIFICATE_ISSUER.name.toUpperCase()), rightX, footLine - 15, { font: fonts.capsBold, size: 7, color: INK, tracking: 2.4 });
  drawText(page, say(fonts.italic, CERTIFICATE_ISSUER.role), rightX, footLine - 29, { font: fonts.italic, size: 11, color: MUTED });

  drawSeal(page, cx, 131, fonts, issued.getUTCFullYear());

  // Verification line
  const url = `${ACADEMY_URL.replace(/^https?:\/\//, "")}/certificates/${cert.code}`;
  drawText(page, "CERTIFICATE NO.", 76, 66, { font: fonts.capsBold, size: 5.6, color: MUTED, tracking: 1.6, align: "left" });
  drawText(page, cert.code, 76 + measure("CERTIFICATE NO.", { font: fonts.capsBold, size: 5.6, tracking: 1.6 }) + 6, 66, { font: fonts.capsBold, size: 7, color: INK, tracking: 1.4, align: "left" });
  const verifyLabelOpts = { font: fonts.capsBold, size: 5.6, color: MUTED, tracking: 1.6 };
  const urlOpts = { font: fonts.italic, size: 9, color: INK };
  const urlW = measure(url, urlOpts);
  drawText(page, url, W - 76, 66, { ...urlOpts, align: "right" });
  drawText(page, "VERIFY AT", W - 76 - urlW - 6, 66, { ...verifyLabelOpts, align: "right" });

  return pdf.save();
}
