import Image from "next/image";
import type { ProgramIcon } from "@/content/programs";

const ICONS: Record<ProgramIcon, React.ReactNode> = {
  moon: <path d="M42 12a22 22 0 1 0 22 30A18 18 0 0 1 42 12z" />,
  people: <><circle cx="24" cy="24" r="8" /><circle cx="48" cy="24" r="8" /><path d="M10 54c0-9 6-16 14-16s14 7 14 16M34 54c0-9 6-16 14-16s14 7 14 16" /></>,
  book: <><path d="M36 18c-6-4-14-5-22-4v36c8-1 16 0 22 4 6-4 14-5 22-4V14c-8-1-16 0-22 4z" /><path d="M36 18v36" /></>,
  flame: <path d="M36 10c4 10 16 16 16 30a16 16 0 0 1-32 0c0-8 4-12 8-16 0 6 3 9 6 10-2-8 0-16 2-24z" />,
  briefcase: <><rect x="12" y="22" width="48" height="32" rx="6" /><path d="M28 22v-6h16v6M12 36h48" /></>,
};

/** Program illustration: the cartoon if we have one, otherwise a branded icon tile in the same frame. */
export function ProgramArt({ name, illustration, icon, sizes, priority }: { name: string; illustration: string | null; icon: ProgramIcon; sizes: string; priority?: boolean }) {
  if (illustration) {
    return (
      <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] bg-deep">
        <Image src={illustration} alt={`Cartoon illustration of ${name}`} fill sizes={sizes} className="object-cover" priority={priority} />
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] grid place-items-center bg-[radial-gradient(120%_100%_at_80%_0%,#2a7ffb_0%,#1766ec_45%,#0a46e8_100%)]" aria-hidden>
      <div className="absolute -bottom-10 -left-6 -right-6 h-20 rounded-[50%] bg-[radial-gradient(60%_80%_at_50%_30%,#ffc98f_0%,#fe7711_55%,#de2700_100%)] shadow-[inset_0_6px_0_rgba(255,255,255,.45)]" />
      <svg viewBox="0 0 72 72" width="88" height="88" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="relative drop-shadow-[0_6px_14px_rgba(0,30,120,.45)]">{ICONS[icon]}</svg>
    </div>
  );
}
