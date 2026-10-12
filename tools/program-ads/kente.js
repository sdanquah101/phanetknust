const RGB = {
  G: [226, 166, 16], g: [244, 192, 44], B: [24, 22, 20], U: [30, 56, 172],
  N: [20, 32, 92], W: [234, 226, 206], R: [150, 32, 28],
};
const CELL = 3; // px per thread
const TW = 36; // threads across one strip

function rand(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function kenteHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// warp layouts (half-width, mirrored). "T" = a tick pair: two colours alternating each pick
const WARPS = ["BBGBGGGUGUGGBGGGTT", "BBGGBGGGGBUUBGGGTT", "BBGBUUGGGTTGGBGGGU", "BBGGGBGBGGUGGGBTTG"];
const TICK = { G: ["B", "G"], U: ["G", "U"] };

const MOTIFS = [
  // concentric stepped diamonds
  (x, y, h) => {
    const cx = (TW - 1) / 2, cy = (h - 1) / 2;
    if (y < 2 || y >= h - 2) return "B";
    if (x < 2 || x >= TW - 2) return "G";
    const d = Math.abs(x - cx) + Math.abs(y - cy) * 1.2;
    return Math.floor(d / 2.4) % 2 ? "B" : "G";
  },
  // zigzag on navy
  (x, y, h) => {
    if (y < 2 || y >= h - 2) return "G";
    const p = 12, tri = Math.abs((((x % p) + p) % p) - p / 2);
    const v = (y + tri) % 8;
    return v < 2 ? "G" : v < 3 ? "B" : "N";
  },
  // chequer of small blocks in a black frame
  (x, y, h) => {
    if (y < 2 || y >= h - 2 || x < 2 || x >= TW - 2) return "B";
    const bx = Math.floor((x - 2) / 4), by = Math.floor((y - 2) / 4);
    return (bx + by) % 2 ? "U" : "G";
  },
  // horizontal bands with gold bars (weft floats)
  (x, y, h) => {
    const band = ["B", "B", "G", "G", "B", "U", "U", "U", "U", "U", "U", "B", "G", "G", "B", "B"];
    const c = band[Math.floor((y / h) * band.length)];
    if (c === "U" && x % 6 > 2 && Math.floor(y / 2) % 2 === 0) return "g";
    return c;
  },
  // nested blocks (nkyemfre style)
  (x, y, h) => {
    const dx = Math.min(x, TW - 1 - x), dy = Math.min(y, h - 1 - y), d = Math.min(dx, dy);
    return ["B", "B", "G", "G", "B", "U", "U", "B", "G", "G", "B", "G"][d % 12];
  },
];

function paintStrip(seed) {
  const r = rand(seed);
  const half = WARPS[seed % WARPS.length];
  const cols = (half + [...half].reverse().join("")).split("");
  const tickKind = [ "G", "G", "U" ][Math.floor(r() * 3)];
  const mA = MOTIFS[seed % MOTIFS.length], mB = MOTIFS[(seed * 3 + 2) % MOTIFS.length];
  const secs = [["warp", 52], ["weft", 30, mA], ["warp", 14], ["weft", 36, mB]];
  const rows = secs.reduce((a, s) => a + s[1], 0);
  const grid = new Array(TW * rows);
  let y0 = 0;
  for (const [type, h, fn] of secs) {
    for (let y = 0; y < h; y++) for (let x = 0; x < TW; x++) {
      let k;
      if (type === "warp") { k = cols[x]; if (k === "T") k = TICK[tickKind][(y + x) % 2]; }
      else k = fn(x, y, h);
      grid[(y0 + y) * TW + x] = [k, type];
    }
    y0 += h;
  }

  const w = TW * CELL, h = rows * CELL;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(w, h), d = img.data;
  const lot = (r() - 0.5) * 14; // dye lot: whole strip slightly lighter/darker
  const colJ = Array.from({ length: TW }, () => (r() - 0.5) * 16);
  const rowJ = Array.from({ length: rows }, () => (r() - 0.5) * 14);
  const warpShade = [16, 4, -26]; // round vertical thread: lit left, shadow right
  const weftShade = [14, 2, -24]; // round horizontal thread: lit top, shadow bottom
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < TW; tx++) {
    const [k, face] = grid[ty * TW + tx];
    const base = RGB[k] ?? RGB.B;
    const j = lot + (face === "warp" ? colJ[tx] : rowJ[ty]) + (r() - 0.5) * 6;
    const under = (tx + ty) % 2 === 0; // interlacement: the thread dips under its crossing thread
    for (let py = 0; py < CELL; py++) for (let px = 0; px < CELL; px++) {
      let s = face === "warp" ? warpShade[px] : weftShade[py];
      if (under) s -= face === "warp" ? (py === 0 ? 18 : 0) : (px === 0 ? 16 : 0);
      s += (r() - 0.5) * 10; // fibre grain
      const i = ((ty * CELL + py) * w + tx * CELL + px) * 4;
      d[i] = base[0] + j + s; d[i + 1] = base[1] + j + s; d[i + 2] = base[2] + j * 0.8 + s; d[i + 3] = 255;
    }
  }
  // selvedge: the sewn edge rolls into shadow
  for (let y = 0; y < h; y++) for (const [x, k] of [[0, -55], [1, -22], [w - 2, -18], [w - 1, -50]] ) {
    const i = (y * w + x) * 4; d[i] += k; d[i + 1] += k; d[i + 2] += k;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}


const _cache = new Map();
function kente(seed) {
  if (!_cache.has(seed)) { const cv = paintStrip(seed); _cache.set(seed, { url: `url(${cv.toDataURL("image/png")})`, w: cv.width, h: cv.height }); }
  return _cache.get(seed);
}
