// The ad: opening weave (0–2s), three scenes on the bar lines (2, 6, 10), end card (14–16s).
// Each scene change lands on a downbeat of the music with its own transition:
// 2s the cloth lifts, 6s three stoles swing across, 10s a gold ring opens, 14s the loom closes.
(() => {
  const slug = new URLSearchParams(location.search).get("program") || "gathering-of-the-adelphos";
  const A = window.AD[slug];
  DEFS = document.getElementById("defs");
  const stage = document.getElementById("stage");
  const textRoot = document.getElementById("text");
  const S1 = 2, S2 = 6, S3 = 10, END = 14;
  const cx = W / 2, cy = H / 2;

  /* ---------- extras: little animated things scenes can ask for ---------- */
  const EXTRA = {
    notes(g) { const r = rng(3), n = []; for (let i = 0; i < 10; i++) { const el = s("text", { "font-size": 70, fill: [C.gold, C.blue, C.red][i % 3], style: "font-family:serif" }, g); el.textContent = i % 2 ? "♪" : "♫"; n.push({ el, x: 200 + r() * 1500, d: r() * 4 }); }
      return (t, lt) => n.forEach((o, i) => { const a = ((lt + o.d) % 4) / 4; set(o.el, { x: o.x + Math.sin(a * 6 + i) * 30, y: 700 - a * 600, opacity: Math.sin(a * Math.PI) }); }); },
    bulbs(g, pts) { const b = pts.map(([x, y]) => { const e = s("g", {}, g); s("circle", { r: 70, fill: "url(#glow)" }, e); s("circle", { r: 26, fill: "#ffd36b" }, e); s("rect", { x: -12, y: 22, width: 24, height: 16, rx: 3, fill: "#9a9aa8" }, e); for (const a of [-60, -30, 0, 30, 60]) s("rect", { x: -3, y: -64, width: 6, height: 18, rx: 3, fill: C.gold, transform: `rotate(${a})` }, e); return { e, x, y }; });
      return (t, lt) => b.forEach(({ e, x, y }, i) => { const p = ease.back(prog(lt, 0.3 + i * BEAT, 0.4)); tf(e, x, y - 10 * pump(t), 0, Math.max(0.001, p)); }); },
    clock(g, [x, y]) { const c = s("g", { transform: `translate(${x} ${y})` }, g); s("circle", { r: 90, fill: "#fff6dc", stroke: C.gold, "stroke-width": 10 }, c); for (let i = 0; i < 12; i++) s("rect", { x: -3, y: -80, width: 6, height: 14, fill: C.ink, transform: `rotate(${i * 30})` }, c);
      const h = s("rect", { x: -5, y: -50, width: 10, height: 54, rx: 5, fill: C.ink }, c), m = s("rect", { x: -3.5, y: -74, width: 7, height: 78, rx: 3.5, fill: C.red }, c); s("circle", { r: 9, fill: C.ink }, c);
      return (t, lt) => { h.setAttribute("transform", `rotate(${lt * 90 + 300})`); m.setAttribute("transform", `rotate(${lt * 1080})`); c.setAttribute("transform", `translate(${x} ${y}) scale(${1 + 0.05 * pump(t)})`); }; },
    caps(g) { const r = rng(9), caps = []; for (let i = 0; i < 9; i++) { const e = s("g", {}, g); s("path", { d: "M -60 0 L 0 -26 L 60 0 L 0 26 Z", fill: C.ink }, e); s("rect", { x: -30, y: 6, width: 60, height: 26, fill: C.ink }, e); s("path", { d: "M 0 0 L 40 30 L 40 60", stroke: C.gold, "stroke-width": 5, fill: "none" }, e); caps.push({ e, x: 260 + i * 170, d: (i % 4) * BEAT, v: 900 + r() * 300, rot: (r() - 0.5) * 720 }); }
      return (t, lt) => caps.forEach((c) => { const tt = lt - 0.6 - c.d; c.e.style.display = tt < 0 ? "none" : ""; if (tt < 0) return; const y = 720 - c.v * tt + 1100 * tt * tt; tf(c.e, c.x, Math.min(y, 1300), c.rot * tt); }); },
    pages(g) { const r = rng(4), p = []; for (let i = 0; i < 12; i++) { const e = s("g", {}, g); s("rect", { x: -70, y: -80, width: 140, height: 160, fill: "#fff", stroke: C.line, "stroke-width": 4 }, e); s("rect", { x: -70, y: -80, width: 140, height: 40, fill: C.red }, e); const tx = s("text", { x: 0, y: 40, "font-size": 70, "font-weight": 800, "text-anchor": "middle", fill: C.ink, style: "font-family:Bricolage;font-stretch:80%" }, e); tx.textContent = String(1 + (i * 7) % 31); p.push({ e, d: i * BEAT / 2, vx: 300 + r() * 700, vy: -200 - r() * 400, vr: (r() - 0.5) * 600 }); }
      return (t, lt) => p.forEach((o) => { const tt = lt - 0.3 - o.d; o.e.style.display = tt < 0 ? "none" : ""; if (tt < 0) return; tf(o.e, 1480 + o.vx * tt, 300 + o.vy * tt + 500 * tt * tt, o.vr * tt, 1); }); },
    coins(g) { const r = rng(5), cs = []; for (let i = 0; i < 14; i++) { const e = s("g", {}, g); s("ellipse", { rx: 34, ry: 34, fill: C.gold, stroke: C.goldDeep, "stroke-width": 6 }, e); s("rect", { x: -5, y: -18, width: 10, height: 36, rx: 3, fill: C.goldDeep }, e); cs.push({ e, x: 120 + r() * 1700, d: r() * 3, sp: 0.6 + r() * 0.6 }); }
      return (t, lt) => cs.forEach((c) => { const a = ((lt * c.sp + c.d) % 2) / 2; tf(c.e, c.x, -60 + a * 1200, 0, Math.cos(lt * 6 + c.d * 3) || 0.01, 1); }); },
    bubbles(g, items) { const b = items.map(([x, y, label], i) => { const e = s("g", {}, g); s("rect", { x: -150, y: -46, width: 300, height: 92, rx: 46, fill: "#fff", stroke: C.ink, "stroke-width": 4 }, e); s("circle", { cx: -100, cy: 0, r: 26, fill: "#2f8a4f" }, e); s("path", { d: "M -112 0 L -102 10 L -86 -10", stroke: "#fff", "stroke-width": 6, fill: "none", "stroke-linecap": "round" }, e); const tx = s("text", { x: -60, y: 14, "font-size": 40, "font-weight": 700, fill: C.ink, style: "font-family:Bricolage;font-stretch:85%" }, e); tx.textContent = label; return { e, x, y, i }; });
      return (t, lt) => b.forEach(({ e, x, y, i }) => { const p = ease.back(prog(lt, 0.4 + i * BEAT * 2, 0.45)); e.style.opacity = p > 0 ? 1 : 0; tf(e, x, y - (1 - p) * 40, 0, Math.max(0.001, lerp(0.6, 1, p))); }); },
    confetti(g, seed = 1) { const c = confetti(g, seed); return (t, lt) => c.draw(lt - 0.2); },
  };

  /* ---------- scene builder ---------- */
  function buildScene(def, from, to) {
    const outer = s("g", {}, worldRoot);
    const cam = s("g", {}, outer);
    const set = SETS[def.set](s("g", {}, cam), def.setOpts || {});
    const extrasBack = s("g", {}, cam), people = [];
    const crowd = s("g", {}, cam);
    const extraFns = (def.extras || []).map(([name, ...args]) => EXTRA[name](extrasBack, ...args));
    for (const pd of [...def.people].sort((a, b) => a.y - b.y)) {
      const p = Person(crowd, pd.look);
      if (pd.prop) PROP[pd.prop](p.slot(pd.propSide || "right"));
      people.push({ p, pd });
    }
    const front = s("g", {}, cam);
    const frontFns = (def.front || []).map(([name, ...args]) => EXTRA[name](front, ...args));
    const txt = div("scene-text", textRoot);
    const t0 = def.text || {};
    let textEls = {};
    if (t0.type === "title") {
      textEls.kick = css(div("kick", txt, t0.kicker), { left: `${t0.x ?? 120}px`, top: `${(t0.y ?? 250) - 70}px`, color: t0.dark ? C.goldLight : C.goldText ?? "#8a6400" });
      textEls.big = css(div("big", txt, t0.lines.map(wrapWords).join("<br>")), { left: `${t0.x ?? 120}px`, top: `${t0.y ?? 250}px`, fontSize: `${t0.size ?? 160}px`, color: t0.dark ? "#fff" : "#000" });
    } else if (t0.type === "tag") {
      textEls.box = css(div("tagbox", txt, `<div class="l1">${wrapWords(t0.l1)}</div><div class="l2">${wrapWords(t0.l2)}</div>`), { left: `${t0.x ?? 120}px`, top: `${t0.y ?? 700}px`, fontSize: "62px", maxWidth: "1100px" });
      textEls.box.querySelector(".l2").style.cssText = "font-size:40px;font-weight:600;margin-top:10px;color:#5f5f5f";
    } else if (t0.type === "sched") {
      textEls.gold = css(div("goldbox", txt, wrapWords(t0.when)), { left: `${t0.x ?? 120}px`, top: `${t0.y ?? 130}px`, fontSize: `${t0.size ?? 110}px` });
      textEls.small = css(div("kick", txt, t0.small), { left: `${t0.x ?? 120}px`, top: `${(t0.y ?? 130) + (t0.size ?? 110) + 70}px`, color: t0.dark ? "#fff" : C.ink, fontSize: "46px", fontWeight: 600 });
    }
    return {
      from, to, outer, cam, txt,
      draw(t) {
        const visible = t >= def.showFrom && t < def.showTo;
        outer.style.display = visible ? "" : "none";
        txt.style.display = visible ? "" : "none";
        if (!visible) return;
        const lt = t - from;
        const push = 1 + 0.035 * clamp(lt / 4) + 0.014 * pump(t);
        cam.setAttribute("transform", `translate(${cx} ${cy}) scale(${push.toFixed(4)}) translate(${-cx} ${-cy})`);
        set.draw(t, lt);
        extraFns.forEach((f) => f(t, lt)); frontFns.forEach((f) => f(t, lt));
        people.forEach(({ p, pd }) => {
          const base = POSE[pd.pose](t, pd.ph || 0, pd.side);
          const enter = pd.enter ? ease.out(prog(lt, pd.enter[0], 0.6)) : 1;
          p.draw(pd.x + (pd.enter ? (1 - enter) * pd.enter[1] : 0), pd.y, pd.sc ?? 1.1, base, t);
        });
        // text, in time with the music
        if (t0.type === "title") {
          const pk = ease.out(prog(lt, 0.05, 0.4)); css(textEls.kick, { opacity: pk, transform: `translateY(${(1 - pk) * 30}px)` });
          popWords(textEls.big, t, from + 0.25, BEAT / 2);
          const out = prog(t, to - 0.25, 0.2); txt.style.opacity = 1 - out;
        } else if (t0.type === "tag") {
          const pb = ease.back(prog(lt, 0.4, 0.45)); css(textEls.box, { opacity: pb > 0 ? 1 : 0, transform: `translateY(${(1 - pb) * 50}px) rotate(${(1 - pb) * -3}deg)` });
          popWords(textEls.box.querySelector(".l1"), t, from + 0.55, BEAT / 2, { from: 1.25 });
          popWords(textEls.box.querySelector(".l2"), t, from + 1.6, BEAT / 4, { from: 1.15 });
          txt.style.opacity = 1 - prog(t, to - 0.3, 0.25);
        } else if (t0.type === "sched") {
          const pg = prog(lt, 0.5, 0.35);
          const slam = ease.back(pg);
          css(textEls.gold, { opacity: pg > 0 ? 1 : 0, transform: `scale(${lerp(1.6, 1, slam)}) rotate(${lerp(-6, -2, slam)}deg)`, transformOrigin: "0 50%" });
          popWords(textEls.gold, t, from + 0.55, BEAT / 4, { from: 1.2 });
          const ps = ease.out(prog(lt, 1.1, 0.5)); css(textEls.small, { opacity: ps, transform: `translateY(${(1 - ps) * 24}px)` });
          txt.style.opacity = 1 - prog(t, to - 0.15, 0.15);
        }
      },
    };
  }

  /* ---------- build ---------- */
  const worldRoot = s("g", {}, stage);
  const scenes = [
    buildScene({ ...A.s1, showFrom: 1.1, showTo: S2 }, S1, S2),
    buildScene({ ...A.s2, showFrom: S2, showTo: S3 + 0.62 }, S2, S3),
    buildScene({ ...A.s3, showFrom: S3 - 0.06, showTo: END + 0.1 }, S3, END),
  ];
  // iris: scene 3 opens from the centre inside a gold ring
  const clip = s("clipPath", { id: "iris" }, DEFS); const irisC = s("circle", { cx, cy, r: 0 }, clip);
  scenes[2].outer.setAttribute("clip-path", "url(#iris)");
  const ring = s("circle", { cx, cy, r: 0, fill: "none", stroke: C.gold, "stroke-width": 26 }, stage);
  const ring2 = s("circle", { cx, cy, r: 0, fill: "none", stroke: kentePattern(A.seed, 40), "stroke-width": 40 }, stage);

  // end card
  const end = s("g", {}, stage);
  const loom = makeLoom(stage, A.seed, C.cream);
  const endG = s("g", {}, stage);
  s("rect", { x: 0, y: 0, width: W, height: H, fill: C.cream }, endG);
  s("rect", { x: 0, y: 0, width: W, height: 104, fill: kentePatternH(21, 104) }, endG);
  s("rect", { x: 0, y: H - 52, width: W, height: 52, fill: kentePatternH(3, 52) }, endG);
  const endCrowd = s("g", {}, endG);
  const dancers = A.end.map((look, i) => ({ p: Person(endCrowd, look), x: [170, 400, 1520, 1750][i], ph: i * 0.5 }));
  const endConf = confetti(s("g", {}, endG), A.seed + 2, 90);
  const endTxt = div("scene-text", textRoot);
  const brand = css(div("", endTxt, `<img src="assets/crest.png" alt=""><span>PHANET KNUST</span>`), { position: "absolute", left: 0, right: 0, top: "190px", display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", fontSize: "38px", fontWeight: 800, letterSpacing: ".14em", fontStretch: "90%", color: C.ink });
  css(brand.querySelector("img"), { width: "84px", height: "84px", borderRadius: "50%", background: "#fff", boxShadow: "0 0 0 2px rgba(0,0,0,.08)" });
  const endName = css(div("big", endTxt, A.name.map(wrapWords).join("<br>")), { left: 0, right: 0, top: "320px", textAlign: "center", fontSize: "150px", color: "#000" });
  const endWhen = css(div("kick", endTxt, A.when), { left: 0, right: 0, top: `${320 + 150 * 0.86 * A.name.length + 40}px`, textAlign: "center", color: "#8a6400", fontSize: "52px" });
  const endCta = css(div("", endTxt, `<span class="pill" style="background:#000;color:#fff">Come as you are</span><span class="pill" style="border:4px solid #000;color:#000;margin-left:20px">phaneteers.com</span>`), { position: "absolute", left: 0, right: 0, top: `${320 + 150 * 0.86 * A.name.length + 140}px`, textAlign: "center" });
  const endTheme = css(div("kick", endTxt, "2026/27 · Let No Man Despise Thy Youth · 1 Timothy 4:12"), { left: 0, right: 0, bottom: "86px", textAlign: "center", fontSize: "28px", color: "#5f5f5f" });

  // transitions on top
  const swing = makeStoleSwing(stage, A.seed + 10);
  const cloth = makeCloth(stage, 61);
  const openTxt = div("scene-text", textRoot);
  const openKick = css(div("kick", openTxt, "PHANET KNUST presents"), { left: 0, right: 0, top: "380px", textAlign: "center", color: C.goldLight, fontSize: "40px", fontWeight: 500 });
  const openName = css(div("big", openTxt, A.name.map(wrapWords).join("<br>")), { left: 0, right: 0, top: "450px", textAlign: "center", fontSize: "128px", color: "#fff" });

  function draw(t) {
    scenes.forEach((sc) => sc.draw(t));
    // iris at 10s
    const r = irisRadius(t, S3);
    irisC.setAttribute("r", t < S3 - 0.06 ? 0 : (t > S3 + 0.6 ? 2000 : r));
    const ringOn = t > S3 - 0.06 && t < S3 + 0.62;
    [ring, ring2].forEach((rg, i) => { rg.style.display = ringOn ? "" : "none"; rg.setAttribute("r", r + (i ? 30 : 0)); });
    // stole swing at 6s
    drawStoleSwing(swing, t, S2);
    // loom + end card at 14s
    drawLoom(loom, t, END);
    loom.g.style.display = t > END - 0.7 && t < END + 0.3 ? "" : "none";
    const endOn = t >= END;
    endG.style.display = endOn ? "" : "none"; endTxt.style.display = endOn ? "" : "none";
    if (endOn) {
      const lt = t - END;
      [brand, endName, endWhen, endCta].forEach((el, i) => { const p = ease.back(prog(lt, 0.1 + i * BEAT / 2, 0.45)); css(el, { opacity: p > 0 ? 1 : 0, transform: `translateY(${(1 - p) * 40}px) scale(${lerp(1.15, 1, p)})` }); });
      popWords(endName, t, END + 0.35, BEAT / 4, { from: 1.3 });
      css(endTheme, { opacity: ease.out(prog(lt, 0.9, 0.4)) });
      const fin = t >= 15;
      dancers.forEach(({ p, x, ph }, i) => p.draw(x, 1000, 0.95, fin ? POSE.jump(t, ph) : (i % 2 ? POSE.clap(t, ph) : POSE.groove(t, ph)), t));
      endConf.draw(t - 15);
    }
    // opening cloth (0–2s), lifts on the drop
    drawCloth(cloth, t, { inStart: 0.0, outStart: S1 - 0.04 });
    openTxt.style.display = t < S1 + 0.2 ? "" : "none";
    const po = ease.out(prog(t, 0.55, 0.5));
    css(openKick, { opacity: po * (1 - prog(t, S1 - 0.2, 0.2)) });
    popWords(openName, t, 0.8, BEAT / 4, { from: 1.4 });
    css(openName, { opacity: 1 - prog(t, S1 - 0.12, 0.15), transform: `scale(${1 + 0.08 * prog(t, 1.2, 0.8)})` });
  }

  window.DURATION = DURATION;
  window.seek = (t) => draw(t);
  window.ready = (async () => {
    await Promise.all([document.fonts.load('800 100px "Bricolage"'), document.fonts.load('600 40px "Bricolage"'), document.fonts.load('700 40px "Bricolage"'), document.fonts.load('500 40px "Bricolage"')]);
    await new Promise((r) => { const im = new Image(); im.onload = r; im.onerror = r; im.src = "assets/crest.png"; });
    draw(0);
  })();
})();
