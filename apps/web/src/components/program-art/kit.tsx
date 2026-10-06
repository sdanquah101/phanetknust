/**
 * Cartoon kit for program illustrations: hand-built SVG, no generated images.
 * Every scene uses a 640×360 viewBox. A person's origin is the point between their feet;
 * standing height is about 110 units at scale 1.
 */
import * as React from "react";

export const SKIN = { a: "#8d5524", b: "#a0662f", c: "#6b3e1f", d: "#c68642", e: "#7a4a28" } as const;
export const HAIR = "#1c1410";
export const C = {
  royal: "#1766ec", deep: "#0a46e8", navy: "#0a2a7a", sky: "#5aa2fb", ice: "#eaf1ff", glow: "#b7e2ff",
  orange: "#fe7711", ember: "#de2700", peach: "#ffcf94", white: "#ffffff", denim: "#2b4c8c", maroon: "#7a2335",
  yellow: "#ffd36b", green: "#2fbf71", greenDark: "#1f9d5a", wood: "#b9773f",
} as const;

export type Pose = "down" | "raised" | "praise" | "book" | "mic" | "micup" | "clasp" | "point" | "wave" | "write" | "lap";
export type Lower = "stand" | "kneel" | "sit";
export type HairStyle = "short" | "fade" | "afro" | "puff" | "braids" | "wrap" | "bob";

type Pt = [number, number];
const SH_L: Pt = [-12, -64];
const SH_R: Pt = [12, -64];

// [elbow, hand] for left and right arms; right is the person's left on screen (we draw facing the viewer)
const ARMS: Record<Pose, { l: [Pt, Pt]; r: [Pt, Pt] }> = {
  down: { l: [[-16, -52], [-17, -40]], r: [[16, -52], [17, -40]] },
  raised: { l: [[-22, -80], [-27, -98]], r: [[22, -80], [27, -98]] },
  praise: { l: [[-22, -80], [-27, -98]], r: [[16, -52], [17, -40]] },
  book: { l: [[-17, -52], [-8, -48]], r: [[17, -52], [8, -48]] },
  mic: { l: [[-16, -52], [-17, -40]], r: [[20, -56], [9, -66]] },
  micup: { l: [[-22, -80], [-28, -97]], r: [[20, -56], [9, -66]] },
  clasp: { l: [[-16, -53], [-2, -60]], r: [[16, -53], [2, -60]] },
  point: { l: [[-16, -52], [-17, -40]], r: [[27, -70], [42, -80]] },
  wave: { l: [[-16, -52], [-17, -40]], r: [[24, -74], [22, -94]] },
  write: { l: [[-12, -50], [6, -46]], r: [[18, -50], [24, -46]] },
  lap: { l: [[-17, -50], [-6, -40]], r: [[17, -50], [6, -40]] },
};

const path = (a: Pt, b: Pt, c: Pt) => `M${a[0]} ${a[1]} Q${b[0]} ${b[1]} ${c[0]} ${c[1]}`;

export type PersonProps = {
  x: number; y: number; s?: number; flip?: boolean;
  skin?: string; hair?: HairStyle; hairColor?: string; wrapColor?: string;
  top?: string; bottom?: string; shoes?: string; skirt?: boolean;
  pose?: Pose; lower?: Lower; eyes?: "open" | "closed" | "happy"; mouth?: "smile" | "open" | "flat";
  glasses?: boolean; back?: boolean; collar?: string;
};

