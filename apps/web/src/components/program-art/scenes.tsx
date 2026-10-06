import * as React from "react";
import { C, Chair, Person, Ribbon, SKIN, StageDisc, Stars, Svg } from "./kit";

/* 1 · Gathering of the Adelphos — Saturday afternoon fellowship in a circle */
export function AdelphosScene() {
  const id = "adel";
  return (
    <Svg title="Cartoon: students sitting in a circle on a Saturday afternoon, sharing and studying the Bible together">
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a7ffb" /><stop offset="1" stopColor="#1766ec" /></linearGradient>
        <linearGradient id={`${id}-win`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe6ff" /><stop offset="1" stopColor="#ffe2b8" /></linearGradient>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${id}-wall)`} />
      <Ribbon d="M-20 70 C 120 20, 220 120, 360 60 S 560 10, 680 70" />
      {/* window with afternoon sun */}
      <rect x="392" y="34" width="190" height="122" rx="14" fill={`url(#${id}-win)`} filter="url(#pa-drop)" />
      <circle cx="532" cy="112" r="20" fill="#ffc46e" />
      <path d="M487 34 V156 M392 95 H582" stroke="#fff" strokeWidth="6" />
      <rect x="392" y="34" width="190" height="122" rx="14" fill="none" stroke="#fff" strokeWidth="6" />
      <polygon points="400,156 575,156 470,330 250,330" fill={`url(#${id}-beam)`} />
      {/* floor + rug */}
      <rect y="250" width="640" height="110" fill="#0f4fd8" /><rect y="250" width="640" height="6" fill="#fff" opacity=".08" />
      <StageDisc id={`${id}-rug`} cx={320} cy={300} rx={250} ry={46} depth={6} />
      {/* plant */}
      <g transform="translate(58 250)" filter="url(#pa-drop)"><path d="M-14 0 h28 l-4 28 h-20z" fill={C.orange} /><path d="M0 0 C -24 -30, -10 -60, 0 -66 C 10 -60, 24 -30, 0 0" fill={C.green} /><path d="M0 0 C -30 -14, -34 -36, -26 -44 M0 0 C 30 -14, 34 -36, 26 -44" stroke={C.greenDark} strokeWidth="9" strokeLinecap="round" fill="none" /></g>
      {/* back row, seated */}
      <Chair x={196} y={262} s={0.9} />
      <Person x={196} y={262} s={0.9} skin={SKIN.d} hair="braids" top={C.white} bottom={C.denim} pose="book" lower="sit" eyes="happy" />
      <Chair x={306} y={258} s={0.9} />
      <Person x={306} y={258} s={0.9} skin={SKIN.c} hair="fade" top={C.navy} bottom="#22305c" pose="wave" lower="sit" mouth="open" />
      <Chair x={416} y={262} s={0.9} />
      <Person x={416} y={262} s={0.9} skin={SKIN.b} hair="puff" top="#ff9a3c" bottom={C.denim} pose="book" lower="sit" />
      {/* front row */}
      <Chair x={110} y={330} s={1.05} />
      <Person x={110} y={330} s={1.05} skin={SKIN.e} hair="short" top={C.royal} bottom="#1b2a55" pose="praise" lower="sit" eyes="happy" mouth="open" />
      <Chair x={540} y={330} s={1.05} />
      <Person x={540} y={330} s={1.05} flip skin={SKIN.a} hair="afro" top={C.white} bottom={C.denim} pose="book" lower="sit" eyes="happy" />
      {/* open Bible on the rug */}
      <g transform="translate(322 314)" filter="url(#pa-drop)"><path d="M-26 -6 L0 2 L26 -6 L26 8 L0 16 L-26 8 Z" fill="#fff" /><path d="M0 2 V16" stroke="#0a2a7a55" /><rect x="-2" y="2" width="4" height="16" fill={C.ember} opacity=".7" /></g>
      {/* speech bubbles */}
      <g transform="translate(332 112)" filter="url(#pa-drop)"><rect x="-6" y="-26" width="52" height="34" rx="14" fill="#fff" /><path d="M2 6 l-8 12 l16 -10z" fill="#fff" /><path d="M20 -3 c-4 -6 -14 -2 -8 6 l8 7 l8 -7 c6 -8 -4 -12 -8 -6z" fill={C.ember} /></g>
      <g transform="translate(150 182)" filter="url(#pa-drop)"><rect x="-22" y="-20" width="44" height="26" rx="12" fill="#fff" opacity=".95" /><circle cx="-10" cy="-7" r="3" fill={C.royal} /><circle cx="0" cy="-7" r="3" fill={C.royal} /><circle cx="10" cy="-7" r="3" fill={C.royal} /></g>
    </Svg>
  );
}

/* 2 · Night of Solemnities — monthly all-night prayer */
export function SolemnitiesScene() {
  const id = "nos";
  const stars: [number, number][] = [[40, 30], [90, 70], [150, 24], [210, 58], [260, 22], [330, 44], [380, 18], [430, 66], [470, 30], [600, 28], [620, 90], [30, 110], [120, 120], [580, 140], [250, 100], [350, 112]];
  return (
    <Svg title="Cartoon: students praying through the night, kneeling and lifting their hands, with a preacher on a stage under the moon">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#061c63" /><stop offset=".65" stopColor="#0a3cc4" /><stop offset="1" stopColor="#1766ec" /></linearGradient>
        <radialGradient id={`${id}-moon`}><stop offset="0" stopColor="#fff6dc" stopOpacity=".55" /><stop offset="1" stopColor="#fff6dc" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${id}-candle`}><stop offset="0" stopColor="#ffd36b" stopOpacity=".7" /><stop offset="1" stopColor="#ffd36b" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${id}-sky)`} />
      <Stars points={stars} />
      <circle cx="540" cy="66" r="58" fill={`url(#${id}-moon)`} />
      <circle cx="540" cy="66" r="26" fill="#fff3cf" />
      <circle cx="550" cy="58" r="5" fill="#f4e2ad" /><circle cx="532" cy="74" r="3.5" fill="#f4e2ad" />
      {/* clock: past midnight */}
      <g transform="translate(330 70)" filter="url(#pa-drop)"><circle r="22" fill="#fff" /><circle r="22" fill="none" stroke={C.peach} strokeWidth="4" /><path d="M0 0 V-14 M0 0 L9 5" stroke={C.navy} strokeWidth="3" strokeLinecap="round" /><circle r="2.5" fill={C.ember} /></g>
      <Ribbon d="M-30 180 C 120 130, 240 210, 400 160 S 600 120, 690 170" color={C.glow} opacity={0.18} />
      <rect y="262" width="640" height="98" fill="#0a3cc4" /><ellipse cx="420" cy="300" rx="260" ry="30" fill="#5aa2fb" opacity=".12" />
      {/* preacher on the stage */}
      <StageDisc id={`${id}-stage`} cx={130} cy={276} rx={104} ry={22} />
      <Person x={130} y={278} s={1.05} skin={SKIN.c} hair="short" top={C.maroon} bottom="#2a1418" shoes="#111" pose="micup" mouth="open" collar="#111" />
      {/* congregation */}
      <Person x={290} y={300} skin={SKIN.d} hair="braids" top={C.white} bottom={C.denim} pose="clasp" lower="kneel" eyes="closed" mouth="flat" />
      <Person x={385} y={292} s={0.95} skin={SKIN.a} hair="fade" top={C.royal} bottom="#1b2a55" pose="raised" lower="kneel" eyes="closed" />
      <Person x={470} y={290} s={0.95} skin={SKIN.e} hair="afro" top={C.white} bottom={C.denim} pose="raised" eyes="closed" />
      <Person x={560} y={296} skin={SKIN.b} hair="short" top={C.navy} bottom={C.denim} pose="praise" eyes="closed" mouth="open" />
      <Person x={410} y={352} s={1.15} skin={SKIN.c} hair="puff" top="#ff9a3c" bottom={C.denim} pose="book" lower="kneel" eyes="closed" mouth="flat" />
      {/* candles */}
      {[[250, 330], [520, 340], [600, 345]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}><circle cy="-22" r="18" fill={`url(#${id}-candle)`} /><rect x="-4" y="-14" width="8" height="14" rx="2" fill="#fff" /><path d="M0 -26 q5 6 0 10 q-5 -4 0 -10z" fill={C.yellow} /></g>
      ))}
    </Svg>
  );
}

