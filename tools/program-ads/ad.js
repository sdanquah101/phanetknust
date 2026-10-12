// A 15-second ad for one PHANET program, built from kente cloth, real photos and type.
// The page exposes window.ready (a promise) and window.seek(seconds) so a recorder can step through it frame by frame.
(() => {
  const W = 1920, H = 1080, T = 15;
  const slug = new URLSearchParams(location.search).get("program") || "gathering-of-the-adelphos";
  const P = window.PROGRAMS[slug];
  const stage = document.getElementById("stage");
  const E = "cubic-bezier(.2,.75,.15,1)", EIO = "cubic-bezier(.7,0,.2,1)";
  const el = (tag, cls, parent, style) => { const n = document.createElement(tag); if (cls) n.className = cls; if (style) Object.assign(n.style, style); (parent || stage).append(n); return n; };
  const anim = (node, frames, start, dur, easing = E) => node.animate(frames, { duration: dur * 1000, delay: start * 1000, fill: "both", easing });
  const loadImg = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(im); im.src = src; });
  const cover = (im, w, h, focus) => { const s = Math.max(w / im.naturalWidth, h / im.naturalHeight); const bw = im.naturalWidth * s, bh = im.naturalHeight * s; return { bw, bh, ox: (w - bw) / 2, oy: (h - bh) * focus }; };
  const photoStyle = (im, focus, dx = 0) => { const c = cover(im, W, H, focus); return { backgroundImage: `url(${im.src})`, backgroundSize: `${c.bw}px ${c.bh}px`, backgroundPosition: `${c.ox - dx}px ${c.oy}px`, backgroundRepeat: "no-repeat" }; };
  const fullPhoto = (im, focus, z) => { const layer = el("div", "layer", stage, { zIndex: z }); const ph = el("div", "photo", layer, { inset: "0", ...photoStyle(im, focus) }); return { layer, ph }; };

  async function build() {
    await Promise.all([document.fonts.load('800 100px "Bricolage"'), document.fonts.load('500 40px "Bricolage"'), document.fonts.load('600 40px "Bricolage"'), document.fonts.load('700 40px "Bricolage"')]);
    const ims = await Promise.all(P.photos.map(([n]) => loadImg(`photos/${n}.webp`)));
    const [f1, f2, f3] = P.photos.map(([, f]) => f);

    /* ---------- B: first photo, name ---------- */
    const b = fullPhoto(ims[0], f1, 10);
    el("div", "shade-left", b.layer); el("div", "shade-bottom", b.layer);
    anim(b.ph, [{ transform: "scale(1.12)" }, { transform: "scale(1)" }], 2.0, 5.6, "linear");
    const stole = el("div", "stole", b.layer, { backgroundImage: kente(P.seed).url });
    anim(stole, [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], 2.7, 1.1);
    const title = el("div", "title", b.layer);
    const kicker = el("p", "kicker", title); kicker.textContent = P.kicker;
    anim(kicker, [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], 3.0, 0.6);
    const name = el("h1", "name", title);
    P.name.forEach((line, i) => {
      const s = el("span", "", name), bb = el("b", "", s); bb.textContent = line;
      anim(bb, [{ transform: "translateY(110%)" }, { transform: "none" }], 3.15 + i * 0.14, 0.85);
    });
    anim(title, [{ opacity: 1 }, { opacity: 0 }], 6.75, 0.35, "linear");

    /* ---------- C: loom transition into the second photo, the line ---------- */
    const cLayer = el("div", "layer", stage, { zIndex: 20 });
    const strips = el("div", "strips", cLayer);
    const N = 12, SW = W / N, KH = Math.round(H * 0.7);
    for (let j = 0; j < N; j++) {
      const s = el("div", "strip", strips, { width: `${SW}px` });
      const reel = el("div", "reel", s);
      const k = () => el("span", "k", reel, { height: `${KH}px`, backgroundImage: kente(200 + (j % 5)).url });
      const p = () => el("span", "", reel, { height: `${H}px`, ...photoStyle(ims[1], f2, j * SW) });
      const down = j % 2 === 0;
      if (down) { p(); k(); } else { k(); p(); }
      const from = down ? -(H + KH) : H;
      const to = down ? 0 : -KH;
      const dist = Math.abs(j - (N - 1) / 2) / ((N - 1) / 2);
      anim(reel, [{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }], 6.9 + dist * 0.22, 1.25, EIO);
    }
    const c = fullPhoto(ims[1], f2, 21);
    anim(c.layer, [{ opacity: 0 }, { opacity: 1 }], 8.4, 0.01, "linear");
    anim(c.ph, [{ transform: "scale(1)" }, { transform: "scale(1.07)" }], 8.4, 2.6, "linear");
    el("div", "shade-bottom", c.layer);
    const box = el("div", "tag-box", stage, { zIndex: 22 });
    el("p", "", box).textContent = P.line;
    // one animation for in and out, so the box is hidden before and after its moment
    anim(box, [
      { opacity: 0, transform: "translateY(40px)", offset: 0 },
      { opacity: 1, transform: "none", offset: 0.25, easing: "linear" },
      { opacity: 1, transform: "none", offset: 0.875 },
      { opacity: 0, transform: "none", offset: 1 },
    ], 8.25, 2.4, "linear");

    /* ---------- D: weft wipe into the third photo, when ---------- */
    const d = fullPhoto(ims[2], f3, 30);
    el("div", "shade-left", d.layer);
    anim(d.layer, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], 10.5, 0.85, EIO);
    anim(d.ph, [{ transform: "scale(1.1)" }, { transform: "scale(1)" }], 10.5, 2.6, "linear");
    const edge = el("div", "", stage, { position: "absolute", top: 0, bottom: 0, left: "-70px", width: "70px", zIndex: 31, backgroundImage: kente(P.seed + 3).url, backgroundRepeat: "repeat-y", backgroundSize: "100% auto", boxShadow: "0 0 40px rgba(0,0,0,.5)" });
    anim(edge, [{ transform: "translateX(0)" }, { transform: `translateX(${W + 70}px)` }], 10.5, 0.85, EIO);
    const sched = el("div", "sched", stage, { zIndex: 32 });
    const when = el("div", "when", sched); when.textContent = P.when;
    const where = el("p", "where", sched); where.textContent = P.where;
    anim(when, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], 11.15, 0.6);
    anim(where, [{ opacity: 0, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }], 11.5, 0.5);

    /* ---------- E: end card ---------- */
    const end = el("div", "end", stage, { zIndex: 60 });
    anim(end, [{ transform: "translateY(100%)" }, { transform: "none" }], 12.6, 0.8, EIO);
    const top = el("div", "band cloth", end, { top: 0, height: "110px" });
    const bot = el("div", "band cloth", end, { bottom: 0, height: "56px" });
    for (const [band, sw, seed] of [[top, 64, 21], [bot, 44, 3]]) {
      for (let i = 0; i < Math.ceil(W / sw) + 1; i++) {
        const t = kente(seed + (i % 5));
        el("i", "", band, { width: `${sw}px`, backgroundImage: t.url, backgroundPositionY: `${-((i % 2) * (t.h * (sw / t.w)) / 2)}px` });
      }
    }
    const inner = el("div", "inner", end);
    const brand = el("div", "brand", inner);
    const crest = el("img", "", brand); crest.src = "crest.png"; crest.alt = "";
    el("span", "", brand).textContent = "PHANET KNUST";
    const h3 = el("h3", "", inner); h3.innerHTML = P.name.join("<br>");
    const w2 = el("p", "when", inner); w2.textContent = P.when;
    const cta = el("div", "cta", inner);
    el("span", "pill black", cta).textContent = "Come as you are";
    el("span", "pill line", cta).textContent = "phaneteers.com";
    const theme = el("p", "theme", end); theme.textContent = "2026/27 · Let No Man Despise Thy Youth · 1 Timothy 4:12";
    [brand, h3, w2, cta, theme].forEach((n, i) => anim(n, [{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "none" }], 13.1 + i * 0.14, 0.6));

    /* ---------- A: the opening weave (on top of everything at the start) ---------- */
    const open = el("div", "layer", stage, { zIndex: 80 });
    const cloth = el("div", "cloth", open);
    for (let i = 0; i < 21; i++) {
      const t = kente(61 + (i % 5)), sw = 96;
      const s = el("i", "", cloth, { width: `${sw}px`, backgroundImage: t.url, backgroundPositionY: `${-((i % 2) * (t.h * (sw / t.w)) / 2)}px` });
      anim(s, [{ transform: `translateY(${(i % 2 ? -1 : 1) * (H + 80)}px)` }, { transform: "none" }], 0.05 + (i % 7) * 0.05 + Math.floor(i / 7) * 0.03, 0.95);
    }
    el("div", "cloth-shade", open);
    const present = el("div", "present", open);
    const pi = el("div", "", present);
    el("p", "", pi).textContent = "PHANET KNUST presents";
    const big = el("h2", "", pi); big.innerHTML = P.name.join("<br>");
    anim(pi, [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], 0.85, 0.6);
    anim(open, [{ transform: "none" }, { transform: "translateY(-100%)" }], 2.15, 0.85, EIO);

    document.getAnimations().forEach((a) => a.pause());
  }

  window.seek = (t) => { document.getAnimations().forEach((a) => { a.currentTime = Math.min(t, T) * 1000; }); };
  window.DURATION = T;
  window.ready = build();
})();
