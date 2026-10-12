// Shared engine for the cartoon program ads: timing on the music grid, easing, SVG helpers,
// kente patterns, kinetic type and the beat-synced transitions.
const W = 1920, H = 1080;
const BPM = 120, BEAT = 60 / BPM, BAR = 4 * BEAT, DURATION = 16;
const SVGNS = "http://www.w3.org/2000/svg";
const C = {
  ink: "#141414", cream: "#fbf8f1", cream2: "#f3ecdd", gold: "#e8ad12", goldDeep: "#c98f00", goldLight: "#f6d77a",
  blue: "#1f3fff", blueDeep: "#1430c8", navy: "#0b1f5c", night: "#071338", red: "#a3201c", white: "#ffffff", line: "#e4e0d6",
};

/* ---------- maths ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, start, dur) => clamp((t - start) / dur);
const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1),
};
// beat position: k = whole beats since start, b = phase in the beat (0..1)
const beatOf = (t) => { const x = t / BEAT; return { k: Math.floor(x), b: x - Math.floor(x) }; };
// a kick "pump" that peaks on each beat and decays
const pump = (t, decay = 9) => { if (t < BAR || t > 15) return 0; const { b } = beatOf(t); return Math.exp(-b * BEAT * decay); };
const rng = (seed) => { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };

/* ---------- SVG helpers ---------- */
function s(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
const set = (n, attrs) => { for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
const tf = (n, x = 0, y = 0, r = 0, sc = 1, sy) => n.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${sc.toFixed(4)} ${(sy ?? sc).toFixed(4)})`);
const shade = (hex, f) => { // f<0 darker, f>0 lighter
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/* ---------- kente patterns (painted by kente.js) ---------- */
let DEFS;
const patterns = new Map();
function kentePattern(seed, width) {
  const key = `${seed}-${width}`;
  if (patterns.has(key)) return `url(#k${key})`;
  const k = kente(seed), h = width * (k.h / k.w);
  const p = s("pattern", { id: `k${key}`, patternUnits: "userSpaceOnUse", width, height: h }, DEFS);
  s("image", { href: k.url.slice(4, -1), width, height: h, preserveAspectRatio: "none" }, p);
  patterns.set(key, p);
  return `url(#k${key})`;
}
function kentePatternH(seed, height) {
  const key = `h${seed}-${height}`;
  if (patterns.has(key)) return `url(#k${key})`;
  const k = kente(seed), w = height * (k.h / k.w);
  const p = s("pattern", { id: `k${key}`, patternUnits: "userSpaceOnUse", width: w, height }, DEFS);
  const g = s("g", { transform: `translate(0 ${height}) rotate(-90)` }, p);
  s("image", { href: k.url.slice(4, -1), width: height, height: w, preserveAspectRatio: "none" }, g);
  patterns.set(key, p);
  return `url(#k${key})`;
}

/* ---------- HTML text overlay ---------- */
function div(cls, parent, html) { const d = document.createElement("div"); d.className = cls; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; }
function css(n, o) { Object.assign(n.style, o); return n; }
// words that pop in one after another on the beat grid
function popWords(el, t, start, step, { from = 1.5 } = {}) {
  el.querySelectorAll(".w").forEach((w, i) => {
    const p = prog(t, start + i * step, 0.45);
    const e = ease.back(p);
    w.style.opacity = p > 0 ? 1 : 0;
    w.style.transform = `translateY(${(1 - e) * 60}px) scale(${lerp(from, 1, e)})`;
  });
}
const wrapWords = (text) => text.split(/(\s+)/).map((x) => (x.trim() ? `<span class="w">${x}</span>` : x)).join("");

/* ---------- transitions (each covers the frame at its middle) ---------- */
// The opening cloth: strips drop in, then lift away alternately on the drop.
function makeCloth(root, seed, n = 20) {
  const g = s("g", {}, root), sw = W / n + 1, strips = [];
  for (let i = 0; i < n; i++) {
    const r = s("rect", { x: i * (W / n), y: 0, width: sw, height: H, fill: kentePattern(seed + (i % 5), sw) }, g);
    strips.push(r);
  }
  const shadeEl = s("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#clothShade)" }, g);
  return { g, strips, shadeEl };
}
function drawCloth(cloth, t, { inStart, outStart }) {
  cloth.strips.forEach((r, i) => {
    const dir = i % 2 ? -1 : 1;
    const pin = ease.out(prog(t, inStart + (i % 10) * 0.03, 0.7));
    const pout = ease.inOut(prog(t, outStart + Math.abs(i - 9.5) * 0.018, 0.55));
    const y = (1 - pin) * dir * (H + 60) - pout * dir * (H + 60);
    r.setAttribute("transform", `translate(0 ${y.toFixed(1)})`);
  });
  cloth.g.style.display = t > outStart + 1.2 ? "none" : "";
  cloth.shadeEl.setAttribute("opacity", 1 - prog(t, outStart, 0.3));
}
// Three giant stoles swing in from the left like pendulums, cover the frame, and swing out to the right.
function makeStoleSwing(root, seed) {
  const g = s("g", {}, root), stoles = [];
  for (let i = 0; i < 3; i++) {
    const sg = s("g", {}, g);
    s("rect", { x: -380, y: 0, width: 760, height: 2600, fill: kentePattern(seed + i * 7, 190) }, sg);
    s("rect", { x: -380, y: 0, width: 760, height: 2600, fill: "url(#stoleShade)" }, sg);
    stoles.push(sg);
  }
  return { g, stoles };
}
function drawStoleSwing(st, t, at) {
  const show = t > at - 0.6 && t < at + 0.7;
  st.g.style.display = show ? "" : "none";
  if (!show) return;
  st.stoles.forEach((sg, i) => {
    const pin = ease.out(prog(t, at - 0.5 + i * 0.06, 0.42));
    const pout = ease.in(prog(t, at + 0.06 + i * 0.05, 0.45));
    const ang = lerp(-75, 0, pin) + lerp(0, 75, pout);
    const px = 330 + i * 640;
    sg.setAttribute("transform", `translate(${px} -1500) rotate(${ang.toFixed(2)}) translate(0 0)`);
  });
}
// A gold ring opens from the centre and reveals the next scene (use with a clip path on the next scene).
function irisRadius(t, at) { return ease.inOut(prog(t, at - 0.05, 0.6)) * 1200; }
// Vertical strips with a kente leading edge slide alternately up and down.
function makeLoom(root, seed, fill, n = 14) {
  const g = s("g", {}, root), cols = [];
  const sw = W / n + 1, KH = 520;
  for (let j = 0; j < n; j++) {
    const cg = s("g", {}, g);
    s("rect", { x: j * (W / n), y: 0, width: sw, height: H, fill }, cg);
    s("rect", { x: j * (W / n), y: j % 2 ? -KH : H, width: sw, height: KH, fill: kentePattern(seed + (j % 5), sw) }, cg);
    cols.push(cg);
  }
  return { g, cols, KH };
}
function drawLoom(lm, t, at) {
  lm.cols.forEach((cg, j) => {
    const down = j % 2 === 0;
    const dist = Math.abs(j - (lm.cols.length - 1) / 2) / ((lm.cols.length - 1) / 2);
    const p = ease.inOut(prog(t, at - 0.55 + dist * 0.12, 0.6));
    const y = down ? lerp(-(H + lm.KH), 0, p) : lerp(H + lm.KH, 0, p);
    cg.setAttribute("transform", `translate(0 ${y.toFixed(1)})`);
  });
}
