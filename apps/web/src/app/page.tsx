import Image from "next/image";
import Link from "next/link";
import { ButtonLink, KenteCloth, KenteStrip, StoleRack, type StoleItem } from "@phanet/ui";
import { fmtDate, fmtTime } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WeaveIntro } from "@/components/WeaveIntro";
import { LoomGallery, type LoomPhoto } from "@/components/LoomGallery";
import { ProgramArt } from "@/components/ProgramArt";
import { getPrayerTeaser, getProgramViews, getSettings, getUpcomingEvents } from "@/lib/queries";
import { photo } from "@/content/photos";
import { ACADEMY_URL, PRAYERWALL_URL } from "@/lib/links";
import { PHOTO_QUALITY } from "@/lib/image";

export const revalidate = 60;

const STOLES: StoleItem[] = [
  { href: "/about", label: "Who we are", seed: 23, length: 0.6 },
  { href: "/programs", label: "Programs", seed: 31, length: 0.86 },
  { href: ACADEMY_URL, label: "Academy", seed: 47, length: 0.46, external: true },
  { href: PRAYERWALL_URL, label: "Prayer wall", seed: 59, length: 0.76, external: true },
  { href: "/give", label: "Give", seed: 71, length: 0.52 },
];

const PILLARS = [
  { title: "We intercede", body: "We stand before God for our campus, our nation and people who do not yet know Christ.", ref: "1 Timothy 2:1" },
  { title: "We avail ourselves", body: "When God wants someone to solve what we pray about, we want to be ready and willing.", ref: "Isaiah 6:8" },
  { title: "We grow together", body: "We study the Word, fellowship like family and look out for one another.", ref: "Acts 2:42" },
];

const INTRO = {
  weave: [{ src: "/photos/worship.webp", focus: 0.3 }, { src: "/photos/minister-mic.webp", focus: 0.3 }, { src: "/photos/question-mic.webp", focus: 0.45 }, { src: "/photos/three-friends.webp", focus: 0.35 }],
  final: { src: "/photos/friends-five.webp", focus: 0.55 },
};

const LOOM: LoomPhoto[] = [
  { ...photo("group-indoor"), focus: 0.45 },
  { ...photo("friends-five"), focus: 0.6 },
  { ...photo("worship"), focus: 0.3 },
  { ...photo("session-slides"), focus: 0.5 },
  { ...photo("minister-mic"), focus: 0.28 },
  { ...photo("group-night"), focus: 0.5 },
  { ...photo("three-friends"), focus: 0.35 },
  { ...photo("listening"), focus: 0.4 },
  { ...photo("group-hall"), focus: 0.45 },
  { ...photo("two-brothers"), focus: 0.3 },
].map(({ src, alt, focus, width, height }) => ({ src, alt, focus, width, height }));

