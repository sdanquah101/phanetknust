// Cartoon cast: a rigged character (hips, shoulders, elbows, neck) with dance poses on the beat,
// kente stoles, several hairstyles, and props that sit in the hand.
const SKIN = ["#6b3f22", "#8a5530", "#a5683a", "#57331c", "#b97a45", "#7a4626"];
const HAIR = "#17110d";

function Person(parent, o = {}) {
  const p = {
    skin: o.skin ?? SKIN[0], shirt: o.shirt ?? C.blue, sleeve: o.sleeve ?? "short", pants: o.pants ?? C.ink,
    shoes: o.shoes ?? "#ffffff", hair: o.hair ?? "short", hairColor: o.hairColor ?? HAIR, wrap: o.wrap ?? C.gold,
    dress: o.dress ?? false, stole: o.stole ?? 23, glasses: o.glasses ?? false, beard: o.beard ?? false,
    seed: o.seed ?? 1, collar: o.collar ?? null, jacket: o.jacket ?? null,
  };
  const skinD = shade(p.skin, -0.18), shirtD = shade(p.shirt, -0.22), pantsD = shade(p.pants, -0.25);
  const root = s("g", {}, parent);
  const shadow = s("ellipse", { cx: 0, cy: 4, rx: 50, ry: 10, fill: "rgba(20,15,10,.20)" }, root);
  const body = s("g", {}, root);

  // legs
  const legs = [-1, 1].map((d) => {
    const g = s("g", {}, body);
    if (p.dress) s("rect", { x: -9, y: 0, width: 18, height: 140, rx: 9, fill: d < 0 ? p.skin : skinD }, g);
    else s("rect", { x: -15, y: -6, width: 30, height: 146, rx: 14, fill: d < 0 ? p.pants : pantsD }, g);
    s("ellipse", { cx: d * 7, cy: 140, rx: 21, ry: 10, fill: p.shoes }, g);
    s("ellipse", { cx: d * 7, cy: 143, rx: 21, ry: 5, fill: shade(p.shoes === "#ffffff" ? "#d8d2c4" : p.shoes, -0.2) }, g);
    return g;
  });

  // torso
  const torso = s("g", {}, body);
  if (p.dress) {
    s("path", { d: "M -40 -150 L 40 -150 L 66 -40 Q 0 -28 -66 -40 Z", fill: p.shirt }, torso);
    s("path", { d: "M 12 -150 L 40 -150 L 66 -40 Q 46 -36 30 -35 Z", fill: shirtD }, torso);
  }
  const tpath = "M -44 -250 C -54 -248 -56 -236 -54 -222 L -44 -146 Q -42 -136 -30 -136 L 30 -136 Q 42 -136 44 -146 L 54 -222 C 56 -236 54 -248 44 -250 Q 0 -258 -44 -250 Z";
  s("path", { d: tpath, fill: p.jacket ?? p.shirt }, torso);
  s("path", { d: "M 14 -252 Q 46 -252 52 -232 L 42 -146 Q 40 -136 30 -136 L 22 -136 Q 30 -196 14 -252 Z", fill: shade(p.jacket ?? p.shirt, -0.22) }, torso);
  if (p.jacket) s("path", { d: "M -16 -252 L 0 -196 L 16 -252 Q 0 -256 -16 -252 Z", fill: p.shirt }, torso);
  else s("path", { d: "M -15 -252 Q 0 -232 15 -252 Q 0 -256 -15 -252 Z", fill: p.skin }, torso);
  if (p.collar) s("path", { d: "M -18 -253 L -4 -238 L 0 -250 L 4 -238 L 18 -253 Z", fill: p.collar }, torso);
  if (!p.dress) s("rect", { x: -44, y: -150, width: 88, height: 10, rx: 4, fill: shade(p.pants, -0.35) }, torso);
  if (p.stole) {
    const kf = kentePattern(p.stole, 20);
    for (const d of [-1, 1]) {
      const x0 = d * 26;
      s("path", { d: `M ${x0 - 11} -252 L ${x0 + 11} -252 L ${x0 + 9 + d * 2} -150 L ${x0 - 9 + d * 2} -150 Z`, fill: kf }, torso);
      for (let k = -2; k <= 2; k++) s("rect", { x: x0 + d * 2 + k * 4 - 1, y: -150, width: 2, height: 12, fill: k % 2 ? C.gold : C.ink }, torso);
    }
  }

  // arms (in front of the torso). Right arm is a mirror so the same angles mean "outward".
  const arms = [-1, 1].map((d) => {
    const mount = s("g", { transform: `translate(${d * 44} -238) scale(${-d} 1)` }, body);
    const upper = s("g", {}, mount);
    const sleeveCol = p.jacket ?? p.shirt;
    s("rect", { x: -11, y: -8, width: 23, height: 62, rx: 11.5, fill: d < 0 ? sleeveCol : shade(sleeveCol, -0.18) }, upper);
    const fore = s("g", {}, upper);
    const long = p.sleeve === "long" || p.jacket;
    s("rect", { x: -10, y: -6, width: 20, height: 58, rx: 10, fill: long ? (d < 0 ? sleeveCol : shade(sleeveCol, -0.18)) : (d < 0 ? p.skin : skinD) }, fore);
    s("circle", { cx: 0, cy: 54, r: 12, fill: d < 0 ? p.skin : skinD }, fore);
    const slot = s("g", { transform: "translate(0 56)" }, fore);
    return { upper, fore, slot };
  });

  // head
  const head = s("g", {}, body);
  const hb = s("g", {}, head); // hair behind the face
  if (p.hair === "afro") { for (const [x, y, r] of [[0, -62, 60], [-40, -42, 34], [40, -42, 34], [-30, -86, 34], [30, -86, 34]]) s("circle", { cx: x, cy: y, r, fill: p.hairColor }, hb); }
  if (p.hair === "braids") {
    s("path", { d: "M -50 -50 Q -54 -96 0 -98 Q 54 -96 50 -50 L 56 30 Q 0 40 -56 30 Z", fill: p.hairColor }, hb);
    for (let k = -3; k <= 3; k++) if (Math.abs(k) > 1) s("rect", { x: k * 15 - 4, y: -20, width: 9, height: 70, rx: 4.5, fill: shade(p.hairColor, 0.08) }, hb);
  }
  if (p.hair === "bun") s("circle", { cx: 0, cy: -100, r: 22, fill: p.hairColor }, hb);
  s("rect", { x: -11, y: -14, width: 22, height: 20, fill: skinD }, head); // neck
  for (const d of [-1, 1]) s("circle", { cx: d * 45, cy: -44, r: 10, fill: d < 0 ? p.skin : skinD }, head);
  s("circle", { cx: 0, cy: -46, r: 47, fill: p.skin }, head);
  s("path", { d: "M 18 -90 Q 50 -80 47 -44 Q 46 -6 8 2 Q 36 -22 34 -50 Q 32 -74 18 -90 Z", fill: skinD, opacity: 0.55 }, head);
  const hf = s("g", {}, head); // hair in front
  const capFor = {
    short: "M -49 -48 C -54 -114 54 -114 49 -48 C 42 -66 24 -76 0 -76 C -24 -76 -42 -66 -49 -48 Z",
    fade: "M -48 -54 C -52 -112 52 -112 48 -54 C 40 -70 22 -78 0 -78 C -22 -78 -40 -70 -48 -54 Z",
    afro: "M -48 -54 C -46 -104 46 -104 48 -54 C 34 -72 -34 -72 -48 -54 Z",
    braids: "M -49 -48 C -54 -114 54 -114 49 -48 C 42 -70 12 -80 0 -72 C -12 -80 -42 -70 -49 -48 Z",
    bun: "M -49 -48 C -54 -114 54 -114 49 -48 C 42 -68 24 -78 0 -78 C -24 -78 -42 -68 -49 -48 Z",
  };
  if (p.hair === "wrap") {
    const wf = typeof p.wrap === "number" ? kentePattern(p.wrap, 36) : p.wrap;
    s("path", { d: "M -52 -46 C -66 -120 66 -122 52 -46 C 34 -72 -34 -72 -52 -46 Z", fill: wf }, hf);
    s("path", { d: "M -10 -104 C -40 -138 30 -146 18 -104 Q 4 -96 -10 -104 Z", fill: wf }, hf);
    s("path", { d: "M -52 -46 C -66 -120 66 -122 52 -46", fill: "none", stroke: "rgba(0,0,0,.18)", "stroke-width": 3 }, hf);
  } else if (capFor[p.hair]) s("path", { d: capFor[p.hair], fill: p.hairColor }, hf);
  if (p.beard) s("path", { d: "M -38 -40 Q -36 6 0 8 Q 36 6 38 -40 Q 30 -14 0 -12 Q -30 -14 -38 -40 Z", fill: p.hairColor, opacity: 0.92 }, head);
  // face
  const eyes = [-1, 1].map((d) => {
    const g = s("g", { transform: `translate(${d * 17} -48)` }, head);
    const e = s("ellipse", { cx: 0, cy: 0, rx: 5.6, ry: 7.2, fill: C.ink }, g);
    const hl = s("circle", { cx: -1.6, cy: -2.6, r: 1.9, fill: "#fff" }, g);
    s("path", { d: `M -8 -15 Q 0 ${-19} 8 -15`, fill: "none", stroke: shade(p.hairColor, 0.05), "stroke-width": 3.5, "stroke-linecap": "round" }, g);
    return { e, hl };
  });
  s("path", { d: "M -3 -34 Q 0 -30 4 -34", fill: "none", stroke: skinD, "stroke-width": 3, "stroke-linecap": "round" }, head);
  for (const d of [-1, 1]) s("circle", { cx: d * 28, cy: -30, r: 7, fill: "#ff7d6b", opacity: 0.22 }, head);
  const mouthOpen = s("g", {}, head);
  s("path", { d: "M -15 -24 Q 0 -4 15 -24 Q 0 -18 -15 -24 Z", fill: "#5a1512" }, mouthOpen);
  s("path", { d: "M -12 -23 Q 0 -20 12 -23 L 11 -20.5 Q 0 -18 -11 -20.5 Z", fill: "#fff" }, mouthOpen);
  const mouthO = s("ellipse", { cx: 0, cy: -19, rx: 7, ry: 9, fill: "#5a1512" }, head);
  const mouthSmile = s("path", { d: "M -12 -22 Q 0 -12 12 -22", fill: "none", stroke: "#5a1512", "stroke-width": 3.5, "stroke-linecap": "round" }, head);
  if (p.glasses) {
    const gl = s("g", { fill: "none", stroke: C.ink, "stroke-width": 3 }, head);
    s("circle", { cx: -17, cy: -48, r: 12 }, gl); s("circle", { cx: 17, cy: -48, r: 12 }, gl); s("path", { d: "M -5 -50 Q 0 -54 5 -50" }, gl);
  }

  const rnd = rng(p.seed * 97);
  const blinkAt = Array.from({ length: 6 }, () => 0.8 + rnd() * 15);

  return {
    root, p, arms, slot: (side) => arms[side === "left" ? 0 : 1].slot,
    // draw this frame: x, y = feet; sc = size; pose = output of a pose function
    draw(x, y, sc, pose, t) {
      tf(root, x + (pose.dx || 0) * sc, y, 0, sc * (pose.flip ? -1 : 1), sc);
      set(shadow, { rx: 50 - (pose.lift || 0) * 0.15, opacity: 1 - (pose.lift || 0) / 140 });
      body.setAttribute("transform", `translate(0 ${(-(pose.lift || 0) + (pose.bounce || 0)).toFixed(2)}) rotate(${(pose.tilt || 0).toFixed(2)} 0 -140)`);
      legs[0].setAttribute("transform", `translate(-17 -146) rotate(${(pose.lLeg || 0).toFixed(2)})`);
      legs[1].setAttribute("transform", `translate(17 -146) rotate(${(pose.rLeg || 0).toFixed(2)})`);
      const [la, lb] = pose.lArm || [12, 10], [ra, rb] = pose.rArm || [12, 10];
      arms[0].upper.setAttribute("transform", `rotate(${la.toFixed(2)})`);
      arms[0].fore.setAttribute("transform", `translate(0 52) rotate(${(-lb).toFixed(2)})`);
      arms[1].upper.setAttribute("transform", `rotate(${ra.toFixed(2)})`);
      arms[1].fore.setAttribute("transform", `translate(0 52) rotate(${(-rb).toFixed(2)})`);
      head.setAttribute("transform", `translate(0 -252) rotate(${(pose.head || 0).toFixed(2)} 0 -10)`);
      const blink = blinkAt.some((b) => t > b && t < b + 0.12) || pose.eyes === "closed";
      eyes.forEach(({ e, hl }) => { e.setAttribute("ry", blink ? 1.2 : 7.2); hl.style.display = blink ? "none" : ""; });
      const m = pose.mouth || "open";
      mouthOpen.style.display = m === "open" ? "" : "none";
      mouthO.style.display = m === "o" ? "" : "none";
      mouthSmile.style.display = m === "smile" ? "" : "none";
    },
  };
}

