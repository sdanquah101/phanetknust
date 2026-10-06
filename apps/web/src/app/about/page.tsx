import type { Metadata } from "next";
import Image from "next/image";
import { Blobs, ButtonLink, HeroCurve, Label, Script } from "@phanet/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/queries";
import { splitLine } from "@/lib/copy";
import { Leadership } from "@/components/Leadership";
import { LEADERS } from "@/content/leaders";
import { photo } from "@/content/photos";

const storyPhoto = photo("group-night");
import { ACADEMY_URL, PRAYERWALL_URL } from "@/lib/links";

export const metadata: Metadata = { title: "About" };
export const revalidate = 60;

export default async function AboutPage() {
  const { theme, about, socials } = await getSettings();
  const streams = (about.streams ?? []).map(splitLine);
  const values = (about.values ?? []).map(splitLine);
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-14 pb-6 grid gap-10 lg:grid-cols-[1.1fr_.9fr] items-center">
          <div>
            <Label tone="peach" className="mb-3">About PHANET KNUST</Label>
            <h1 className="leading-none">
              <span className="h3d block t-h1">We intercede.</span>
              <span className="h3d block t-h1">We avail <span className="script-puffy text-peach text-[1.15em]">ourselves</span>.</span>
            </h1>
            <p className="mt-8 text-white text-lg md:text-xl max-w-2xl font-medium">{about.intro}</p>
          </div>
          <div className="card card-lg tilt-2 p-8 md:p-9 max-w-md w-full lg:justify-self-end">
            <Label tone="orange" className="mb-3">On intercession</Label>
            <blockquote className="t-lead font-medium text-deep">{about.scripture_text}</blockquote>
            <div className="mt-4 text-xs font-bold tracking-wide uppercase text-muted">{about.scripture_reference}</div>
          </div>
        </div>
        <div className="mt-8"><HeroCurve /></div>
      </section>

      <section className="ground-ice">
        <div className="container-page py-16 flex flex-col gap-14">
          {/* The idea + our story */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr] items-start">
            <div className="card-blue p-8 md:p-10 flex flex-col gap-4">
              <Label tone="peach">The idea</Label>
              <p className="text-2xl md:text-[28px] font-bold leading-snug">{about.idea}</p>
              {about.idea_reference && <div className="text-xs font-bold tracking-wide uppercase text-white mt-2">{about.idea_reference}</div>}
            </div>
            <div className="card overflow-hidden flex flex-col">
              <div className="relative aspect-[16/9]">
                <Image src={storyPhoto.src} alt={storyPhoto.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              </div>
              <div className="p-8 md:p-10 flex flex-col gap-4">
              <Label tone="orange">Our story</Label>
              <p className="text-muted leading-relaxed">{about.story}</p>
              </div>
            </div>
          </div>

          {/* Mandate, vision, mission */}
          <div>
            <h2 className="t-h2 text-deep mb-6">What we are here for</h2>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="card-orange p-7 flex flex-col gap-3">
                <Label tone="white">Our mandate</Label>
                <p className="text-xl font-bold leading-snug">{about.mandate}</p>
              </div>
              <div className="card p-7 flex flex-col gap-3">
                <Label tone="orange">Our vision</Label>
                <p className="text-xl font-bold leading-snug text-royal">{about.vision}</p>
                <p className="text-sm text-muted">Not one big congregation. Many people who know how to stand in the gap, wherever they are.</p>
              </div>
              <div className="card p-7 flex flex-col gap-3">
                <Label tone="orange">Our mission</Label>
                <p className="text-xl font-bold leading-snug text-royal">{about.mission}</p>
              </div>
            </div>
          </div>

          {/* Four streams */}
          <div>
            <h2 className="t-h2 text-deep mb-2">How we do it</h2>
            <p className="text-muted mb-6 max-w-2xl">Four things, always together. Take one away and it stops being PHANET.</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {streams.map((s, i) => (
                <div key={s.title} className="card p-6 flex flex-col gap-3">
                  
                  <div className="label-caps text-muted">0{i + 1}</div>
                  <div className="text-lg font-extrabold text-royal">{s.title}</div>
                  <p className="text-sm text-muted">{s.body}</p>
                  {s.ref && <div className="mt-auto pt-2 text-[11px] font-bold tracking-wide uppercase text-tangerine">{s.ref}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
          <div>
            <h2 className="t-h2 text-deep mb-6">What we hold to</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {values.map((v) => (
                <li key={v.title} className="card p-6 flex gap-4 items-start">
                  <span className="w-3 h-3 rounded-full bg-royal mt-2 flex-none" />
                  <div>
                    <div className="font-extrabold text-deep">{v.title}</div>
                    <p className="text-sm text-muted mt-1">{v.body}</p>
                    {v.ref && <div className="mt-2 text-[11px] font-bold tracking-wide uppercase text-tangerine">{v.ref}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Leadership */}
          <Leadership leaders={LEADERS} />

          {/* Who can be an emissary */}
          <div className="card-blue p-8 md:p-10 grid gap-6 lg:grid-cols-[1fr_auto] items-center">
            <div>
              <Label tone="peach" className="mb-3">Who this is for</Label>
              <p className="text-xl md:text-2xl font-bold leading-snug max-w-3xl">{about.emissary}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/programs" variant="white">Come on Wednesday</ButtonLink>
              <a href={ACADEMY_URL} className="btn btn-ghost">Start a course</a>
            </div>
          </div>

          <div className="text-center text-sm text-muted">
            Carrying something heavy? <a href={PRAYERWALL_URL} className="font-bold text-royal">Put it on the prayer wall</a>. We will pray with you.
          </div>
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
