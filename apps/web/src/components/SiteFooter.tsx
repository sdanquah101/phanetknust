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
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-white/80 max-w-sm">The KNUST chapter of Phanerosis Prayer Network International. We intercede for our generation, and we avail ourselves to be the solutions to what we pray about.</p>
          </div>
          <div>
            <div className="label-caps-peach mb-3">Explore</div>
            <ul className="flex flex-col gap-2 text-sm text-white/85">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/programs" className="hover:text-white">Programs</Link></li>
              <li><Link href="/shop" className="hover:text-white">Shop</Link></li>
              <li><Link href="/give" className="hover:text-white">Give</Link></li>
            </ul>
          </div>
          <div>
            <div className="label-caps-peach mb-3">Platforms</div>
            <ul className="flex flex-col gap-2 text-sm text-white/85">
              <li><a href={ACADEMY_URL} className="hover:text-white">PHANET Academy</a></li>
              <li><a href={PRAYERWALL_URL} className="hover:text-white">Prayer Wall</a></li>
              <li><a href={WELFARE_URL} className="hover:text-white">Welfare</a></li>
            </ul>
          </div>
        </div>
        <div className="divider-glass my-8" />
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-white/80">
          <span className="wordmark text-white">PHANET KNUST</span>
          <div className="flex flex-wrap gap-5">
            {social.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="hover:text-white">{label}</a>)}
          </div>
          <span>Kumasi, Ghana · {year}</span>
        </div>
      </div>
    </footer>
  );
}