/* ---------- poses: functions of time (seconds), synced to the beat ---------- */
const POSE = {
  groove(t, ph = 0) { // knees dip on the beat, shoulders rock, fists pump
    const { k, b } = beatOf(t + ph * BEAT); const side = k % 2 ? 1 : -1;
    const dip = Math.pow(1 - b, 2.2) * 12;
    return { bounce: dip, tilt: side * 4 * Math.sin(Math.PI * b), head: side * 6 * Math.sin(Math.PI * b), dx: side * 6 * Math.sin(Math.PI * b),
      lArm: [28 + 18 * Math.sin(2 * Math.PI * b), 85], rArm: [28 - 18 * Math.sin(2 * Math.PI * b), 85], lLeg: side * 4 * b, rLeg: side * 4 * b, mouth: "open" };
  },
  handsUp(t, ph = 0) { // worship: hands raised, swaying over two beats
    const x = (t + ph * BEAT) / (2 * BEAT); const sw = Math.sin(2 * Math.PI * x); const { b } = beatOf(t + ph * BEAT);
    return { bounce: Math.pow(1 - b, 2) * 5, tilt: sw * 5, head: -8 + sw * 4, dx: sw * 8, lArm: [158 + sw * 8, 12], rArm: [158 - sw * 8, 12], mouth: "o", eyes: "closed" };
  },
  jump(t, ph = 0) { // jumps on every other beat, arms flung up
    const x = (t + ph * BEAT) / (2 * BEAT); const f = x - Math.floor(x);
    const lift = Math.max(0, Math.sin(Math.PI * f)) * 70;
    return { lift, lArm: [140 + lift * 0.3, 20], rArm: [140 + lift * 0.3, 20], lLeg: -lift * 0.12, rLeg: lift * 0.12, mouth: "open" };
  },
  clap(t, ph = 0) { // claps on 2 and 4
    const { k, b } = beatOf(t + ph * BEAT); const onClap = k % 2 === 1;
    const c = onClap ? Math.exp(-b * 6) : 0;
    const open = 1 - c;
    return { bounce: Math.pow(1 - b, 2.2) * 9, head: (k % 2 ? 1 : -1) * 4, lArm: [30 + 22 * open, 105 - 30 * open], rArm: [30 + 22 * open, 105 - 30 * open], mouth: "open" };
  },
  wave(t, ph = 0, side = "right") {
    const w = Math.sin(2 * Math.PI * (t + ph * BEAT) / BEAT * 1);
    const g = POSE.groove(t, ph);
    const arm = [150, 25 + 25 * w];
    return { ...g, lArm: side === "left" ? arm : g.lArm, rArm: side === "right" ? arm : g.rArm, mouth: "open" };
  },
  pray(t, ph = 0) {
    const sw = Math.sin(2 * Math.PI * (t + ph * BEAT) / (4 * BEAT));
    return { tilt: sw * 2, head: 10 + sw * 2, lArm: [18, 128], rArm: [18, 128], eyes: "closed", mouth: "smile", bounce: 0 };
  },
  hold(t, ph = 0, side = "right") { // holding a prop at the chest (book, mic), bobbing
    const g = POSE.groove(t, ph);
    const arm = [22, 112];
    return { ...g, lArm: side === "left" ? arm : g.lArm, rArm: side === "right" ? arm : [18, 30], mouth: "open" };
  },
  sing(t, ph = 0) { // mic to the mouth, other hand raised
    const { b } = beatOf(t + ph * BEAT); const sw = Math.sin(2 * Math.PI * (t + ph * BEAT) / (2 * BEAT));
    return { bounce: Math.pow(1 - b, 2) * 6, tilt: sw * 3, head: -4 + sw * 3, lArm: [130 + sw * 10, 30], rArm: [26, 140], mouth: "o" };
  },
  point(t, ph = 0) {
    const g = POSE.groove(t, ph);
    return { ...g, rArm: [92 + 4 * Math.sin(2 * Math.PI * t / BEAT), 4], lArm: [16, 20], mouth: "open" };
  },
  step(t, ph = 0) { // strut: side step on each beat
    const { k, b } = beatOf(t + ph * BEAT); const side = k % 2 ? 1 : -1;
    const e = ease.inOut(b);
    return { dx: side * lerp(-14, 14, e), bounce: Math.pow(1 - b, 2) * 8, tilt: side * 3, lLeg: side * 10 * Math.sin(Math.PI * b), rLeg: -side * 10 * Math.sin(Math.PI * b),
      lArm: [14 + side * 12, 30], rArm: [14 - side * 12, 30], head: side * 4, mouth: "smile" };
  },
  freeze() { return { lArm: [165, 10], rArm: [165, 10], mouth: "open", bounce: 0, lift: 30 }; },
};

