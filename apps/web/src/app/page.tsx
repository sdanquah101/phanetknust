import Link from "next/link";
import { Badge, ButtonLink, HeroCurve, Label } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPrayerTeaser, getPrograms, getSettings, getUpcomingEvents } from "@/lib/queries";
import { ACADEMY_URL, PRAYERWALL_URL } from "@/lib/links";

export const revalidate = 60;

const PILLARS = [
  { n: "01", title: "We intercede", body: "We stand before God for our campus, our nation and people who do not yet know Christ.", ref: "1 Timothy 2:1" },
  { n: "02", title: "We avail ourselves", body: "When God wants someone to solve what we pray about, we want to be ready and willing.", ref: "Isaiah 6:8" },
  { n: "03", title: "We grow together", body: "We study the Word, fellowship like family and look out for one another.", ref: "Acts 2:42" },
];

export default async function Home() {
  const [settings, programs, events, prayer] = await Promise.all([getSettings(), getPrograms(), getUpcomingEvents(3), getPrayerTeaser()]);
  const { theme, verse_of_day: verse, live, socials } = settings;

  return (
    <>
      {/* HERO — the flyer's world: a blurred copy of the artwork is the backdrop, the crisp artwork dissolves into it */}
      <section className="relative isolate overflow-hidden text-white bg-[#1a6cf0]">
        <div className="absolute inset-0 -z-10" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/flyer.webp" alt="" className="absolute inset-0 w-full h-full object-cover scale-125 blur-[60px] saturate-[1.15] opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,58,200,.78)_0%,rgba(8,58,200,.45)_45%,rgba(8,58,200,0)_75%)]" />
        </div>
        <SiteHeader />
        <div className="container-page grid gap-6 lg:gap-10 lg:grid-cols-[1fr_1fr] items-end pt-10 lg:pt-6">
          <div className="lg:self-center lg:pb-24 fade-up">
            <span className="pill pill-glass mb-6">Theme {theme.year} · {theme.reference}</span>
            <h1 className="t-display h3d">
              We intercede for our <span className="script-puffy text-peach text-[1.12em] whitespace-nowrap">generation</span>.
            </h1>
            <p className="t-lead mt-6 max-w-[34ch]">And we avail ourselves to be the solutions to the things we pray about.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/programs" size="lg">Join us on Wednesday</ButtonLink>
              <a href={live.url} target="_blank" rel="noreferrer" className="btn btn-white btn-lg">Watch {live.title} ▶</a>
            </div>
          </div>
          <div className="relative w-full max-w-[600px] mx-auto lg:mr-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flyer.webp"
              alt={`${theme.year} theme: ${theme.title}, ${theme.reference}`}
              width={1200}
              height={1200}
              className="block w-full h-auto [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent),linear-gradient(to_bottom,transparent,#000_10%)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
            />
            <a href={live.url} target="_blank" rel="noreferrer" className="card tilt-n2 absolute left-0 sm:-left-4 bottom-[30%] hidden sm:flex items-center gap-3 px-4 py-3 no-underline">
              <span className="relative flex w-3 h-3"><span className="absolute inline-flex h-full w-full rounded-full bg-[#e5484d] opacity-60 animate-ping" /><span className="relative inline-flex w-3 h-3 rounded-full bg-[#e5484d]" /></span>
              <span>
                <span className="label-caps-orange block">{live.label}</span>
                <span className="font-bold text-deep">{live.title}</span>
              </span>
            </a>
          </div>
        </div>
        <div className="-mt-10 relative"><HeroCurve /></div>
      </section>

      {/* WHO WE ARE */}
      <section className="ground-ice section !pt-10">
        <div className="container-page">
          <div className="max-w-2xl">
            <Label tone="orange" className="mb-3">Who we are</Label>
            <h2 className="t-h2 text-deep">A Christian youth movement on the KNUST campus.</h2>
            <p className="t-lead text-muted mt-4">We pray about the problems of our generation, and we make ourselves available for God to use us in solving them.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div key={p.n} className="card p-7 flex flex-col gap-3">
                <div className="text-royal font-extrabold text-[15px] tracking-wider">{p.n}</div>
                <h3 className="t-h3 text-deep">{p.title}</h3>
                <p className="t-body text-muted">{p.body}</p>
                <div className="t-ref mt-auto pt-2">{p.ref}</div>
              </div>
            ))}
          </div>
          <figure className="mt-10 card p-7 md:p-9 border-l-[6px] border-royal grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <blockquote className="t-quote text-deep">“I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men.”</blockquote>
            <figcaption className="t-ref">1 Timothy 2:1 · KJV</figcaption>
          </figure>
          <div className="mt-8"><Link href="/about" className="btn btn-outline-blue">More about PHANET</Link></div>
        </div>
      </section>

      {/* WHERE WE GATHER — only when there is something to show */}
      {(programs.length > 0 || events.length > 0) && (
        <section className="ground-ice section !pt-0">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <Label tone="orange" className="mb-3">Every week</Label>
                <h2 className="t-h2 text-deep">Where we gather</h2>
              </div>
              <ButtonLink href="/programs" variant="outline-blue" size="sm">All programs</ButtonLink>
            </div>
            {programs.length > 0 && (
              <div className="grid gap-5 md:grid-cols-3">
                {programs.slice(0, 3).map((p) => (
                  <Link key={p.id} href={`/programs#${p.slug}`} className="card p-7 no-underline flex flex-col gap-3 hover:-translate-y-1 transition-transform">
                    {p.schedule_label && <Badge tone="good" className="self-start">{p.schedule_label}</Badge>}
                    <h3 className="t-h3 text-deep mt-1">{p.name}</h3>
                    <p className="t-body text-muted">{p.tagline ?? p.description}</p>
                    {p.location && <div className="t-small text-deep mt-auto pt-2">{p.location}</div>}
                  </Link>
                ))}
              </div>
            )}
            {events.length > 0 && (
              <ul className="mt-6 grid gap-3 md:grid-cols-3">
                {events.map((e) => (
                  <li key={e.id} className="card-ice p-5 flex flex-col gap-1">
                    <div className="label-caps text-muted">Coming up</div>
                    <div className="font-bold text-deep">{e.title}</div>
                    <div className="t-small text-muted">{fmtDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ""}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* PRAYER WALL — an inset blue panel rather than a full-bleed slab */}
      <section className="ground-ice section !pt-0">
        <div className="container-page">
          <div className="card-blue rounded-[36px] p-8 md:p-12 grid gap-10 lg:grid-cols-[1.15fr_.85fr] items-center">
            <div>
              <Label tone="peach" className="mb-3">Prayer wall</Label>
              <h2 className="t-h2">
                {prayer.count > 0 ? `${prayer.count.toLocaleString()} people are praying` : "We are praying"} <span className="script-puffy text-peach text-[1.12em]">with you</span>
              </h2>
              <p className="t-lead mt-4 max-w-[40ch]">Share what you are carrying, without your name. Keep your code, and come back to tell us how God answered.</p>
              {prayer.topics.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {prayer.topics.map((t) => <span key={t.id} className="pill pill-glass">{t.topic}</span>)}
                </div>
              )}
              <a href={PRAYERWALL_URL} className="btn btn-white mt-8">Add a prayer request</a>
            </div>
            <figure className="card p-8 tilt-2 max-w-md w-full lg:justify-self-end">
              <Label tone="orange" className="mb-3">Verse of the day</Label>
              <blockquote className="t-quote text-deep">{verse.text}</blockquote>
              <figcaption className="t-ref mt-4 !text-muted">{verse.reference}</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ACADEMY + GIVE — Give is the one orange block on this screen */}
      <section className="ground-ice section !pt-0">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <a href={ACADEMY_URL} className="card p-8 md:p-10 no-underline flex flex-col gap-4 min-h-[280px] hover:-translate-y-1 transition-transform">
            <Label tone="orange">PHANET Academy</Label>
            <h3 className="t-h2 text-deep">Learn, take the quiz, get your certificate.</h3>
            <p className="t-body text-muted max-w-sm">Free video and audio courses, plus books and messages to download.</p>
            <span className="btn btn-blue btn-sm mt-auto self-start">Open the Academy</span>
          </a>
          <Link href="/give" className="card-orange p-8 md:p-10 no-underline flex flex-col gap-4 min-h-[280px] hover:-translate-y-1 transition-transform">
            <Label tone="white">Give</Label>
            <h3 className="t-h2">Sow where you're <span className="script text-[1.12em]">planted</span>.</h3>
            <p className="t-body max-w-sm">Offering, tithe, the Sending fund and welfare. MTN MoMo, Telecel Cash or card, with an instant receipt.</p>
            <span className="btn btn-white btn-sm mt-auto self-start">Give now</span>
          </Link>
        </div>
      </section>

      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