export default async function Home() {
  const [settings, programs, events, prayer] = await Promise.all([getSettings(), getProgramViews(), getUpcomingEvents(4), getPrayerTeaser()]);
  const { theme, verse_of_day: verse, live, socials, about } = settings;
  const main = programs.find((p) => p.main) ?? programs[0];
  const portrait = photo("minister-greeting");

  return (
    <>
      <WeaveIntro weave={INTRO.weave} final={INTRO.final} kicker="Welcome to" title="PHANET KNUST" />
      <SiteHeader />

      {/* HOME: THE STOLES */}
      <section className="container-page grid gap-6 lg:gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] overflow-hidden">
        <div className="self-center pt-12 lg:py-20">
          <p className="kicker">Welcome to</p>
          <h1 className="home-name mt-1">
            <span className="home-name__title">Phanerosis Network</span>
            PHANET KNUST
          </h1>
          <p className="t-lead text-muted mt-6 max-w-[34ch]">{theme.tagline}</p>
          <p className="mt-4 font-semibold">
            {theme.year} theme: {theme.title} <span className="text-gold-text whitespace-nowrap">· {theme.reference}</span>
          </p>
          <p className="gold-lead mt-8">Choose a stole.</p>
        </div>
        <StoleRack items={STOLES} className="h-[72vh] max-h-[620px] lg:max-h-none lg:h-[min(86vh,820px)]" />
      </section>

      {/* THE WORD BEHIND THE NAME */}
      <section className="border-y border-line">
        <div className="container-page section flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <p className="t-word m-0">phanerōsis</p>
          <p className="t-lead m-0 max-w-[36ch]">
            Greek, noun. A manifestation; a making visible of what was hidden. It is where our name comes from.
            <cite className="block not-italic mt-3 t-ref">“The manifestation of the Spirit is given to every man to profit withal.” 1 Corinthians 12:7</cite>
          </p>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="container-page section grid gap-12 lg:gap-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start">
        <figure className="story-figure lg:sticky lg:top-24 max-w-[520px]">
          <KenteStrip seed={23} className="story-figure__stole" />
          <Image quality={PHOTO_QUALITY} src={portrait.src} alt={portrait.alt} width={portrait.width} height={portrait.height} sizes="(min-width: 1024px) 40vw, 90vw" className="object-[50%_25%]" />
        </figure>
        <div className="max-w-[62ch]">
          <h2 className="t-h2 text-black">We pray, and we make ourselves available.</h2>
          <p className="t-lead text-black mt-8">{about.intro}</p>
          <p className="t-body mt-5">{about.idea}</p>
          <figure className="mt-8 border-l-4 border-gold pl-5">
            <blockquote className="t-quote">“I exhort therefore, that, first of all, supplications, prayers, intercessions, and giving of thanks, be made for all men.”</blockquote>
            <figcaption className="t-ref mt-3">1 Timothy 2:1 · KJV</figcaption>
          </figure>
          <dl className="facts mt-10">
            <dt>Where</dt><dd>KNUST campus, Kumasi</dd>
            {main && <><dt>We meet</dt><dd>{main.name}, {main.schedule_label}</dd></>}
            <dt>Every month</dt><dd>Night of Solemnities, an all-night of prayer</dd>
            <dt>This year</dt><dd>{theme.title} ({theme.reference})</dd>
          </dl>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/about" variant="black">More about PHANET</ButtonLink>
            <a href={live.url} target="_blank" rel="noreferrer" className="btn btn-ice">Watch live on Saturdays</a>
          </div>
        </div>
      </section>

      {/* THREE THINGS */}
      <section className="bg-cream">
        <div className="container-page section">
          <h2 className="t-h2 max-w-[16ch]">What we give ourselves to</h2>
          <ul className="gold-list mt-12 grid gap-10 md:grid-cols-3">
            {PILLARS.map((p) => (
              <li key={p.title}>
                <h3 className="t-h3">{p.title}</h3>
                <p className="t-body text-muted mt-3">{p.body}</p>
                <p className="t-ref mt-3">{p.ref}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LIFE AT PHANET: THE LOOM */}
      <section className="container-page section">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <h2 className="t-h2 max-w-[14ch]">Come as you are. Leave as family.</h2>
          <ButtonLink href="/gallery" variant="ice" size="sm">See every photo</ButtonLink>
        </div>
        <LoomGallery photos={LOOM} />
      </section>

      {/* WHERE WE GATHER */}
      {(programs.length > 0 || events.length > 0) && (
        <section className="border-t border-line">
          <div className="container-page section">
            <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
              <h2 className="t-h2">Where we gather</h2>
              <ButtonLink href="/programs" variant="ice" size="sm">All programs</ButtonLink>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {programs.slice(0, 3).map((p) => (
                <Link key={p.slug} href={`/programs#${p.slug}`} className="group no-underline text-deep flex flex-col gap-4">
                  <div className="relative">
                    <ProgramArt slug={p.slug} name={p.name} cover={p.cover} icon={p.icon} sizes="(min-width: 768px) 30vw, 100vw" />
                    <span className="absolute left-4 -bottom-4 bg-white border-2 border-black px-3 py-1.5 font-bold text-[15px] group-hover:bg-black group-hover:text-white transition-colors">{p.schedule_label}</span>
                  </div>
                  <div className="pt-4">
                    <h3 className="t-h3">{p.name}</h3>
                    <p className="t-small text-muted mt-2">{p.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
            {events.length > 0 && (
              <div className="mt-16">
                <h3 className="t-h3">Coming up</h3>
                <dl className="facts mt-5">
                  {events.map((e) => (
                    <div key={e.id} className="contents">
                      <dt>{fmtDate(e.starts_at, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(e.starts_at)}</dt>
                      <dd>{e.title}{e.location ? <span className="text-muted font-normal">, {e.location}</span> : null}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      {/* PRAYER WALL: on dark cloth */}
      <section className="ground-blue">
        <KenteCloth seed={41} stripWidth={96} className="absolute inset-0 h-full -z-10" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_50%,rgba(8,8,8,.62),rgba(8,8,8,.86)_75%)]" aria-hidden />
        <div className="container-page section grid gap-12 lg:grid-cols-[1.1fr_.9fr] items-center">
          <div>
            <p className="kicker text-peach">Prayer wall</p>
            <h2 className="t-h1 mt-2">{prayer.count > 0 ? `${prayer.count.toLocaleString()} people are praying with you.` : "We are praying with you."}</h2>
            <p className="t-lead mt-6 max-w-[40ch] text-white/85">Share what you are carrying, without your name. Keep your code, and come back to tell us how God answered.</p>
            {prayer.topics.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {prayer.topics.map((t) => <span key={t.id} className="pill pill-glass">{t.topic}</span>)}
              </div>
            )}
            <a href={PRAYERWALL_URL} className="btn btn-orange btn-lg mt-8">Add a prayer request</a>
          </div>
          <figure className="card-gold p-8 md:p-10 text-deep max-w-md lg:justify-self-end">
            <p className="label-caps-orange">Verse of the day</p>
            <blockquote className="t-quote mt-4">{verse.text}</blockquote>
            <figcaption className="t-ref mt-4">{verse.reference}</figcaption>
          </figure>
        </div>
      </section>

      {/* ACADEMY + GIVE */}
      <section className="bg-cream">
        <div className="container-page section grid gap-10 lg:grid-cols-2">
          <a href={ACADEMY_URL} className="no-underline text-deep bg-white border-t-[6px] border-royal p-8 md:p-12 flex flex-col gap-5 group">
            <p className="kicker">PHANET Academy</p>
            <h2 className="t-h2">Learn, take the quiz, get your certificate.</h2>
            <p className="t-body text-muted max-w-[44ch]">Free video courses in short lessons, with a quick quiz after each one. Books and messages to download too.</p>
            <span className="btn btn-blue mt-auto self-start">Open the Academy</span>
          </a>
          <Link href="/give" className="no-underline text-deep bg-white border-t-[6px] border-gold p-8 md:p-12 flex flex-col gap-5">
            <p className="kicker">Give</p>
            <h2 className="t-h2">Sow where you are planted.</h2>
            <p className="t-body text-muted max-w-[44ch]">Offering, tithe, the Sending fund and welfare. MTN MoMo, Telecel Cash or card, with an instant receipt.</p>
            <span className="btn btn-black mt-auto self-start">Give now</span>
          </Link>
        </div>
      </section>

      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
