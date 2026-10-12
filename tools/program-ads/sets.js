// Backgrounds ("sets") for the cartoon ads. Each returns { draw(t, lt) } where t = global time,
// lt = time since the scene started. Flat shapes in the PHANET palette with kente accents.

function bunting(g, y, seeds, sag = 70) {
  const line = s("path", { d: `M -20 ${y} Q ${W / 2} ${y + sag * 2} ${W + 20} ${y}`, stroke: C.ink, "stroke-width": 3, fill: "none" }, g);
  const flags = [];
  for (let i = 0; i < 16; i++) {
    const x = 60 + i * 120, u = x / W, yy = y + 4 * sag * u * (1 - u);
    const f = s("path", { d: "M -34 0 L 34 0 L 0 62 Z", fill: kentePattern(seeds[i % seeds.length], 34) }, g);
    flags.push({ f, x, yy });
  }
  return { draw(t) { flags.forEach(({ f, x, yy }, i) => tf(f, x, yy, Math.sin(t * 3 + i) * 5 + pump(t) * (i % 2 ? 4 : -4))); } };
}

function plant(g, x, y, sc = 1) {
  const p = s("g", { transform: `translate(${x} ${y}) scale(${sc})` }, g);
  for (const [r, c] of [[-30, "#2f7d4f"], [0, "#3f9a60"], [28, "#2a6d45"], [-12, "#4aa86b"], [14, "#358a55"]]) s("path", { d: "M 0 0 C -30 -60 -10 -150 0 -170 C 10 -150 30 -60 0 0 Z", fill: c, transform: `rotate(${r})` }, p);
  s("path", { d: "M -40 0 L 40 0 L 30 70 L -30 70 Z", fill: "#b5582f" }, p);
  s("rect", { x: -44, y: -6, width: 88, height: 14, rx: 4, fill: "#9a4523" }, p);
  return p;
}

