"use client";
import * as React from "react";
import { kenteStrip, kenteStripH, prefersReducedMotion } from "@phanet/ui";

export type LoomPhoto = { src: string; alt: string; focus?: number };

const loadImg = (src: string) => new Promise<HTMLImageElement>((ok) => {
  const im = new Image();
  im.onload = () => ok(im); im.onerror = () => ok(im);
  im.src = src;
});
function cover(im: HTMLImageElement, W: number, H: number, focus = 0.3) {
  const iw = im.naturalWidth || 1000, ih = im.naturalHeight || 1500;
  const s = Math.max(W / iw, H / ih), bw = iw * s, bh = ih * s;
  return { bw, bh, ox: (W - bw) / 2, oy: (H - bh) * focus };
}

type Strip = { reel: HTMLDivElement; rev: boolean; k: number; pos: number; v: number; lag: number; start: number };

/**
 * The loom: the frame is cut into vertical strips, each holding every photo with a length of
 * kente between them. Odd and even strips travel in opposite directions at different speeds,
 * so each change of photo unweaves the picture into cloth and reweaves it as the next one.
 */
export function LoomGallery({ photos, className = "" }: { photos: LoomPhoto[]; className?: string }) {
  const stage = React.useRef<HTMLDivElement>(null);
  const frame = React.useRef<HTMLDivElement>(null);
  const [idx, setIdx] = React.useState(0);
  const [thread, setThread] = React.useState<string>();
  const api = React.useRef<{ to: (k: number, user?: boolean) => void }>({ to: () => {} });

  React.useEffect(() => {
    const fr = frame.current, st = stage.current;
    if (!fr || !st || !photos.length) return;
    const reduced = prefersReducedMotion();
    let ims: HTMLImageElement[] = [];
    let strips: Strip[] = [];
    let cur = 0, N = 0, FH = 0, KH = 0, U = 0, raf = 0, lastInput = 0, visible = false, alive = true;
    const offsetFor = (k: number, rev: boolean) => (rev ? KH + (photos.length - 1 - k) * U : k * U);

    const layout = () => {
      const small = innerWidth < 760;
      const availW = st.clientWidth - (small ? 0 : 140);
      const availH = st.clientHeight;
      const FW = Math.min(availW, availH * (small ? 0.8 : 1.5), 1180);
      FH = Math.min(availH, FW / (small ? 0.8 : 1.5));
      N = small ? 6 : 10;
      const SW = FW / N;
      KH = Math.round(FH * 0.8); U = FH + KH;
      fr.style.width = `${FW}px`; fr.style.height = `${FH}px`;
      fr.textContent = "";
      strips = [];
      for (let j = 0; j < N; j++) {
        const s = document.createElement("div"); s.className = "lstrip"; s.style.width = `${SW}px`;
        const reel = document.createElement("div"); reel.className = "lreel";
        const rev = j % 2 === 1;
        const order = photos.map((_, k) => k);
        if (rev) order.reverse();
        const kente = kenteStrip(200 + (j % 5)).url;
        const addK = () => { const k = document.createElement("span"); k.className = "lseg lseg--kente"; k.style.height = `${KH}px`; k.style.backgroundImage = kente; reel.append(k); };
        if (rev) addK();
        order.forEach((k, n) => {
          const c = cover(ims[k], FW, FH, photos[k].focus ?? 0.3);
          const p = document.createElement("span");
          p.className = "lseg";
          Object.assign(p.style, { height: `${FH}px`, backgroundImage: `url(${ims[k].src})`, backgroundSize: `${c.bw}px ${c.bh}px`, backgroundPosition: `${c.ox - j * SW}px ${c.oy}px` });
          reel.append(p);
          if (n < order.length - 1) addK();
        });
        s.append(reel); fr.append(s);
        // centre strips arrive first, edges trail behind: the cloth ripples outwards
        const dist = Math.abs(j - (N - 1) / 2) / ((N - 1) / 2);
        const off = offsetFor(cur, rev);
        strips.push({ reel, rev, k: 0.065 - dist * 0.028, pos: off, v: 0, lag: dist * 220, start: 0 });
        reel.style.transform = `translate3d(0,${-off}px,0)`;
      }
    };
    const loop = () => {
      let moving = false;
      const now = performance.now();
      strips.forEach((s) => {
        if (now < s.start) { moving = true; return; }
        const target = offsetFor(cur, s.rev);
        // spring with a little overshoot, like cloth settling
        s.v = (s.v + (target - s.pos) * s.k * 0.5) * 0.8;
        s.pos += s.v;
        if (Math.abs(target - s.pos) > 0.4 || Math.abs(s.v) > 0.4) moving = true; else { s.pos = target; s.v = 0; }
        s.reel.style.transform = `translate3d(0,${(-s.pos).toFixed(1)}px,0)`;
      });
      raf = moving ? requestAnimationFrame(loop) : 0;
    };
    const to = (k: number, user = true) => {
      cur = (k + photos.length) % photos.length;
      setIdx(cur);
      if (user) lastInput = performance.now();
      const now = performance.now();
      strips.forEach((s) => { s.start = now + s.lag; });
      if (reduced) { strips.forEach((s) => { s.pos = offsetFor(cur, s.rev); s.reel.style.transform = `translate3d(0,${-s.pos}px,0)`; }); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    api.current.to = to;

    (async () => {
      ims = await Promise.all(photos.map((p) => loadImg(p.src)));
      if (!alive) return;
      layout();
      setThread(kenteStripH(300));
    })();

    const ro = new ResizeObserver(() => { if (ims.length) layout(); });
    ro.observe(st);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.4 });
    io.observe(fr);
    const auto = reduced ? 0 : window.setInterval(() => {
      if (visible && !document.hidden && performance.now() - lastInput > 9000) to(cur + 1, false);
    }, 5200);

    // drag / swipe / tap
    let sx = 0, sy = 0, down = false;
    const onDown = (e: PointerEvent) => { down = true; sx = e.clientX; sy = e.clientY; fr.setPointerCapture(e.pointerId); };
    const onUp = (e: PointerEvent) => {
      if (!down) return; down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy, d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(d) > 40) to(cur + (d < 0 ? 1 : -1));
      else if (Math.abs(d) < 6) to(cur + 1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); to(cur + 1); }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); to(cur - 1); }
    };
    fr.addEventListener("pointerdown", onDown);
    fr.addEventListener("pointerup", onUp);
    fr.addEventListener("keydown", onKey);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearInterval(auto);
      ro.disconnect(); io.disconnect();
      fr.removeEventListener("pointerdown", onDown);
      fr.removeEventListener("pointerup", onUp);
      fr.removeEventListener("keydown", onKey);
    };
  }, [photos]);

  return (
    <div className={`loom-gallery ${className}`}>
      <div ref={stage} className="loom-gallery__stage">
        <button type="button" className="gnav gnav--prev" aria-label="Previous photo" onClick={() => api.current.to(idx - 1)}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div ref={frame} className="loomframe" tabIndex={0} aria-roledescription="gallery" aria-label={photos[idx]?.alt} />
        <button type="button" className="gnav gnav--next" aria-label="Next photo" onClick={() => api.current.to(idx + 1)}>
          <svg viewBox="0 0 24 24" aria-hidden><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div className="threads" aria-hidden>
        {photos.map((p, k) => (
          <button key={p.src} type="button" tabIndex={-1} className={k === idx ? "is-on" : ""} style={k === idx ? { backgroundImage: thread } : undefined} onClick={() => api.current.to(k)} />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{photos[idx]?.alt}</p>
    </div>
  );
}
