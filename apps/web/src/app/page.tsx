import Link from "next/link";
import { Badge, Blobs, ButtonLink, Label, Script, StageDisc, Ticker, VerseBadge } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPrayerTeaser, getPrograms, getSettings, getUpcomingEvents } from "@/lib/queries";
import { ACADEMY_URL, PRAYERWALL_URL } from "@/lib/links";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, programs, events, prayer] = await Promise.all([getSettings(), getPrograms(), getUpcomingEvents(3), getPrayerTeaser()]);
  const { theme, verse_of_day: verse, live, socials } = settings;
  // "Let No Man Despise Thy Youth" → Poppins "Let No Man", bubbly script "Despise Thy" + "Youth"
  const words = theme.title.split(" ");
  const last = words.at(-1) ?? "";
  const middle = words.slice(Math.max(0, words.length - 3), -1).join(" ");
  const headlineLead = words.slice(0, Math.max(0, words.length - 3)).join(" ");

  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative z-10 grid gap-10 lg:grid-cols-[1.05fr_.95fr] items-center pt-10 pb-8 lg:pt-14 lg:pb-0">
          <div className="fade-up">
            <span className="pill pill-glass mb-7"><Badge tone="orange">New</Badge> {theme.year} theme of the year</span>
            <h1 className="leading-none">
              <span className="h3d block text-[46px] md:text-[68px] lg:text-[78px] tracking-[-0.03em] leading-[1]">{headlineLead}</span>
              <span className="script-puffy block text-white text-[52px] md:text-[80px] lg:text-[92px] leading-[1.15] mt-1 pl-1">{middle}</span>
              <span className="script-puffy block text-white text-[66px] md:text-[100px] lg:text-[118px] leading-[1.1] -mt-2 pl-1">{last}</span>
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <VerseBadge>{theme.reference}</VerseBadge>
              <p className="text-white/95 max-w-sm text-sm md:text-base font-medium">{theme.tagline}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/programs" size="lg">Join a prayer cell</ButtonLink>
              <a href={live.url} target="_blank" rel="noreferrer" className="btn btn-white btn-lg">Watch {live.title} ▶</a>
            </div>
          </div>
          <div className="relative max-w-[460px] w-full mx-auto lg:ml-auto lg:-mb-20 floaty">
            <div className="rounded-[44px] overflow-hidden shadow-[0_40px_90px_rgba(0,44,154,.55)] ring-1 ring-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/flyer.webp" alt={`${theme.year} theme flyer: ${theme.title}`} className="block w-full h-auto" width={1200} height={1200} />
            </div>
            <a href={live.url} target="_blank" rel="noreferrer" className="card tilt-n2 absolute -left-4 md:-left-8 bottom-24 flex items-center gap-3 px-4 py-3 no-underline">
              <span className="dot-orange" />
              <span>
                <span className="label-caps-orange block">{live.label}</span>
                <span className="font-bold text-royal">{live.title}</span>
              </span>
            </a>
          </div>
        </div>
        <StageDisc className="mt-6 lg:mt-0" />
      </section>

      {/* the stage */}
      <section className="stage">
        <Ticker items={[`${theme.title} · ${theme.reference}`, `${theme.title} · ${theme.reference}`]} className="relative pt-6" />
        <div className="container-page relative pt-8 pb-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Label tone="white" className="mb-2">This week</Label>
              <h2 className="text-[40px] md:text-[56px] text-white">Where we <Script className="text-[1.2em]" >gather</Script></h2>
            </div>
            <ButtonLink href="/programs" variant="white" size="sm">All programs →</ButtonLink>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {programs.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/programs#${p.slug}`} className="card p-6 no-underline flex flex-col gap-3 hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between">
                  <Badge tone="good">{p.schedule_label}</Badge>
                  <span className="w-5 h-5 rounded-full bg-royal" />
                </div>
                <div className="text-2xl font-extrabold text-royal mt-2">{p.name}</div>
                <p className="text-sm text-muted">{p.tagline ?? p.description}</p>
                {p.location && <div className="text-xs font-semibold text-deep/70">{p.location}</div>}
              </Link>
            ))}
            {programs.length === 0 && (
              <div className="card p-6 md:col-span-3 text-center text-muted">Programs will appear here once the admin adds them.</div>
            )}
          </div>
          {events.length > 0 && (
            <div className="mt-8 glass p-5 flex flex-wrap gap-4 items-center">
              <Label tone="white">Coming up</Label>
              {events.map((e) => (
                <span key={e.id} className="pill pill-white">{e.title} · {fmtDateTime(e.starts_at)}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* prayer wall + verse */}
      <section className="ground-blue">
        <Blobs />
        <div className="container-page relative py-20 grid gap-10 lg:grid-cols-[1.2fr_.8fr] items-center">
          <div>
            <Label tone="peach" className="mb-3">Prayer wall</Label>
            <h2 className="text-[40px] md:text-[56px] leading-[1]">
              <span className="h3d">{prayer.count > 0 ? `${prayer.count.toLocaleString()} people are` : "We are"} praying</span>{" "}
              <span className="script-puffy text-peach text-[1.15em]">with you</span>
            </h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {prayer.topics.map((t) => (
                <span key={t.id} className="pill pill-glass">{t.topic}</span>
              ))}
              <a href={PRAYERWALL_URL} className="pill pill-orange no-underline">+ Add a request</a>
            </div>
            <p className="mt-6 text-sm text-white/80 max-w-md">Share a burden anonymously, keep your code, and come back with the testimony.</p>
          </div>
          <div className="card card-lg tilt-3 p-8 lg:justify-self-end max-w-sm w-full">
            <Label tone="orange" className="mb-3">Verse of the day</Label>
            <p className="script text-royal text-[26px] leading-snug">{verse.text}</p>
            <div className="mt-4 text-xs font-semibold text-muted">{verse.reference}</div>
          </div>
        </div>
      </section>

      {/* academy + give */}
      <section className="ground-ice">
        <div className="container-page py-20 grid gap-6 md:grid-cols-2">
          <a href={ACADEMY_URL} className="card-blue p-8 no-underline flex flex-col gap-4 min-h-[260px]">
            <Label tone="peach">PHANET Academy</Label>
            <h3 className="text-[32px] text-white">Learn, take the quiz, <Script peach>earn</Script> your certificate.</h3>
            <p className="text-sm text-white/85 max-w-sm">Video and audio courses, books and messages, free for everyone.</p>
            <span className="btn btn-white btn-sm mt-auto self-start">Open the Academy →</span>
          </a>
          <Link href="/give" className="card-orange p-8 no-underline flex flex-col gap-4 min-h-[260px]">
            <Label tone="white">Give</Label>
            <h3 className="text-[32px] text-white">Sow where you're <Script>planted</Script>.</h3>
            <p className="text-sm text-white/90 max-w-sm">Offering, tithe, the Sending fund and welfare. MTN MoMo, Telecel Cash or card. Receipt is instant.</p>
            <span className="btn btn-white btn-sm mt-auto self-start">Give now →</span>
          </Link>
        </div>
      </section>

      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