/* 3 · Academic Excellence Retreat — studying and praying over books outdoors */
export function AcademicScene() {
  const id = "acad";
  return (
    <Svg title="Cartoon: students at a retreat table outdoors with books and a laptop, one praying over the books, with a lightbulb above">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5aa2fb" /><stop offset="1" stopColor="#bfe6ff" /></linearGradient>
        <radialGradient id={`${id}-leaf`} cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#5fe09a" /><stop offset="0.6" stopColor={C.green} /><stop offset="1" stopColor={C.greenDark} /></radialGradient>
        <linearGradient id={`${id}-tableTop`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dbe5fb" /></linearGradient>
        <linearGradient id={`${id}-tableFront`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#f3f7ff" /><stop offset="1" stopColor="#c9d6f3" /></linearGradient>
        <radialGradient id={`${id}-bulb`}><stop offset="0" stopColor="#ffe9a8" stopOpacity=".9" /><stop offset="1" stopColor="#ffe9a8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${id}-sky)`} />
      {[[120, 70, 1], [470, 110, 0.8]].map(([x, y, k], i) => <g key={i} transform={`translate(${x} ${y}) scale(${k})`} fill="#fff" opacity=".9"><circle cx="-22" cy="4" r="16" /><circle cx="0" cy="-6" r="22" /><circle cx="24" cy="4" r="16" /><rect x="-38" y="4" width="78" height="16" rx="8" /></g>)}
      <path d="M0 230 C 120 190, 220 210, 330 200 S 540 180, 640 210 V360 H0Z" fill="#2a7ffb" opacity=".55" />
      <path d="M0 262 C 160 240, 300 258, 420 246 S 580 236, 640 250 V360 H0Z" fill="#1766ec" />
      {/* trees */}
      {[[60, 250, 1.1], [600, 248, 1], [150, 236, 0.75]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`} filter="url(#pa-drop)"><rect x="-6" y="-40" width="12" height="44" rx="4" fill="#7a4a28" /><circle cy="-62" r="34" fill={`url(#${id}-leaf)`} /><circle cx="-20" cy="-48" r="22" fill={`url(#${id}-leaf)`} /><circle cx="22" cy="-50" r="24" fill={`url(#${id}-leaf)`} /><circle cx="-10" cy="-78" r="9" fill="#fff" opacity=".22" /></g>
      ))}
      {/* lightbulb idea */}
      <g transform="translate(320 70)"><circle r="46" fill={`url(#${id}-bulb)`} /><circle cy="-4" r="17" fill={C.yellow} /><rect x="-8" y="11" width="16" height="9" rx="2" fill="#c9d4ee" /><path d="M-28 -26 l-9 -8 M28 -26 l9 -8 M0 -32 v-12 M-34 2 h-12 M34 2 h12" stroke={C.yellow} strokeWidth="4" strokeLinecap="round" /></g>
      {/* people behind the table */}
      <Person x={250} y={276} skin={SKIN.a} hair="short" top={C.royal} bottom={C.denim} pose="write" lower="sit" glasses />
      <Person x={330} y={272} skin={SKIN.d} hair="wrap" wrapColor={C.orange} top={C.white} bottom={C.denim} pose="clasp" lower="sit" eyes="closed" mouth="flat" />
      <Person x={410} y={276} skin={SKIN.c} hair="fade" top={C.navy} bottom={C.denim} pose="book" lower="sit" eyes="happy" />
      <Person x={548} y={322} s={1.05} flip skin={SKIN.b} hair="braids" top="#ff9a3c" bottom={C.denim} pose="point" />
      {/* table */}
      <g filter="url(#pa-drop)">
        <rect x="160" y="278" width="320" height="58" rx="8" fill={`url(#${id}-tableFront)`} />
        <rect x="160" y="278" width="320" height="10" fill="#b4c3e6" />
        <rect x="150" y="262" width="340" height="16" rx="6" fill={`url(#${id}-tableTop)`} />
        <rect x="158" y="264" width="200" height="3" rx="1.5" fill="#fff" opacity=".9" />
      </g>
      {/* books, laptop, grad cap, mug */}
      <g transform="translate(162 262)" filter="url(#pa-drop)"><rect x="0" y="-12" width="44" height="10" rx="2" fill={C.ember} /><rect x="4" y="-22" width="40" height="10" rx="2" fill={C.royal} /><rect x="2" y="-32" width="42" height="10" rx="2" fill={C.green} /><path d="M2 -44 L24 -52 L46 -44 L24 -36 Z" fill="#111" /><path d="M40 -44 v12" stroke={C.yellow} strokeWidth="2" /><circle cx="40" cy="-31" r="2.5" fill={C.yellow} /></g>
      <g transform="translate(296 262)" filter="url(#pa-drop)"><path d="M-30 0 L-24 -26 H24 L30 0 Z" fill="#c9d4ee" /><rect x="-21" y="-23" width="42" height="20" rx="2" fill={C.royal} /><path d="M-12 -8 l7 -6 l6 4 l10 -8" stroke="#fff" strokeWidth="2" fill="none" /></g>
      <g transform="translate(462 262)" filter="url(#pa-drop)"><rect x="-8" y="-16" width="16" height="16" rx="3" fill="#fff" /><path d="M8 -12 q8 2 0 9" stroke="#fff" strokeWidth="3" fill="none" /></g>
    </Svg>
  );
}

/* 4 · Prophetic Convocation — big worship gathering under light */
export function ConvocationScene() {
  const id = "conv";
  const crowd = [
    { x: 60, hair: "afro" as const, skin: SKIN.a, top: C.white }, { x: 150, hair: "braids" as const, skin: SKIN.d, top: C.royal },
    { x: 240, hair: "short" as const, skin: SKIN.c, top: "#ff9a3c" }, { x: 400, hair: "puff" as const, skin: SKIN.b, top: C.white },
    { x: 490, hair: "fade" as const, skin: SKIN.e, top: C.navy }, { x: 580, hair: "wrap" as const, skin: SKIN.a, top: C.white },
  ];
  return (
    <Svg title="Cartoon: a large worship gathering with hands raised toward a lit stage where a preacher speaks">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#061c63" /><stop offset="1" stopColor="#1766ec" /></linearGradient>
        <linearGradient id={`${id}-ray`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id={`${id}-glow`}><stop offset="0" stopColor="#ffb36b" stopOpacity=".8" /><stop offset="1" stopColor="#fe7711" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${id}-bg)`} />
      {/* light rays */}
      {[-130, -60, 0, 60, 130].map((dx, i) => <polygon key={i} points={`${320 + dx * 0.25 - 14},0 ${320 + dx * 0.25 + 14},0 ${320 + dx * 1.6 + 60},300 ${320 + dx * 1.6 - 60},300`} fill={`url(#${id}-ray)`} opacity={i === 2 ? 0.9 : 0.5} />)}
      <Ribbon d="M-30 120 C 100 70, 200 150, 320 110 S 540 60, 680 120" color={C.glow} opacity={0.15} />
      <circle cx="320" cy="170" r="110" fill={`url(#${id}-glow)`} />
      {/* sparkles */}
      {[[200, 80], [450, 70], [260, 140], [390, 130], [520, 150], [120, 150]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`} fill="#fff" opacity=".85" />)}
      <StageDisc id={`${id}-stage`} cx={320} cy={226} rx={180} ry={30} depth={16} />
      <Person x={320} y={228} s={1.1} skin={SKIN.c} hair="short" top={C.maroon} bottom="#2a1418" shoes="#111" pose="mic" mouth="open" collar="#111" />
      <Person x={240} y={222} s={0.8} skin={SKIN.d} hair="puff" top={C.white} bottom={C.denim} pose="raised" eyes="closed" mouth="open" />
      <Person x={400} y={222} s={0.8} skin={SKIN.a} hair="fade" top={C.royal} bottom={C.denim} pose="praise" eyes="closed" mouth="open" />
      {/* crowd, seen from behind */}
      {crowd.map((p, i) => <Person key={i} x={p.x} y={i % 2 ? 392 : 384} s={1.3} back skin={p.skin} hair={p.hair} top={p.top} bottom={C.denim} pose={i % 3 === 1 ? "praise" : "raised"} />)}
    </Svg>
  );
}

/* 5 · Business Masterclass — workshop with a growth chart */
export function MasterclassScene() {
  const id = "biz";
  return (
    <Svg title="Cartoon: a presenter pointing at a rising chart on a whiteboard while students take notes on laptops">
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a7ffb" /><stop offset="1" stopColor="#1766ec" /></linearGradient>
      </defs>
      <rect width="640" height="360" fill={`url(#${id}-wall)`} />
      <Ribbon d="M-20 300 C 120 250, 260 320, 400 270 S 580 240, 680 290" opacity={0.25} />
      <rect y="268" width="640" height="92" fill="#0f4fd8" /><rect y="268" width="640" height="5" fill="#fff" opacity=".08" />
      {/* whiteboard with rising chart */}
      <g transform="translate(330 40)" filter="url(#pa-drop)">
        <rect width="270" height="160" rx="12" fill="#fff" />
        <rect width="270" height="160" rx="12" fill="none" stroke="#c9d4ee" strokeWidth="6" />
        <path d="M30 130 H245 M30 130 V24" stroke="#c9d4ee" strokeWidth="3" />
        {[[50, 30], [92, 50], [134, 64], [176, 88], [218, 104]].map(([x, h], i) => <g key={i}><rect x={x} y={130 - h} width="26" height={h} rx="4" fill={i % 2 ? C.orange : C.royal} /><rect x={x + 3} y={133 - h} width="6" height={h - 6} rx="3" fill="#fff" opacity=".3" /></g>)}
        <path d="M44 104 L100 84 L148 72 L190 44 L236 22" stroke={C.ember} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M222 18 L240 20 L232 36" stroke={C.ember} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="80" y="160" width="110" height="8" rx="3" fill="#c9d4ee" />
      </g>
      {/* lightbulb + coins */}
      <g transform="translate(286 62)" filter="url(#pa-drop)"><circle cy="-4" r="13" fill={C.yellow} /><rect x="-6" y="8" width="12" height="7" rx="2" fill="#c9d4ee" /><path d="M-22 -18 l-7 -6 M22 -18 l7 -6 M0 -24 v-10" stroke={C.yellow} strokeWidth="3.5" strokeLinecap="round" /></g>
      {/* presenter */}
      <Person x={270} y={300} s={1.1} skin={SKIN.e} hair="bob" top={C.navy} bottom="#1b2a55" shoes="#111" pose="point" skirt mouth="open" collar="#fff" />
      {/* students at desks */}
      <Person x={92} y={298} skin={SKIN.a} hair="short" top={C.white} bottom={C.denim} pose="write" lower="sit" />
      <Person x={168} y={300} skin={SKIN.d} hair="braids" top="#ff9a3c" bottom={C.denim} pose="write" lower="sit" glasses />
      <g filter="url(#pa-drop)">
        <rect x="40" y="284" width="190" height="12" rx="5" fill="#fff" />
        <rect x="52" y="296" width="166" height="44" rx="6" fill={C.ice} />
        <g transform="translate(64 284)"><path d="M-14 0 L-11 -14 H11 L14 0 Z" fill="#c9d4ee" /><rect x="-9" y="-12" width="18" height="10" rx="1.5" fill={C.royal} /></g>
        <g transform="translate(196 284)"><rect x="-14" y="-6" width="28" height="6" rx="1" fill="#fff" stroke="#c9d4ee" /><path d="M-8 -3 h14" stroke={C.royal} strokeWidth="1.5" /></g>
      </g>
      {/* briefcase + plant */}
      <g transform="translate(380 330)" filter="url(#pa-drop)"><rect x="-24" y="-30" width="48" height="32" rx="6" fill={C.wood} /><path d="M-9 -30 v-7 h18 v7" stroke={C.wood} strokeWidth="4" fill="none" /><rect x="-24" y="-18" width="48" height="4" fill="#8a5428" /></g>
      <g transform="translate(600 290)" filter="url(#pa-drop)"><path d="M-14 0 h28 l-4 30 h-20z" fill={C.orange} /><path d="M0 0 C -24 -30, -10 -60, 0 -66 C 10 -60, 24 -30, 0 0" fill={C.green} /><path d="M0 0 C -30 -14, -34 -36, -26 -44 M0 0 C 30 -14, 34 -36, 26 -44" stroke={C.greenDark} strokeWidth="9" strokeLinecap="round" fill="none" /></g>
      <Person x={520} y={330} s={1.05} flip skin={SKIN.c} hair="fade" top={C.white} bottom={C.denim} pose="book" eyes="happy" />
    </Svg>
  );
}

export const SCENES: Record<string, () => React.ReactElement> = {
  "gathering-of-the-adelphos": AdelphosScene,
  "night-of-solemnities": SolemnitiesScene,
  "academic-excellence-retreat": AcademicScene,
  "prophetic-convocation": ConvocationScene,
  "business-masterclass": MasterclassScene,
};
