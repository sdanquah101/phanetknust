import Link from "next/link";
import { Logo } from "@phanet/ui";
import { ACADEMY_URL, PRAYERWALL_URL, WELFARE_URL } from "@/lib/links";
import type { Socials } from "@/lib/queries";

export function SiteFooter({ socials, year }: { socials: Socials; year: string }) {
  const social = [
    ["Instagram", socials.instagram], ["YouTube", socials.youtube], ["WhatsApp", socials.whatsapp], ["TikTok", socials.tiktok],
  ].filter(([, href]) => href) as [string, string][];
  return (
    <footer className="ground-blue">
      <div className="container-page pt-14 pb-10">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 t-small text-white max-w-sm">The KNUST chapter of Phanerosis Prayer Network International. We intercede for our generation, and we avail ourselves to be the solutions to what we pray about.</p>
          </div>
          <nav aria-label="Explore">
            <div className="label-caps text-white mb-3">Explore</div>
            <ul className="flex flex-col gap-2 t-small">
              <li><Link href="/about" className="hover:underline">About</Link></li>
              <li><Link href="/programs" className="hover:underline">Programs</Link></li>
              <li><Link href="/shop" className="hover:underline">Shop</Link></li>
              <li><Link href="/give" className="hover:underline">Give</Link></li>
            </ul>
          </nav>
          <nav aria-label="Platforms">
            <div className="label-caps text-white mb-3">Platforms</div>
            <ul className="flex flex-col gap-2 t-small">
              <li><a href={ACADEMY_URL} className="hover:underline">PHANET Academy</a></li>
              <li><a href={PRAYERWALL_URL} className="hover:underline">Prayer Wall</a></li>
              <li><a href={WELFARE_URL} className="hover:underline">Welfare</a></li>
            </ul>
          </nav>
        </div>
        <div className="divider-glass my-8" />
        <div className="flex flex-wrap items-center justify-between gap-4 t-small">
          <div className="flex flex-wrap gap-5">
            {social.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="hover:underline">{label}</a>)}
          </div>
          <span>Kumasi, Ghana · {year}</span>
        </div>
      </div>
    </footer>
  );
}
