// The five program ads. Each has three scenes (2–6s, 6–10s, 10–14s) and an end card.
// people: x, y = feet, sc = scale, look = Person options, pose = POSE name, ph = beat phase offset,
// prop/propSide = PROP in the hand, enter = [start, dx] slides them in from the side.
(() => {
  const L = {
    kwame: { skin: SKIN[0], shirt: C.blue, hair: "short", seed: 1 },
    ama: { skin: SKIN[2], shirt: "#ffffff", hair: "braids", dress: true, stole: 31, seed: 2 },
    kojo: { skin: SKIN[3], shirt: C.gold, hair: "afro", pants: C.navy, stole: false, seed: 3 },
    esi: { skin: SKIN[1], shirt: C.red, hair: "wrap", wrap: 47, dress: true, seed: 4 },
    yaw: { skin: SKIN[4], shirt: "#ffffff", jacket: C.ink, hair: "fade", glasses: true, beard: true, seed: 5 },
    efua: { skin: SKIN[5], shirt: C.navy, hair: "bun", sleeve: "long", seed: 6 },
    kofi: { skin: SKIN[2], shirt: "#2f7d4f", hair: "fade", pants: C.ink, stole: 47, seed: 7 },
    abena: { skin: SKIN[0], shirt: C.gold, hair: "afro", dress: true, stole: false, seed: 8 },
    pastor: { skin: SKIN[3], shirt: "#ffffff", jacket: C.navy, hair: "short", beard: true, collar: C.gold, stole: 23, seed: 9 },
    suit1: { skin: SKIN[1], shirt: "#ffffff", jacket: C.navy, hair: "fade", collar: C.red, stole: false, seed: 10 },
    suit2: { skin: SKIN[4], shirt: "#ffffff", jacket: "#3a2a1c", hair: "bun", dress: true, stole: false, seed: 11 },
  };
  const P = (x, y, sc, look, pose, more = {}) => ({ x, y, sc, look: L[look], pose, ...more });

  window.AD = {
    "gathering-of-the-adelphos": {
      seed: 23, name: ["Gathering of", "the Adelphos"], when: "Every Saturday · 2:30pm",
      end: [L.kwame, L.ama, L.esi, L.kojo],
      s1: {
        set: "hall",
        people: [P(1060, 990, 1.1, "kwame", "groove", { ph: 0, enter: [0, -500] }), P(1300, 1010, 1.15, "ama", "clap", { ph: 0.5, enter: [0.25, 500] }),
          P(1540, 990, 1.1, "kojo", "groove", { ph: 0.25, enter: [0.5, 500] }), P(1780, 1010, 1.12, "esi", "wave", { ph: 0.75, side: "right", enter: [0.75, 500] })],
        text: { type: "title", kicker: "Every Saturday", lines: ["Gathering of", "the Adelphos"], x: 110, y: 250, size: 170 },
        front: [["notes"]],
      },
      s2: {
        set: "hall",
        people: [P(380, 1000, 1.25, "yaw", "wave", { side: "left", ph: 0 }), P(700, 1010, 1.25, "efua", "clap", { ph: 0.5 }),
          P(1020, 1000, 1.25, "kofi", "groove", { ph: 0.25 })],
        text: { type: "tag", l1: "Adelphos means brother.", l2: "Come as you are. Leave as family.", x: 1000, y: 210 },
      },
      s3: {
        set: "hall",
        people: [P(260, 1000, 1.0, "esi", "handsUp", { ph: 0 }), P(520, 1020, 1.05, "kojo", "jump", { ph: 0.5 }), P(780, 1000, 1.0, "ama", "handsUp", { ph: 0.25 }),
          P(1060, 1030, 1.08, "kwame", "jump", { ph: 0.75 }), P(1320, 1000, 1.0, "abena", "handsUp", { ph: 0.1 }), P(1580, 1020, 1.05, "yaw", "clap", { ph: 0.6 }), P(1820, 1000, 1.0, "efua", "handsUp", { ph: 0.35 })],
        text: { type: "sched", when: "Saturdays · 2:30pm", small: "KNUST campus · Come as you are", x: 120, y: 120, size: 120 },
        front: [["confetti", 31]],
      },
    },

    "night-of-solemnities": {
      seed: 47, name: ["Night of", "Solemnities"], when: "Monthly · All night",
      end: [L.efua, L.pastor, L.abena, L.kofi],
      s1: {
        set: "night",
        people: [P(1180, 1000, 1.12, "efua", "pray", { enter: [0, 400] }), P(1440, 1010, 1.15, "kofi", "handsUp", { ph: 0.5, enter: [0.25, 400] }), P(1700, 1000, 1.12, "ama", "pray", { enter: [0.5, 400] })],
        extras: [["clock", [1040, 330]]],
        text: { type: "title", kicker: "When the campus sleeps", lines: ["Night of", "Solemnities"], x: 110, y: 260, size: 170, dark: true },
      },
      s2: {
        set: "vigil",
        people: [P(960, 1010, 1.3, "pastor", "sing", { prop: "mic" }), P(420, 1000, 1.15, "abena", "hold", { prop: "candle" }), P(1500, 1000, 1.15, "kwame", "hold", { prop: "candle" }),
          P(200, 1030, 1.2, "esi", "handsUp", { ph: 0.5 }), P(1720, 1030, 1.2, "kojo", "handsUp", { ph: 0.25 })],
        text: { type: "tag", l1: "We pray through the night.", l2: "Worship, intercession and the Word.", x: 120, y: 120 },
      },
      s3: {
        set: "night", setOpts: { dawn: true },
        people: [P(300, 1000, 1.05, "kofi", "jump", { ph: 0 }), P(620, 1020, 1.08, "efua", "handsUp", { ph: 0.5 }), P(1300, 1020, 1.08, "abena", "jump", { ph: 0.25 }), P(1620, 1000, 1.05, "yaw", "handsUp", { ph: 0.75 })],
        text: { type: "sched", when: "Monthly · All night", small: "with Dr. Godfred Bonnah Nkansah", x: 120, y: 120, size: 120, dark: true },
        front: [["confetti", 47]],
      },
    },

    "academic-excellence-retreat": {
      seed: 59, name: ["Academic", "Excellence Retreat"], when: "Once each semester",
      end: [L.kojo, L.efua, L.yaw, L.ama],
      s1: {
        set: "classroom",
        people: [P(1060, 1000, 1.15, "efua", "hold", { prop: "open_book", enter: [0, 500] }), P(1400, 1010, 1.15, "kojo", "point", { side: "left", enter: [0.25, 500] }), P(1720, 1000, 1.12, "ama", "hold", { prop: "book", enter: [0.5, 500] })],
        extras: [["bulbs", [[1060, 470], [1720, 470]]]],
        text: { type: "title", kicker: "Study well. Pray well.", lines: ["Academic", "Excellence", "Retreat"], x: 120, y: 620, size: 130 },
      },
      s2: {
        set: "classroom",
        people: [P(260, 1000, 1.25, "kwame", "pray"), P(560, 1010, 1.25, "abena", "pray"), P(1780, 1000, 1.25, "yaw", "point", { side: "left", prop: "book", propSide: "right" })],
        text: { type: "tag", l1: "Pray over your studies.", l2: "Learn to study well, and do well.", x: 860, y: 620 },
      },
      s3: {
        set: "classroom",
        people: [P(260, 1000, 1.0, "ama", "jump", { ph: 0 }), P(560, 1020, 1.05, "kojo", "handsUp", { ph: 0.5 }), P(1360, 1020, 1.05, "efua", "jump", { ph: 0.25 }), P(1660, 1000, 1.0, "kofi", "handsUp", { ph: 0.75 })],
        extras: [["caps"]],
        text: { type: "sched", when: "Every semester", small: "For every student who wants to excel", x: 560, y: 150, size: 120 },
        front: [["confetti", 59]],
      },
    },

    "prophetic-convocation": {
      seed: 33, name: ["Prophetic", "Convocation"], when: "Once each semester",
      end: [L.pastor, L.esi, L.kwame, L.abena],
      s1: {
        set: "stage",
        people: [P(960, 990, 1.3, "pastor", "sing", { prop: "mic" }), P(1400, 1010, 1.1, "esi", "handsUp", { ph: 0.5, enter: [0.25, 400] })],
        text: { type: "title", kicker: "A word for the season", lines: ["Prophetic", "Convocation"], x: 480, y: 200, size: 170, dark: true },
        front: [["notes"]],
      },
      s2: {
        set: "stage",
        people: [P(560, 1000, 1.15, "kwame", "handsUp", { ph: 0 }), P(800, 1020, 1.18, "abena", "handsUp", { ph: 0.5 }), P(1120, 1020, 1.18, "kofi", "pray"), P(1360, 1000, 1.15, "ama", "handsUp", { ph: 0.25 })],
        text: { type: "tag", l1: "Worship. The Word. Prayer.", l2: "Get ready for the season ahead.", x: 480, y: 130 },
      },
      s3: {
        set: "stage",
        people: [P(560, 1000, 1.08, "esi", "jump", { ph: 0 }), P(840, 1020, 1.1, "yaw", "handsUp", { ph: 0.5 }), P(1100, 1020, 1.1, "efua", "jump", { ph: 0.25 }), P(1380, 1000, 1.08, "kojo", "handsUp", { ph: 0.75 })],
        extras: [["pages"]],
        text: { type: "sched", when: "Every semester", small: "Hear what God is saying", x: 480, y: 120, size: 120, dark: true },
      },
    },

    "business-masterclass": {
      seed: 71, name: ["Business", "Masterclass"], when: "Once each year",
      end: [L.suit1, L.suit2, L.yaw, L.esi],
      s1: {
        set: "skyline",
        people: [P(1100, 1000, 1.12, "suit1", "step", { prop: "briefcase", ph: 0, enter: [0, -600] }), P(1380, 1010, 1.12, "suit2", "step", { prop: "phone", ph: 0.5, enter: [0.2, 600] }), P(1660, 1000, 1.12, "yaw", "step", { prop: "briefcase", ph: 0.25, enter: [0.4, 600] })],
        text: { type: "title", kicker: "Faith at work", lines: ["Business", "Masterclass"], x: 110, y: 250, size: 180 },
      },
      s2: {
        set: "boardroom",
        people: [P(560, 1010, 1.25, "suit2", "point", { side: "right" }), P(300, 1000, 1.2, "kofi", "hold", { prop: "phone" })],
        text: { type: "tag", l1: "Start. Build. Grow.", l2: "Serve God in the marketplace.", x: 840, y: 730 },
      },
      s3: {
        set: "market",
        people: [P(300, 1000, 1.05, "esi", "groove", { ph: 0 }), P(560, 1020, 1.08, "suit1", "jump", { ph: 0.5 }), P(1380, 1020, 1.08, "abena", "groove", { ph: 0.25 }), P(1640, 1000, 1.05, "kojo", "jump", { ph: 0.75 })],
        extras: [["coins"]],
        front: [["bubbles", [[1420, 280, "Start"], [1420, 400, "Build"], [1420, 520, "Grow"]]]],
        text: { type: "sched", when: "Once a year", small: "Equipping emissaries for the marketplace", x: 120, y: 60, size: 110 },
      },
    },
  };
})();
