import type { Metadata } from "next";
import Image from "next/image";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LoomGallery } from "@/components/LoomGallery";
import { getSettings } from "@/lib/queries";
import { PHOTOS } from "@/content/photos";
import { PHOTO_QUALITY } from "@/lib/image";

export const metadata: Metadata = { title: "Gallery" };
export const revalidate = 60;

// where faces sit in each photo, so the loom keeps them in frame when it crops
const FOCUS: Record<string, number> = {
  "friends-five": 0.6, worship: 0.3, "minister-mic": 0.28, "question-mic": 0.45, listening: 0.4, "young-man": 0.3,
  selfie: 0.4, "three-friends": 0.35, "two-friends": 0.35, "two-brothers": 0.3, sunlit: 0.35, pair: 0.35, attentive: 0.4, evening: 0.35,
};
const LOOM = PHOTOS.map((p) => {
  const key = p.src.replace("/photos/", "").replace(".webp", "");
  return { src: p.src, alt: p.alt, width: p.width, height: p.height, focus: FOCUS[key] ?? 0.45 };
});

export default async function GalleryPage() {
  const { theme, socials } = await getSettings();
  return (
    <>
      <SiteHeader />
      <section className="container-page pt-14 md:pt-20 pb-10">
        <p className="kicker">Gallery</p>
        <h1 className="t-h1 text-black mt-2 max-w-[14ch]">Life at PHANET</h1>
        <p className="t-lead text-muted mt-6 max-w-[46ch]">Prayer meetings, teaching nights, outreach and the friendships in between. Drag, tap or use the arrows to change the photo.</p>
      </section>

      <section className="bg-cream">
        <div className="container-page py-12 md:py-16">
          <LoomGallery photos={LOOM} />
        </div>
      </section>

      <section className="container-page section">
        <h2 className="t-h2">Every photo</h2>
        <p className="t-body text-muted mt-3">Hover or tap a photo to see it in colour. Click to open it full size.</p>
        <ul className="mt-10 columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
          {PHOTOS.map((p) => (
            <li key={p.src} className="mb-3 md:mb-4 break-inside-avoid">
              <a href={p.src} target="_blank" rel="noreferrer" className="photo-bw block bg-cream">
                <Image quality={PHOTO_QUALITY} src={p.src} alt={p.alt} width={p.width} height={p.height} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="w-full h-auto" />
              </a>
            </li>
          ))}
        </ul>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
