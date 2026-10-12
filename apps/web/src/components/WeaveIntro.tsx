"use client";
import * as React from "react";
import { KenteCloth, prefersReducedMotion } from "@phanet/ui";

type Shot = { src: string; focus?: number };

const SEEN_KEY = "phanet-intro-seen";

/** Runs before first paint: shows the opening only on the first visit of a browser session. */
const decide = `try{document.documentElement.dataset.intro=sessionStorage.getItem("${SEEN_KEY}")?"seen":"show"}catch(e){document.documentElement.dataset.intro="seen"}`;

const loadImg = (src: string) => new Promise<HTMLImageElement>((ok) => {
  const im = new Image();
  im.onload = () => ok(im); im.onerror = () => ok(im);
  im.src = src;
});
// background-size/position that make an image "cover" a box, with a vertical focus point
function cover(im: HTMLImageElement, W: number, H: number, focus = 0.3) {
  const iw = im.naturalWidth || 1000, ih = im.naturalHeight || 1500;
  const s = Math.max(W / iw, H / ih), bw = iw * s, bh = ih * s;
  return { bw, bh, ox: (W - bw) / 2, oy: (H - bh) * focus };
}

/**
 * The opening: four photos weave together as warp and weft, then a fifth comes through
 * the cloth. "Come in" (or Skip, or Escape) lifts the whole thing away.
 */
export function WeaveIntro({ weave, final, kicker, title }: { weave: Shot[]; final: Shot; kicker: string; title: string }) {
  const box = React.useRef<HTMLDivElement>(null);
  const mosaic = React.useRef<HTMLDivElement>(null);
  const enter = React.useRef<HTMLButtonElement>(null);
  const [gone, setGone] = React.useState(false);
  const [textIn, setTextIn] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const leaveRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    if (document.documentElement.dataset.intro !== "show") { setGone(true); return; }
    const el = box.current, m = mosaic.current;
    if (!el || !m) return;
    document.body.style.overflow = "hidden";
    const reduced = prefersReducedMotion();
    let finished = false, cancelled = false;
    const timers: number[] = [];
    const cells: { el: HTMLDivElement; b: HTMLElement; i: number; j: number; warp: boolean }[] = [];

    const finish = () => {
      if (finished) return; finished = true;
      cells.forEach((c) => { c.el.getAnimations().forEach((a) => a.finish()); c.el.style.opacity = "1"; c.b.style.opacity = "1"; });
      m.classList.add("is-done");
      setStatus("");
      setTextIn(true);
      timers.push(window.setTimeout(() => enter.current?.focus({ preventScroll: true }), 300));
    };
    const leave = () => {
      finish();
      try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode */ }
      const done = () => { document.body.style.overflow = ""; document.documentElement.dataset.intro = "seen"; setGone(true); };
      if (reduced) return done();
      el.classList.add("is-leaving");
      timers.push(window.setTimeout(done, 1000));
    };
    leaveRef.current = leave;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") leave(); };
    document.addEventListener("keydown", onKey);

    (async () => {
      const ims = await Promise.all([...weave.slice(0, 4), final].map((s) => loadImg(s.src)));
      if (cancelled) return;
      const finalIm = ims[4];
      const small = innerWidth < 760;
      let H = Math.min(innerHeight * (small ? 0.5 : 0.74), 760), W = H * 0.75;
      if (W > innerWidth * 0.86) { W = innerWidth * 0.86; H = W / 0.75; }
      m.style.setProperty("--mw", `${W}px`);
      m.style.setProperty("--mh", `${H}px`);
      const C = small ? 5 : 6, R = small ? 7 : 8, cw = W / C, ch = H / R;
      const fin = cover(finalIm, W, H, final.focus ?? 0.2);
      for (let i = 0; i < R; i++) for (let j = 0; j < C; j++) {
        const warp = (i + j) % 2 === 0;
        const k = warp ? j % 2 : 2 + (i % 2);
        const im = ims[k];
        const c = cover(im, W, H, weave[k]?.focus ?? 0.25);
        const cell = document.createElement("div");
        cell.className = `cell ${warp ? "cell--warp" : "cell--weft"}`;
        Object.assign(cell.style, { left: `${j * cw}px`, top: `${i * ch}px`, width: `${Math.ceil(cw) + 1}px`, height: `${Math.ceil(ch) + 1}px`, opacity: "0" });
        const a = document.createElement("i"), b = document.createElement("i");
        Object.assign(a.style, { backgroundImage: `url(${im.src})`, backgroundSize: `${c.bw}px ${c.bh}px`, backgroundPosition: `${c.ox - j * cw}px ${c.oy - i * ch}px` });
        Object.assign(b.style, { backgroundImage: `url(${finalIm.src})`, backgroundSize: `${fin.bw}px ${fin.bh}px`, backgroundPosition: `${fin.ox - j * cw}px ${fin.oy - i * ch}px` });
        cell.append(a, b);
        m.append(cell);
        cells.push({ el: cell, b, i, j, warp });
      }
      if (reduced) return finish();
      setStatus("Weaving");
      const E = "cubic-bezier(.2,.75,.15,1)";
      // 1. warp: columns drop and rise into place, alternating
      cells.filter((c) => c.warp).forEach((c) => {
        c.el.style.opacity = "1";
        const dir = c.j % 2 ? 1 : -1;
        c.el.animate([{ transform: `translateY(${dir * (H + 120)}px)` }, { transform: "none" }], { duration: 1100, delay: 100 + c.j * 110, easing: E, fill: "backwards" });
      });
      // 2. weft: rows shoot across from alternating sides
      cells.filter((c) => !c.warp).forEach((c) => {
        const dir = c.i % 2 ? 1 : -1;
        const anim = c.el.animate([{ transform: `translateX(${dir * (W + 160)}px)`, opacity: 1 }, { transform: "none", opacity: 1 }], { duration: 1000, delay: 1150 + c.i * 90, easing: E, fill: "backwards" });
        anim.onfinish = () => { c.el.style.opacity = "1"; };
      });
      // 3. the fifth photo comes through the weave, diagonally
      const t3 = 1150 + R * 90 + 1100;
      cells.forEach((c) => {
        c.b.animate([{ opacity: 0, transform: "scale(1.08)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: t3 + (c.i + c.j) * 55, easing: "ease-out", fill: "both" });
      });
      timers.push(window.setTimeout(finish, t3 + (R + C) * 55 + 700));
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [weave, final]);

  if (gone) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} />
      <div ref={box} className="intro" role="dialog" aria-modal="true" aria-label="Welcome">
        <KenteCloth seed={61} stripWidth={96} className="intro__cloth" />
        <div className="intro__shade" aria-hidden />
        <div className="intro__inner">
          <div ref={mosaic} className="mosaic" role="img" aria-label="Photos from PHANET gatherings weaving together into one picture" />
          <div className={`intro__text ${textIn ? "is-in" : ""}`}>
            <p className="intro__kicker">{kicker}</p>
            <h1 className="intro__name">{title}</h1>
            <button ref={enter} type="button" className="btn btn-orange" onClick={() => leaveRef.current()}>Come in</button>
          </div>
        </div>
        <p className="intro__status" role="status">{status}</p>
        <button type="button" className="intro__skip" onClick={() => leaveRef.current()}>Skip</button>
      </div>
    </>
  );
}