const SETS = {
  hall(g) { // warm fellowship hall: tall windows, light shafts, kente bunting
    s("rect", { x: 0, y: 0, width: W, height: H, fill: C.cream }, g);
    const rays = [];
    for (const x of [360, 960, 1560]) {
      s("path", { d: `M ${x - 120} 640 L ${x - 120} 230 Q ${x} 90 ${x + 120} 230 L ${x + 120} 640 Z`, fill: "#fff3d0", stroke: C.cream2, "stroke-width": 18 }, g);
      s("path", { d: `M ${x} 120 L ${x} 640 M ${x - 120} 400 L ${x + 120} 400`, stroke: C.cream2, "stroke-width": 10 }, g);
      rays.push(s("path", { d: `M ${x - 110} 640 L ${x + 110} 640 L ${x + 330} 1080 L ${x - 60} 1080 Z`, fill: "#ffe39a", opacity: 0.35 }, g));
    }
    s("rect", { x: 0, y: 780, width: W, height: 300, fill: C.cream2 }, g);
    for (let i = 0; i < 9; i++) s("path", { d: `M ${i * 240 - 200} 1080 L ${i * 240 + 40} 780`, stroke: "#e6dcc7", "stroke-width": 4 }, g);
    s("rect", { x: 0, y: 772, width: W, height: 12, fill: "#e2d6bd" }, g);
    plant(g, 90, 700, 1.1); plant(g, 1830, 700, 1.1);
    const b1 = bunting(g, 40, [23, 31, 47, 59]);
    return { draw(t) { b1.draw(t); rays.forEach((r, i) => r.setAttribute("opacity", 0.26 + 0.12 * Math.sin(t * 1.4 + i))); } };
  },

  night(g, { dawn = false } = {}) { // night sky over the campus; with dawn, the sun comes up
    const sky = s("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#nightSky)" }, g);
    const dawnSky = s("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#dawnSky)", opacity: 0 }, g);
    const r = rng(7), stars = [];
    for (let i = 0; i < 70; i++) stars.push(s("circle", { cx: r() * W, cy: r() * 620, r: 1.5 + r() * 2.8, fill: "#fff6dc" }, g));
    const moonG = s("g", {}, g);
    s("circle", { cx: 1520, cy: 220, r: 180, fill: "url(#glow)", opacity: 0.6 }, moonG);
    s("circle", { cx: 1520, cy: 220, r: 78, fill: "#fff6dc" }, moonG);
    s("circle", { cx: 1552, cy: 196, r: 70, fill: "#0e1d52", opacity: 0.9 }, moonG);
    const sun = s("g", {}, g);
    s("circle", { cx: 0, cy: 0, r: 260, fill: "url(#sunGlow)" }, sun); s("circle", { cx: 0, cy: 0, r: 90, fill: "#ffd36b" }, sun);
    // campus skyline
    const sk = s("g", { fill: "#081236" }, g);
    s("path", { d: "M 0 760 L 0 600 L 140 600 L 140 560 L 300 560 L 300 640 L 420 640 L 420 520 L 520 470 L 620 520 L 620 650 L 760 650 L 760 590 L 980 590 L 980 540 L 1120 540 L 1120 620 L 1300 620 L 1300 500 L 1360 460 L 1420 500 L 1420 640 L 1600 640 L 1600 580 L 1780 580 L 1780 620 L 1920 620 L 1920 760 Z" }, sk);
    for (const x of [230, 880, 1700]) { s("rect", { x: x - 6, y: 480, width: 12, height: 240 }, sk); for (const a of [-60, -25, 15, 50, 95, 130]) s("path", { d: "M 0 0 C 40 -18 90 -10 120 20 C 80 0 40 -2 0 0 Z", transform: `translate(${x} 480) rotate(${a})` }, sk); }
    const windows = [];
    for (let i = 0; i < 26; i++) windows.push(s("rect", { x: 160 + i * 66, y: 610 + (i % 3) * 22, width: 14, height: 12, fill: "#ffd36b", opacity: 0.8 }, g));
    s("rect", { x: 0, y: 740, width: W, height: 340, fill: "#060d2a" }, g);
    const ground = s("rect", { x: 0, y: 740, width: W, height: 340, fill: "#3a2a1c", opacity: 0 }, g);
    // string lights
    s("path", { d: `M -20 120 Q ${W / 2} 300 ${W + 20} 120`, stroke: "#2a2a2a", "stroke-width": 3, fill: "none" }, g);
    const bulbs = [];
    for (let i = 0; i < 22; i++) { const x = i * 92, u = x / W; bulbs.push(s("circle", { cx: x, cy: 120 + 4 * 180 * u * (1 - u) * 0.5 + 10, r: 9, fill: i % 2 ? C.gold : "#fff2c4" }, g)); }
    return {
      draw(t, lt) {
        const { k } = beatOf(t);
        stars.forEach((st, i) => st.setAttribute("opacity", 0.35 + 0.65 * Math.abs(Math.sin(t * 1.3 + i * 1.7))));
        bulbs.forEach((b, i) => b.setAttribute("opacity", ((k + i) % 2 ? 0.45 : 1) * (0.6 + 0.4 * pump(t))));
        windows.forEach((w, i) => w.setAttribute("opacity", (i * 7 + k) % 5 === 0 ? 0.25 : 0.85));
        const d = dawn ? ease.inOut(clamp(lt / 3.4)) : 0;
        dawnSky.setAttribute("opacity", d); ground.setAttribute("opacity", d * 0.7);
        moonG.setAttribute("opacity", 1 - clamp(d * 2.5)); moonG.setAttribute("transform", `translate(0 ${d * -200})`);
        sun.style.display = dawn ? "" : "none"; tf(sun, 960, lerp(900, 560, d));
        stars.forEach((st) => st.setAttribute("opacity", (1 - d) * Number(st.getAttribute("opacity"))));
      },
    };
  },

  vigil(g) { // the hall at night: warm lamps, deep blue walls
    s("rect", { x: 0, y: 0, width: W, height: H, fill: "#14183f" }, g);
    s("rect", { x: 0, y: 760, width: W, height: 320, fill: "#0d1030" }, g);
    const lamps = [];
    for (const x of [260, 760, 1160, 1660]) {
      s("path", { d: `M ${x} 0 L ${x} 150`, stroke: "#2c2c40", "stroke-width": 4 }, g);
      lamps.push(s("circle", { cx: x, cy: 190, r: 160, fill: "url(#glow)" }, g));
      s("path", { d: `M ${x - 36} 150 L ${x + 36} 150 L ${x + 26} 210 L ${x - 26} 210 Z`, fill: C.gold }, g);
    }
    const cross = s("g", { opacity: 0.18 }, g);
    s("rect", { x: 940, y: 180, width: 40, height: 260, fill: C.goldLight }, cross); s("rect", { x: 880, y: 250, width: 160, height: 40, fill: C.goldLight }, cross);
    const rays = s("g", { opacity: 0.05 }, g);
    for (let i = 0; i < 9; i++) s("path", { d: `M 960 320 L ${i * 240 - 40} 1080 L ${i * 240 + 60} 1080 Z`, fill: C.goldLight }, rays);
    return { draw(t) { lamps.forEach((l, i) => l.setAttribute("opacity", 0.55 + 0.25 * Math.sin(t * 2 + i) + 0.2 * pump(t))); rays.setAttribute("opacity", 0.035 + 0.05 * pump(t)); rays.setAttribute("transform", `rotate(${Math.sin(t * 0.8) * 4} 960 320)`); } };
  },

  classroom(g) {
    s("rect", { x: 0, y: 0, width: W, height: H, fill: C.cream }, g);
    s("rect", { x: 0, y: 760, width: W, height: 320, fill: "#efe3c8" }, g);
    s("rect", { x: 520, y: 120, width: 880, height: 440, rx: 10, fill: "#fff", stroke: "#cdbf9f", "stroke-width": 16 }, g);
    s("rect", { x: 520, y: 560, width: 880, height: 16, fill: "#b9aa86" }, g);
    const doodles = s("g", { fill: "none", stroke: C.blue, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    const aplus = s("text", { x: 600, y: 330, "font-size": 170, "font-weight": 800, fill: C.red, stroke: "none", style: "font-family:Bricolage;font-stretch:80%" }, g); aplus.textContent = "A+";
    s("path", { d: "M 900 250 L 1000 250 M 900 300 L 1080 300 M 900 350 L 1040 350" }, doodles);
    s("path", { d: "M 1150 420 L 1190 460 L 1280 340" , stroke: "#2f8a4f" }, doodles);
    const chart = s("path", { d: "M 900 500 L 980 460 L 1060 480 L 1140 400 L 1240 380", stroke: C.gold, "stroke-width": 9 }, doodles);
    s("rect", { x: 140, y: 150, width: 280, height: 340, fill: "#fff3d0", stroke: C.cream2, "stroke-width": 14 }, g);
    s("path", { d: "M 280 150 L 280 490 M 140 320 L 420 320", stroke: C.cream2, "stroke-width": 10 }, g);
    const shelf = s("g", {}, g);
    s("rect", { x: 1520, y: 300, width: 300, height: 14, fill: "#a4723f" }, shelf);
    ["#a3201c", C.blue, C.gold, "#2f7d4f", C.navy, "#6b1d1a", C.gold].forEach((c, i) => s("rect", { x: 1530 + i * 40, y: 200 + (i % 3) * 10, width: 32, height: 100 - (i % 3) * 10, rx: 3, fill: c }, shelf));
    const bulbs = [];
    return { draw(t) { set(chart, { "stroke-dasharray": 500, "stroke-dashoffset": 500 * (1 - clamp((t % 4) / 2)) }); aplus.setAttribute("transform", `rotate(${Math.sin(t * 6) * 2 * pump(t)} 680 280) translate(0 ${-6 * pump(t)})`); } };
  },

  stage(g) { // blue stage, kente curtains, sweeping spotlights
    s("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#stageSky)" }, g);
    const spots = [];
    for (const [x, c] of [[480, 0], [960, 1], [1440, 2]]) spots.push({ el: s("path", { d: `M ${x} -20 L ${x - 260} 1080 L ${x + 260} 1080 Z`, fill: "url(#spot)", opacity: 0.7 }, g), x, c });
    for (let i = 0; i < 4; i++) { s("rect", { x: i * 110 - 20, y: 0, width: 120, height: 1080, fill: kentePattern(61 + i, 120) }, g); s("rect", { x: W - (i + 1) * 110 - 0, y: 0, width: 120, height: 1080, fill: kentePattern(71 + i, 120) }, g); }
    s("rect", { x: 0, y: 0, width: 440, height: 1080, fill: "url(#stoleShade)", opacity: 0.6 }, g); s("rect", { x: W - 440, y: 0, width: 440, height: 1080, fill: "url(#stoleShade)", opacity: 0.6 }, g);
    s("rect", { x: 0, y: 0, width: W, height: 70, fill: kentePatternH(33, 70) }, g);
    s("ellipse", { cx: 960, cy: 1010, rx: 1100, ry: 200, fill: "#0b1f5c" }, g);
    s("ellipse", { cx: 960, cy: 1000, rx: 1100, ry: 190, fill: "none", stroke: C.gold, "stroke-width": 8 }, g);
    return { draw(t) { spots.forEach(({ el, x, c }) => { el.setAttribute("transform", `rotate(${Math.sin(t * 1.6 + c * 2) * 16} ${x} -20)`); el.setAttribute("opacity", 0.45 + 0.4 * pump(t)); }); } };
  },

  skyline(g) { // the city at golden hour
    s("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#daySky)" }, g);
    const sun = s("g", { transform: "translate(1500 300)" }, g);
    s("circle", { r: 300, fill: "url(#sunGlow)" }, sun); s("circle", { r: 110, fill: "#ffd36b" }, sun);
    const r = rng(11), blocks = [];
    for (let i = 0; i < 16; i++) {
      const w = 90 + r() * 90, h = i < 7 ? 110 + r() * 90 : 200 + r() * 380, x = i * 125 - 30, c = [C.navy, C.blue, "#2a3a8c", C.ink][i % 4];
      const b = s("g", {}, g);
      s("rect", { x, y: 780 - h, width: w, height: h, fill: c }, b);
      for (let yy = 800 - h; yy < 740; yy += 46) for (let xx = x + 16; xx < x + w - 20; xx += 34) s("rect", { x: xx, y: yy, width: 16, height: 22, fill: r() > 0.5 ? C.goldLight : "rgba(255,255,255,.15)" }, b);
      blocks.push(b);
    }
    s("rect", { x: 0, y: 760, width: W, height: 320, fill: "#2a2a2a" }, g);
    s("rect", { x: 0, y: 760, width: W, height: 26, fill: C.cream2 }, g);
    const dashes = s("g", {}, g);
    for (let i = 0; i < 14; i++) s("rect", { x: i * 160, y: 930, width: 90, height: 12, fill: C.gold }, dashes);
    return { draw(t) { dashes.setAttribute("transform", `translate(${-((t * 320) % 160)} 0)`); } };
  },

  boardroom(g) {
    s("rect", { x: 0, y: 0, width: W, height: H, fill: C.cream }, g);
    s("rect", { x: 0, y: 770, width: W, height: 310, fill: "#e9dcc1" }, g);
    s("rect", { x: 760, y: 110, width: 1000, height: 560, rx: 12, fill: C.ink }, g);
    s("rect", { x: 790, y: 140, width: 940, height: 500, rx: 6, fill: "#fff" }, g);
    const bars = [];
    for (let i = 0; i < 6; i++) bars.push(s("rect", { x: 850 + i * 140, y: 600, width: 90, height: 0, rx: 6, fill: i % 2 ? C.blue : C.gold }, g));
    const arrow = s("path", { d: "M 860 560 L 1000 500 L 1140 520 L 1280 400 L 1420 380 L 1580 230", fill: "none", stroke: C.red, "stroke-width": 12, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    const head = s("path", { d: "M 0 0 L -34 -6 L -14 -30 Z", fill: C.red }, g);
    s("rect", { x: 80, y: 180, width: 300, height: 380, fill: "#fff3d0", stroke: C.cream2, "stroke-width": 14 }, g);
    plant(g, 1850, 700, 1);
    return { draw(t, lt) {
      bars.forEach((b, i) => { const p = ease.back(prog(lt, 0.15 + i * BEAT / 2, 0.45)); const h = (120 + i * 60) * p; set(b, { y: 600 - h, height: Math.max(0, h) }); });
      const pa = ease.inOut(prog(lt, 1.0, 1.8)); set(arrow, { "stroke-dasharray": 1000, "stroke-dashoffset": 1000 * (1 - pa) });
      head.setAttribute("opacity", pa > 0.98 ? 1 : 0); tf(head, 1580, 230, 34);
    } };
  },

  market(g) { // stalls with kente awnings
    s("rect", { x: 0, y: 0, width: W, height: H, fill: "url(#daySky)" }, g);
    s("rect", { x: 0, y: 760, width: W, height: 320, fill: "#d8c7a4" }, g);
    const awnings = [], outer = g;
    g = s("g", { transform: "translate(960 770) scale(0.82) translate(-960 -770)" }, outer);
    for (const [x, seed] of [[120, 23], [700, 47], [1280, 59]]) {
      s("rect", { x, y: 300, width: 520, height: 460, fill: "#f5ead2" }, g);
      s("rect", { x: x + 10, y: 300, width: 16, height: 460, fill: "#8a5a2b" }, g); s("rect", { x: x + 494, y: 300, width: 16, height: 460, fill: "#8a5a2b" }, g);
      const aw = s("g", {}, g);
      s("path", { d: `M ${x - 30} 230 L ${x + 550} 230 L ${x + 550} 330 ${Array.from({ length: 8 }, (_, i) => `Q ${x + 550 - i * 72.5 - 36} 370 ${x + 550 - (i + 1) * 72.5} 330`).join(" ")} Z`, fill: kentePatternH(seed, 100) }, aw);
      awnings.push(aw);
      s("rect", { x: x + 40, y: 560, width: 440, height: 30, fill: "#a4723f" }, g);
      const fr = rng(seed);
      for (let i = 0; i < 9; i++) s("circle", { cx: x + 80 + i * 45, cy: 540 - (i % 2) * 10, r: 20, fill: ["#e8ad12", "#d9541e", "#3f9a60", "#a3201c"][i % 4] }, g);
    }
    return { draw(t) { awnings.forEach((a, i) => a.setAttribute("transform", `translate(0 ${Math.sin(t * 2 + i) * 2})`)); } };
  },
};

// kente confetti bursts (on bar lines)
function confetti(g, seed, n = 60) {
  const r = rng(seed), bits = [];
  for (let i = 0; i < n; i++) bits.push({ el: s("rect", { x: -9, y: -5, width: 18, height: 10, fill: [C.gold, C.blue, C.red, C.ink, C.goldLight][i % 5] }, g), x: r() * W, vx: (r() - 0.5) * 400, vy: -300 - r() * 600, rot: r() * 360, vr: (r() - 0.5) * 900 });
  return { draw(lt) { bits.forEach((b) => { const tt = Math.max(0, lt); const x = b.x + b.vx * tt, y = 1100 + b.vy * tt + 700 * tt * tt * 0.9; b.el.style.display = lt < 0 || y > 1200 ? "none" : ""; tf(b.el, x, y - 300, b.rot + b.vr * tt); }); } };
}
