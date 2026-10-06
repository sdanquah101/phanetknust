import type { Metadata } from "next";
import { Blobs, ButtonLink, Label, Script, StageDisc, Ticker, VerseBadge } from "@phanet/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/queries";
import { PRAYERWALL_URL } from "@/lib/links";

export const metadata: Metadata = { title: "About" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { theme, about, socials } = await getSettings();
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-14 pb-6 max-w-4xl">
          <Label tone="peach" className="mb-3">About PHANET KNUST</Label>
          <h1 className="h3d text-[48px] md:text-[72px]">Young, <Script peach className="text-[1.2em]">planted</Script>, and praying.</h1>
          <p className="mt-6 text-white/90 text-base md:text-lg max-w-2xl">{about.mission}</p>
          <div className="mt-8"><VerseBadge>{theme.reference}</VerseBadge></div>
        </div>
        <StageDisc className="mt-10" />
      </section>
      <div className="stage"><Ticker items={[`${theme.title} · ${theme.reference}`, `${theme.title} · ${theme.reference}`]} /></div>

      <section className="ground-ice -mt-px">
        <div className="container-page py-16 grid gap-6 md:grid-cols-3">
          <div className="card-blue p-7 md:col-span-2">
            <Label tone="peach" className="mb-2">Our vision</Label>
            <p className="text-2xl font-bold leading-snug">{about.vision}</p>
          </div>
          <div className="card p-7">
            <Label tone="orange" className="mb-3">What we value</Label>
            <ul className="flex flex-wrap gap-2">
              {about.values.map((v) => <li key={v} className="pill pill-ice">{v}</li>)}
            </ul>
          </div>
          <div className="card p-7 md:col-span-3 grid gap-6 md:grid-cols-3">
            <div>
              <Label tone="orange" className="mb-2">Theme {theme.year}</Label>
              <div className="text-xl font-extrabold text-royal">{theme.title}</div>
              <p className="text-sm text-muted mt-1">{theme.tagline}</p>
            </div>
            <div>
              <Label tone="orange" className="mb-2">Where</Label>
              <div className="text-xl font-extrabold text-royal">KNUST, Kumasi</div>
              <p className="text-sm text-muted mt-1">Great Hall foyer on Wednesdays, Unity Hall at dawn, and wherever you are online.</p>
            </div>
            <div>
              <Label tone="orange" className="mb-2">Who</Label>
              <div className="text-xl font-extrabold text-royal">Students, for students</div>
              <p className="text-sm text-muted mt-1">Led by student executives who shepherd small groups across every college and hall.</p>
            </div>
          </div>
          <div className="md:col-span-3 flex flex-wrap gap-3 justify-center pt-4">
            <ButtonLink href="/programs">See our programs</ButtonLink>
            <a href={PRAYERWALL_URL} className="btn btn-outline-blue">Visit the prayer wall</a>
          </div>
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
