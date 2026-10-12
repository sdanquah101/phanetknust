import Image from "next/image";
import { KenteCloth } from "@phanet/ui";

const seedOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 9973, 7);
import type { ProgramIcon } from "@/content/programs";
import { ProgramVideo } from "@/components/ProgramVideo";
import { PHOTO_QUALITY } from "@/lib/image";

const ICONS: Record<ProgramIcon, React.ReactNode> = {
  moon: <path d="M42 12a22 22 0 1 0 22 30A18 18 0 0 1 42 12z" />,
  people: <><circle cx="24" cy="24" r="8" /><circle cx="48" cy="24" r="8" /><path d="M10 54c0-9 6-16 14-16s14 7 14 16M34 54c0-9 6-16 14-16s14 7 14 16" /></>,
  book: <><path d="M36 18c-6-4-14-5-22-4v36c8-1 16 0 22 4 6-4 14-5 22-4V14c-8-1-16 0-22 4z" /><path d="M36 18v36" /></>,
  flame: <path d="M36 10c4 10 16 16 16 30a16 16 0 0 1-32 0c0-8 4-12 8-16 0 6 3 9 6 10-2-8 0-16 2-24z" />,
  briefcase: <><rect x="12" y="22" width="48" height="32" rx="6" /><path d="M28 22v-6h16v6M12 36h48" /></>,
};

/** Programs with a video ad in /public/programs (<slug>.webm and <slug>.mp4, plus a <slug>.webp poster). */
const VIDEOS = new Set(["gathering-of-the-adelphos", "night-of-solemnities", "academic-excellence-retreat", "prophetic-convocation", "business-masterclass"]);

/**
 * Program visual: its video ad if there is one, otherwise an uploaded cover image if the admin
 * set one, otherwise a kente tile with the program's icon (for programs added later).
 */
export function ProgramArt({ slug, name, cover, icon, sizes, priority }: { slug: string; name: string; cover: string | null; icon: ProgramIcon; sizes: string; priority?: boolean }) {
  if (VIDEOS.has(slug)) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden bg-loom">
        <ProgramVideo src={`/programs/${slug}`} poster={`/programs/${slug}.webp`} label={`${name}: short video`} />
      </div>
    );
  }
  if (cover) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden bg-deep">
        <Image quality={PHOTO_QUALITY} src={cover} alt={name} fill sizes={sizes} className="object-cover" priority={priority} />
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/9] overflow-hidden grid place-items-center bg-loom isolate" aria-hidden>
      <KenteCloth seed={seedOf(slug) % 90} stripWidth={72} motion={false} className="absolute inset-0 h-full -z-10" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_50%,rgba(8,8,8,.45),rgba(8,8,8,.8)_75%)]" />
      <svg viewBox="0 0 72 72" width="88" height="88" fill="none" stroke="#f6d77a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="relative">{ICONS[icon]}</svg>
    </div>
  );
}
