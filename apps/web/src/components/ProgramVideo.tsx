"use client";
import * as React from "react";

const SOUND_EVENT = "phanet:program-video-sound";

/**
 * A program's video ad: looping and inline. It starts muted (browsers only autoplay silent video),
 * only loads and plays while on screen, and stays on its poster for people who ask their device
 * for reduced motion. With `sound`, a button turns the music on; only one video plays sound at a time.
 */
export function ProgramVideo({ src, poster, label, sound = false }: { src: string; poster: string; label: string; sound?: boolean }) {
  // src is the path without extension: WebM (VP9) first, MP4 (H.264) for browsers without VP9
  const ref = React.useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = React.useState(true);

  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && (!reduce || !v.muted)) { v.preload = "auto"; v.play().catch(() => {}); }
      else if (!e.isIntersecting) v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    // another video turned its sound on: go quiet
    const quiet = (e: Event) => { if ((e as CustomEvent).detail !== v) { v.muted = true; setMuted(true); } };
    window.addEventListener(SOUND_EVENT, quiet);
    return () => { io.disconnect(); window.removeEventListener(SOUND_EVENT, quiet); };
  }, []);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    if (!next) {
      window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: v }));
      v.currentTime = 0;
      v.preload = "auto";
      v.play().catch(() => {});
    }
  }

  return (
    <>
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
      {sound && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={!muted}
          className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-black/75 px-3.5 py-2 text-[14px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
            {muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13" />}
          </svg>
          {muted ? "Sound on" : "Sound off"}
        </button>
      )}
    </>
  );
}