export function Person({
  x, y, s = 1, flip = false, skin = SKIN.a, hair = "short", hairColor = HAIR, wrapColor = C.orange,
  top = C.royal, bottom = C.denim, shoes = C.white, skirt = false, pose = "down", lower = "stand",
  eyes = "open", mouth = "smile", glasses = false, back = false, collar,
}: PersonProps) {
  const dy = lower === "kneel" ? 18 : lower === "sit" ? 20 : 0;
  const hip = -38 + dy;
  const arms = ARMS[pose];
  const legW = 9;
  // legs
  let legs: React.ReactNode;
  if (lower === "stand") {
    legs = (
      <>
        <path d={`M-6 ${hip} L-7 -3`} stroke={skirt ? skin : bottom} strokeWidth={legW} strokeLinecap="round" />
        <path d={`M6 ${hip} L7 -3`} stroke={skirt ? skin : bottom} strokeWidth={legW} strokeLinecap="round" />
        <ellipse cx={-9} cy={-1} rx={7} ry={3.5} fill={shoes} stroke="#00000022" />
        <ellipse cx={9} cy={-1} rx={7} ry={3.5} fill={shoes} stroke="#00000022" />
      </>
    );
  } else if (lower === "kneel") {
    legs = (
      <>
        <path d={`M-6 ${hip} L-4 -4 L-22 -3`} stroke={bottom} strokeWidth={legW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={`M6 ${hip} L8 -4 L-10 -3`} stroke={bottom} strokeWidth={legW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx={-25} cy={-2} rx={5} ry={3} fill={shoes} />
      </>
    );
  } else {
    legs = (
      <>
        <path d={`M-6 ${hip} L10 ${hip} L10 -3`} stroke={bottom} strokeWidth={legW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={`M6 ${hip} L22 ${hip} L22 -3`} stroke={bottom} strokeWidth={legW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx={13} cy={-1} rx={6.5} ry={3.2} fill={shoes} />
        <ellipse cx={25} cy={-1} rx={6.5} ry={3.2} fill={shoes} />
      </>
    );
  }

  const hairBack = (() => {
    switch (hair) {
      case "afro": return <circle cx={0} cy={-90} r={23} fill={hairColor} />;
      case "puff": return <><ellipse cx={0} cy={-90} rx={16} ry={13} fill={hairColor} /><circle cx={0} cy={-106} r={9} fill={hairColor} /></>;
      case "braids": return <><ellipse cx={0} cy={-90} rx={16.5} ry={13.5} fill={hairColor} /><rect x={-20} y={-92} width={8} height={40} rx={4} fill={hairColor} /><rect x={12} y={-92} width={8} height={40} rx={4} fill={hairColor} /></>;
      case "bob": return <><ellipse cx={0} cy={-90} rx={17} ry={14} fill={hairColor} /><rect x={-18} y={-90} width={36} height={16} rx={7} fill={hairColor} /></>;
      case "wrap": return <><ellipse cx={0} cy={-92} rx={17} ry={14} fill={wrapColor} /><circle cx={10} cy={-104} r={6} fill={wrapColor} /></>;
      case "fade": return <ellipse cx={0} cy={-89} rx={15} ry={11} fill={hairColor} />;
      default: return <ellipse cx={0} cy={-90} rx={16} ry={12.5} fill={hairColor} />;
    }
  })();

  const face = back ? null : (
    <>
      {eyes === "open" && <><ellipse cx={-5} cy={-84} rx={1.9} ry={2.5} fill={HAIR} /><ellipse cx={5} cy={-84} rx={1.9} ry={2.5} fill={HAIR} /></>}
      {eyes === "closed" && <path d="M-7.5 -84 q2.5 2.5 5 0 M2.5 -84 q2.5 2.5 5 0" stroke={HAIR} strokeWidth={1.6} fill="none" strokeLinecap="round" />}
      {eyes === "happy" && <path d="M-7.5 -83 q2.5 -3 5 0 M2.5 -83 q2.5 -3 5 0" stroke={HAIR} strokeWidth={1.6} fill="none" strokeLinecap="round" />}
      {mouth === "smile" && <path d="M-4.5 -77 q4.5 4 9 0" stroke={HAIR} strokeWidth={1.6} fill="none" strokeLinecap="round" />}
      {mouth === "open" && <path d="M-4.5 -77.5 q4.5 7 9 0 z" fill="#7a1f1f" />}
      {mouth === "flat" && <path d="M-3 -76.5 h6" stroke={HAIR} strokeWidth={1.6} strokeLinecap="round" />}
      <circle cx={-9.5} cy={-79} r={2.6} fill="#ff8a7a" opacity={0.35} />
      <circle cx={9.5} cy={-79} r={2.6} fill="#ff8a7a" opacity={0.35} />
      {glasses && <g stroke={HAIR} strokeWidth={1.3} fill="none"><circle cx={-5} cy={-84} r={4.2} /><circle cx={5} cy={-84} r={4.2} /><path d="M-0.8 -84 h1.6" /></g>}
    </>
  );

  const handOrder = back ? ["l", "r"] : ["l", "r"];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {legs}
      <g transform={`translate(0 ${dy})`}>
        {hairBack}
        {skirt && lower === "stand" && <path d={`M-14 ${-40} L14 ${-40} L19 -16 L-19 -16 Z`} fill={bottom} />}
        <rect x={-4} y={-74} width={8} height={8} fill={skin} />
        <rect x={-14} y={-68} width={28} height={33} rx={11} fill={top} />
        {collar && <path d="M-6 -68 L0 -60 L6 -68 Z" fill={collar} />}
        {handOrder.map((k) => {
          const [e, h] = arms[k as "l" | "r"];
          const sh = k === "l" ? SH_L : SH_R;
          return (
            <g key={k}>
              <path d={path(sh, e, h)} stroke={top} strokeWidth={7.5} strokeLinecap="round" fill="none" />
              <circle cx={h[0]} cy={h[1]} r={4.2} fill={skin} />
            </g>
          );
        })}
        {pose === "book" && <g><path d="M-13 -56 L0 -52 L13 -56 L13 -45 L0 -41 L-13 -45 Z" fill={C.white} stroke="#0a2a7a33" /><path d="M0 -52 L0 -41" stroke="#0a2a7a55" /></g>}
        
        <circle cx={0} cy={-83} r={14.5} fill={skin} />
        {back ? <circle cx={0} cy={-85} r={15.5} fill={hair === "wrap" ? wrapColor : hairColor} /> : (
          <>
            <circle cx={-14.5} cy={-82} r={3} fill={skin} />
            <circle cx={14.5} cy={-82} r={3} fill={skin} />
            {hair === "wrap"
              ? <path d="M-15.5 -85 A15.5 15.5 0 0 1 15.5 -85 Q0 -95 -15.5 -85 Z" fill={wrapColor} />
              : <path d={hair === "fade" ? "M-14.3 -87.5 A14.6 14.6 0 0 1 14.3 -87.5 Q2 -93.5 -14.3 -87.5 Z" : "M-14.6 -85 A14.8 14.8 0 0 1 14.6 -85 Q5 -94 -9 -89 Q-12 -87 -14.6 -85 Z"} fill={hairColor} />}
          </>
        )}
        {face}
        {(pose === "mic" || pose === "micup") && <g><path d="M9 -66 L7.5 -73" stroke="#222" strokeWidth={4.5} strokeLinecap="round" /><circle cx={7} cy={-75.5} r={4.2} fill="#444" /><circle cx={7} cy={-75.5} r={4.2} fill="none" stroke="#777" strokeWidth={1} /></g>}
      </g>
    </g>
  );
}

/** Glossy tangerine stage disc (the flyer motif). */
export function StageDisc({ id, cx, cy, rx, ry, depth = 12 }: { id: string; cx: number; cy: number; rx: number; ry: number; depth?: number }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-top`} cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#ffc98f" /><stop offset=".55" stopColor="#fe7711" /><stop offset="1" stopColor="#f45400" /></radialGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f45400" /><stop offset="1" stopColor="#c42200" /></linearGradient>
      </defs>
      <ellipse cx={cx} cy={cy + depth} rx={rx} ry={ry} fill={`url(#${id}-side)`} />
      <rect x={cx - rx} y={cy} width={rx * 2} height={depth} fill={`url(#${id}-side)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-top)`} />
      <ellipse cx={cx - rx * 0.15} cy={cy - ry * 0.45} rx={rx * 0.55} ry={ry * 0.18} fill="#fff" opacity={0.45} />
    </g>
  );
}

/** Soft liquid ribbon across the background. */
export function Ribbon({ d, color = C.sky, opacity = 0.35 }: { d: string; color?: string; opacity?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={26} strokeLinecap="round" opacity={opacity} />;
}

export function Chair({ x, y, s = 1, color = C.ice }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-18} y={-58} width={8} height={40} rx={3} fill={color} opacity={0.9} />
      <rect x={-18} y={-22} width={44} height={7} rx={3} fill={color} />
      <path d="M-14 -15 L-14 0 M22 -15 L22 0" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

export function Stars({ points, r = 1.6 }: { points: [number, number][]; r?: number }) {
  return <g fill="#fff">{points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? r * 1.4 : r} opacity={i % 2 ? 0.9 : 0.6} />)}</g>;
}

export function Svg({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 640 360" role="img" aria-label={title} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <title>{title}</title>
      {children}
    </svg>
  );
}
