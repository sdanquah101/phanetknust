import type { Metadata } from "next";
import Image from "next/image";
import { Blobs, HeroCurve, Label } from "@phanet/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/queries";
import { PHOTOS } from "@/content/photos";

export const metadata: Metadata = { title: "Gallery" };
export const revalidate = 60;

export default async function GalleryPage() {
  const { theme, socials } = await getSettings();
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-14 pb-6">
          <Label tone="peach" className="mb-3">Gallery</Label>
          <h1 className="t-h1 h3d">Life at PHANET</h1>
          <p className="t-lead mt-5 max-w-[46ch]">Prayer meetings, teaching nights, outreach and the friendships in between.</p>
        </div>
        <div className="mt-8"><HeroCurve /></div>
      </section>
      <section className="ground-ice section !pt-6">
        <div className="container-page">
          <ul className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
            {PHOTOS.map((p, i) => (
              <li key={p.src} className="mb-3 md:mb-4 break-inside-avoid">
                <a href={p.src} target="_blank" rel="noreferrer" className="block rounded-[20px] overflow-hidden bg-row shadow-card hover:opacity-95 transition-opacity">
                  <Image src={p.src} alt={p.alt} width={p.width} height={p.height} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" className="w-full h-auto" priority={i < 4} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
