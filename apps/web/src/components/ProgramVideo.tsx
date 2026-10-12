"use client";
import * as React from "react";

/**
 * A program's video ad: muted, looping, inline. It only loads and plays while on screen,
 * and stays on its poster for people who ask their device for reduced motion.
 */
export function ProgramVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  // src is the path without extension: WebM (VP9) first, MP4 (H.264) for browsers without VP9
  const ref = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); }
      else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className="absolute inset-0 h-full w-full object-cover"
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
