import * as React from "react";

/** Liquid blue ribbons, as on the theme flyer. Place inside a `.ground-blue` section. */
export function Fluid({ seed = 0 }: { seed?: number }) {
  const id = `fl${seed}`;
  return (
    <svg className="fluid" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`${id}-rib`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fb3ff" />
          <stop offset="1" stopColor="#3c8dff" />
        </linearGradient>
        <linearGradient id={`${id}-deep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0a4fe9" />
          <stop offset="1" stopColor="#0f62f5" />
        </linearGradient>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      {/* deep ribbons */}
      <path d="M-120 640 C 180 520, 340 760, 640 640 S 1100 520, 1560 700 L 1560 900 L -120 900 Z" fill={`url(#${id}-deep)`} opacity=".9" filter={`url(#${id}-soft)`} />
      <path d="M-100 120 C 160 40, 300 260, 560 170 S 900 40, 1200 150 S 1500 260, 1560 180 L 1560 -40 L -100 -40 Z" fill={`url(#${id}-deep)`} opacity=".75" filter={`url(#${id}-soft)`} />
      {/* light ribbons */}
      <g className="fluid-drift">
        <path d="M-160 300 C 120 170, 330 420, 620 290 S 1040 120, 1300 290 S 1500 420, 1600 330 L 1600 420 C 1420 520, 1240 380, 1040 430 S 660 560, 420 450 S 60 380, -160 440 Z" fill={`url(#${id}-rib)`} opacity=".55" filter={`url(#${id}-soft)`} />
        <path d="M-160 560 C 60 470, 240 640, 460 560 S 820 400, 1080 520 S 1420 620, 1600 540 L 1600 600 C 1400 690, 1180 560, 940 620 S 520 760, 300 650 S 20 580, -160 630 Z" fill="#8cdbfb" opacity=".22" filter={`url(#${id}-soft)`} />
      </g>
      {/* glossy highlights */}
      <path d="M40 250 C 240 150, 420 330, 700 230" stroke="#b7e2ff" strokeWidth="14" strokeLinecap="round" fill="none" opacity=".35" filter={`url(#${id}-glow)`} />
      <path d="M760 520 C 980 440, 1140 600, 1380 500" stroke="#b7e2ff" strokeWidth="10" strokeLinecap="round" fill="none" opacity=".3" filter={`url(#${id}-glow)`} />
      <ellipse cx="220" cy="120" rx="260" ry="120" fill="#8cdbfb" opacity=".16" filter={`url(#${id}-glow)`} />
    </svg>
  );
}

/** Glossy 3D orange disc, the flyer's "stage". Full-bleed divider; put as last child of the blue section, before a `.stage` section. */
export function StageDisc({ className = "" }: { className?: string }) {
  return (
    <svg className={`stage-disc ${className}`} viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sd-side" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a1a" />
          <stop offset="0.45" stopColor="#f04a00" />
          <stop offset="1" stopColor="#f45400" />
        </linearGradient>
        <radialGradient id="sd-top" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#ff8f22" />
          <stop offset="0.55" stopColor="#fe7711" />
          <stop offset="0.85" stopColor="#f96200" />
          <stop offset="1" stopColor="#f45400" />
        </radialGradient>
        <linearGradient id="sd-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3bd" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="sd-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
        <filter id="sd-soft" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {/* warm glow onto the blue */}
      <ellipse cx="720" cy="130" rx="920" ry="80" fill="#ff9a1a" opacity=".3" filter="url(#sd-blur)" />
      {/* thickness / front face */}
      <ellipse cx="720" cy="150" rx="980" ry="110" fill="url(#sd-side)" />
      <rect x="-300" y="150" width="2040" height="80" fill="#f45400" />
      {/* top face */}
      <ellipse cx="720" cy="112" rx="980" ry="100" fill="url(#sd-top)" />
      {/* bright rim */}
      <ellipse cx="720" cy="112" rx="977" ry="97" fill="none" stroke="#ffc46e" strokeWidth="6" opacity=".9" />
      <ellipse cx="720" cy="112" rx="970" ry="90" fill="none" stroke="#ffd9a0" strokeWidth="2" opacity=".5" />
      {/* glossy crescent near the back edge */}
      <ellipse cx="720" cy="40" rx="760" ry="16" fill="url(#sd-gloss)" filter="url(#sd-soft)" />
      {/* soft inner shadow at the front lip */}
      <ellipse cx="720" cy="196" rx="900" ry="22" fill="#c82400" opacity=".35" filter="url(#sd-blur)" />
    </svg>
  );
}
