"use client";
import * as React from "react";
import Link from "next/link";
import { cn } from "../cn";
import { prefersReducedMotion, useKente } from "./kente";

export type StoleItem = {
  href: string;
  label: string;
  /** Which woven pattern to use. */
  seed: number;
  /** Length as a share of the rack height (0–1). */
  length?: number;
  external?: boolean;
};

const FRINGES: [string, string][] = [["#e2a610", "#181614"], ["#1e38ac", "#e2a610"], ["#181614", "#e2a610"], ["#e2a610", "#1e38ac"]];

const Stole = React.forwardRef<HTMLAnchorElement, { item: StoleItem; index: number }>(function Stole({ item, index }, ref) {
  const tile = useKente(item.seed);
  const [f1, f2] = FRINGES[index % FRINGES.length];
  const style = { "--k": index, "--f1": f1, "--f2": f2 } as React.CSSProperties;
  const body = (
    <>
      <span className="stole__loop" />
      <span className="stole__cloth" style={{ backgroundImage: tile?.url }} />
      <span className="stole__fringe" />
      <span className="stole__tag">{item.label}</span>
    </>
  );
  return item.external ? (
    <a ref={ref} href={item.href} className="stole" style={style}>{body}</a>
  ) : (
    <Link ref={ref} href={item.href} className="stole" style={style}>{body}</Link>
  );
});

/**
 * Stoles hanging from a rail, one per section. They unroll on arrival, lengthen on hover
 * and sway with the pointer. Give the rack a height with a class (the stoles scale to it).
 */
export function StoleRack({ items, className, label = "Sections" }: { items: StoleItem[]; className?: string; label?: string }) {
  const rack = React.useRef<HTMLElement>(null);
  const stoles = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const [hover, setHover] = React.useState(false);

  // stole lengths follow the rack height
  React.useEffect(() => {
    const el = rack.current;
    if (!el) return;
    const size = () => {
      const h = el.clientHeight;
      stoles.current.forEach((s, k) => {
        if (!s) return;
        s.style.setProperty("--base", `${Math.max(80, Math.round((h - 160) * (items[k]?.length ?? 0.7)))}px`);
      });
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  // the stoles swing from the rail with the motion of the pointer
  React.useEffect(() => {
    const el = rack.current;
    if (!el || prefersReducedMotion()) return;
    const host = el.parentElement ?? el;
    const st = items.map(() => ({ a: 0, v: 0 }));
    let lastX: number | null = null, push = 0, raf = 0, running = true;
    const onMove = (e: PointerEvent) => {
      if (lastX !== null) push += Math.max(-40, Math.min(40, e.clientX - lastX)) * 0.012;
      lastX = e.clientX;
    };
    const tick = (t: number) => {
      if (!running) return;
      stoles.current.forEach((s, k) => {
        if (!s) return;
        const p = st[k];
        const breeze = Math.sin(t / 1400 + k * 1.7) * 0.6;
        p.v += -push * (0.8 + k * 0.12) - p.a * 0.035 + breeze * 0.02 - p.v * 0.08;
        p.a = Math.max(-6, Math.min(6, p.a + p.v * 0.5));
        s.style.transform = `rotate(${p.a.toFixed(2)}deg)`;
      });
      push *= 0.6;
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => {
      running = !document.hidden;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(tick);
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [items]);

  return (
    <nav
      ref={rack}
      aria-label={label}
      className={cn("rack", hover && "has-hover", className)}
      onPointerOver={(e) => setHover(Boolean((e.target as Element).closest(".stole")))}
      onPointerLeave={() => setHover(false)}
    >
      <div className="rack__rail" aria-hidden />
      <div className="rack__stoles">
        {items.map((it, k) => (
          <Stole key={it.href} item={it} index={k} ref={(n) => { stoles.current[k] = n; }} />
        ))}
      </div>
    </nav>
  );
}