/* ---------- props, drawn at the hand ---------- */
const PROP = {
  mic(g) { s("rect", { x: -5, y: -34, width: 10, height: 40, rx: 4, fill: "#2a2a2a" }, g); s("circle", { cx: 0, cy: -40, r: 11, fill: "#3b3b3b" }, g); s("rect", { x: -7, y: -32, width: 14, height: 4, fill: C.gold }, g); },
  book(g, color = "#6b1d1a") { s("rect", { x: -30, y: -46, width: 60, height: 44, rx: 4, fill: color }, g); s("rect", { x: -26, y: -42, width: 52, height: 36, rx: 2, fill: shade(color, 0.12) }, g); s("path", { d: "M -2 -36 h4 v8 h7 v4 h-7 v14 h-4 v-14 h-7 v-4 h7 Z", fill: C.gold }, g); },
  open_book(g) { s("path", { d: "M -40 -20 Q -20 -32 0 -24 Q 20 -32 40 -20 L 40 4 Q 20 -8 0 0 Q -20 -8 -40 4 Z", fill: "#fff" }, g); s("path", { d: "M 0 -24 L 0 0", stroke: "#cfc6b4", "stroke-width": 2 }, g); },
  phone(g) { s("rect", { x: -11, y: -34, width: 22, height: 38, rx: 4, fill: "#1e1e1e" }, g); s("rect", { x: -8, y: -30, width: 16, height: 28, rx: 2, fill: C.goldLight }, g); },
  candle(g) { s("rect", { x: -7, y: -40, width: 14, height: 36, rx: 3, fill: "#fff4dc" }, g); const f = s("path", { d: "M 0 -62 Q 9 -48 0 -40 Q -9 -48 0 -62 Z", fill: "#ffb020" }, g); s("circle", { cx: 0, cy: -50, r: 26, fill: "url(#glow)" }, g); return f; },
  briefcase(g) { s("rect", { x: -26, y: 0, width: 52, height: 38, rx: 5, fill: "#6b4423" }, g); s("rect", { x: -10, y: -8, width: 20, height: 10, rx: 4, fill: "none", stroke: "#4a2e17", "stroke-width": 4 }, g); s("rect", { x: -26, y: 14, width: 52, height: 4, fill: "#4a2e17" }, g); },
  torch(g) { s("rect", { x: -9, y: -30, width: 18, height: 34, rx: 4, fill: "#1e1e1e" }, g); s("circle", { cx: 0, cy: -42, r: 34, fill: "url(#glow)" }, g); s("circle", { cx: 0, cy: -32, r: 5, fill: "#fff" }, g); },
};
