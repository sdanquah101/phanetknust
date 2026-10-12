"use client";
import * as React from "react";
import { cn } from "../cn";

/* ================= KENTE =================
   Drawn thread by thread on a canvas, then used as a background image.
   Each strip is a grid of threads: warp-faced sections show vertical threads
   (stripes, with the "pick and pick" ticks of alternating colours); weft-faced
   blocks show horizontal threads carrying the motifs. Every thread is shaded as
   a round fibre, interlaced over/under, with dye variation and grain. Strips are
   then sewn side by side with offset blocks, the way real kente is assembled. */

const RGB: Record<string, [number, number, number]> = {
  G: [226, 166, 16], g: [244, 192, 44], B: [24, 22, 20], U: [30, 56, 172],
  N: [20, 32, 92], W: [234, 226, 206], R: [150, 32, 28],
};
const CELL = 3; // px per thread
const TW = 36; // threads across one strip

function rand(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function kenteHash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// warp layouts (half-width, mirrored). "T" = a tick pair: two colours alternating each pick
const WARPS = ["BBGBGGGUGUGGBGGGTT", "BBGGBGGGGBUUBGGGTT", "BBGBUUGGGTTGGBGGGU", "BBGGGBGBGGUGGGBTTG"];
const TICK: Record<string, [string, string]> = { G: ["B", "G"], U: ["G", "U"] };

type Motif = (x: number, y: number, h: number) => string;
const MOTIFS: Motif[] = [
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

function paintStrip(seed: number): HTMLCanvasElement {
  const r = rand(seed);
  const half = WARPS[seed % WARPS.length];
  const cols = (half + [...half].reverse().join("")).split("");
  const tickKind = [ "G", "G", "U" ][Math.floor(r() * 3)];
  const mA = MOTIFS[seed % MOTIFS.length], mB = MOTIFS[(seed * 3 + 2) % MOTIFS.length];
  const secs: [("warp" | "weft"), number, Motif?][] = [["warp", 52], ["weft", 30, mA], ["warp", 14], ["weft", 36, mB]];
  const rows = secs.reduce((a, s) => a + s[1], 0);
  const grid: [string, "warp" | "weft"][] = new Array(TW * rows);
  let y0 = 0;
  for (const [type, h, fn] of secs) {
    for (let y = 0; y < h; y++) for (let x = 0; x < TW; x++) {
      let k: string;
      if (type === "warp") { k = cols[x]; if (k === "T") k = TICK[tickKind][(y + x) % 2]; }
      else k = fn!(x, y, h);
      grid[(y0 + y) * TW + x] = [k, type];
    }
    y0 += h;
  }

  const w = TW * CELL, h = rows * CELL;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d")!;
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
  for (let y = 0; y < h; y++) for (const [x, k] of [[0, -55], [1, -22], [w - 2, -18], [w - 1, -50]] as const) {
    const i = (y * w + x) * 4; d[i] += k; d[i + 1] += k; d[i + 2] += k;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}

export type KenteTile = { url: string; w: number; h: number; cv: HTMLCanvasElement };
const cache = new Map<number, KenteTile>();
const cacheH = new Map<number, string>();

/** A vertical kente strip as a CSS `url(...)` background (browser only). */
export function kenteStrip(seed: number): KenteTile {
  const s = Math.abs(seed | 0);
  const hit = cache.get(s);
  if (hit) return hit;
  const cv = paintStrip(s);
  const tile = { url: `url(${cv.toDataURL("image/png")})`, w: cv.width, h: cv.height, cv };
  cache.set(s, tile);
  return tile;
}
/** The same strip turned on its side, for horizontal edges. */
export function kenteStripH(seed: number): string {
  const s = Math.abs(seed | 0);
  const hit = cacheH.get(s);
  if (hit) return hit;
  const v = kenteStrip(s);
  const cv = document.createElement("canvas");
  cv.width = v.h; cv.height = v.w;
  const ctx = cv.getContext("2d")!;
  ctx.translate(0, v.w); ctx.rotate(-Math.PI / 2); ctx.drawImage(v.cv, 0, 0);
  const url = `url(${cv.toDataURL("image/png")})`;
  cacheH.set(s, url);
  return url;
}

/** Strip background for `seed`, available after mount (null during server render). */
export function useKente(seed: number) {
  const [tile, setTile] = React.useState<KenteTile | null>(null);
  React.useEffect(() => { setTile(kenteStrip(seed)); }, [seed]);
  return tile;
}

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One vertical strip of kente (a stole edge, a swatch, a bookmark). Size it with classes. */
export function KenteStrip({ seed = 3, className, style }: { seed?: number; className?: string; style?: React.CSSProperties }) {
  const tile = useKente(seed);
  return <div className={cn("kente-strip", className)} style={{ ...style, backgroundImage: tile?.url }} aria-hidden />;
}

/** Horizontal kente edge, e.g. under a photo or across the top of a card. */
export function KenteEdge({ seed = 300, className, style }: { seed?: number; className?: string; style?: React.CSSProperties }) {
  const [url, setUrl] = React.useState<string>();
  React.useEffect(() => { setUrl(kenteStripH(seed)); }, [seed]);
  return <div className={cn("kente-edge", className)} style={{ ...style, backgroundImage: url }} aria-hidden />;
}

/**
 * A length of cloth: strips sewn side by side, neighbours offset by half a repeat and
 * slightly misaligned by hand. Set the height with a class. With `motion`, alternate
 * strips drift up and down as the page scrolls, like cloth catching the light.
 */
export function KenteCloth({ seed = 1, stripWidth = 64, motion = true, className, style }: {
  seed?: number; stripWidth?: number; motion?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [count, setCount] = React.useState(0);
  const [tiles, setTiles] = React.useState<KenteTile[]>([]);

  React.useEffect(() => {
    setTiles(Array.from({ length: 5 }, (_, i) => kenteStrip(seed + i)));
  }, [seed]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCount(Math.ceil(el.clientWidth / stripWidth) + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stripWidth]);

  const offsets = React.useMemo(() => {
    const r = rand(seed * 31);
    return Array.from({ length: count }, () => r());
  }, [seed, count]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !motion || prefersReducedMotion() || !tiles.length) return;
    let ticking = false;
    const run = () => {
      ticking = false;
      const rc = el.getBoundingClientRect();
      if (rc.bottom < 0 || rc.top > innerHeight) return;
      const t = (rc.top - innerHeight / 2) * 0.1;
      for (const k of Array.from(el.children) as HTMLElement[]) {
        k.style.backgroundPositionY = `${-Number(k.dataset.off) + t * Number(k.dataset.dir)}px`;
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } };
    addEventListener("scroll", onScroll, { passive: true });
    run();
    return () => removeEventListener("scroll", onScroll);
  }, [motion, tiles, count]);

  return (
    <div ref={ref} className={cn("kente-cloth", className)} style={style} aria-hidden>
      {tiles.length > 0 && Array.from({ length: count }, (_, i) => {
        const t = tiles[i % tiles.length];
        const sh = t.h * (stripWidth / t.w);
        const off = (i % 2) * (sh / 2) + offsets[i] * 6;
        return (
          <i key={i} data-off={off} data-dir={i % 2 ? 1 : -1}
            style={{ width: stripWidth, backgroundImage: t.url, backgroundPositionY: -off }} />
        );
      })}
    </div>
  );
}

/** The thin woven bar along the top of pages and the sidebar. */
export function KenteBar({ className, seed = 3 }: { className?: string; seed?: number }) {
  return <KenteCloth seed={seed} stripWidth={44} motion={false} className={cn("kente-bar", className)} />;
}

/** Dark woven ground for heroes and login screens: cloth with a soft shade so white text stays readable. */
export function KenteGround({ seed = 61, className }: { seed?: number; className?: string }) {
  return (
    <div className={cn("kente-ground", className)} aria-hidden>
      <KenteCloth seed={seed} stripWidth={96} className="absolute inset-0 h-full" />
      <div className="kente-ground__shade" />
    </div>
  );
}
