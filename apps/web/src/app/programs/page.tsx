import type { Metadata } from "next";
import { Badge, Blobs, EmptyState, Label, Script, StageDisc, Ticker } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPrograms, getSettings, getUpcomingEvents } from "@/lib/queries";

export const metadata: Metadata = { title: "Programs" };
export const revalidate = 60;

export default async function ProgramsPage() {
  const [{ theme, socials, live }, programs, events] = await Promise.all([getSettings(), getPrograms(), getUpcomingEvents(12)]);
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-14 pb-6">
          <Label tone="peach" className="mb-3">Programs</Label>
          <h1 className="h3d text-[48px] md:text-[72px]">Where we <Script peach className="text-[1.2em]">gather</Script></h1>
          <p className="mt-6 text-white/90 max-w-xl">Every week, all semester. Come as you are. {live.label.replace("·", "at")} is our main night.</p>
        </div>
        <StageDisc className="mt-10" />
      </section>
      <div className="stage"><Ticker items={[`${theme.title} · ${theme.reference}`, `${theme.title} · ${theme.reference}`]} /></div>

      <section className="ground-ice -mt-px">
        <div className="container-page py-16 flex flex-col gap-12">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <article key={p.id} id={p.slug} className="card p-7 flex flex-col gap-3 scroll-mt-24">
                {p.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_url} alt="" className="rounded-[18px] aspect-[16/9] object-cover -mt-1 mb-2" />
                )}
                <div className="flex items-center justify-between">
                  <Badge tone="good">{p.schedule_label}</Badge>
                  <span className="dot-orange" style={{ width: 20, height: 20 }} />
                </div>
                <h2 className="text-2xl text-royal">{p.name}</h2>
                {p.tagline && <p className="font-semibold text-deep/80 text-sm">{p.tagline}</p>}
                {p.description && <p className="text-sm text-muted">{p.description}</p>}
                {p.location && <div className="mt-auto pt-2 text-xs font-bold tracking-wide uppercase text-muted">{p.location}</div>}
              </article>
            ))}
            {programs.length === 0 && <EmptyState className="md:col-span-3" title="Programs are on the way" body="The team is adding this semester's schedule." />}
          </div>

          <div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-[32px] md:text-[40px] text-deep">Coming <span className="script text-royal text-[1.15em]">up</span></h2>
            </div>
            {events.length === 0 ? (
              <EmptyState title="No special events yet" body="Our weekly programs run as usual. Special events will be listed here." />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {events.map((e) => (
                  <li key={e.id} className="card p-6 flex gap-5 items-start">
                    <div className="card-blue rounded-[18px] px-4 py-3 text-center min-w-[72px]">
                      <div className="label-caps text-white/80">{new Date(e.starts_at).toLocaleDateString("en-GB", { month: "short" })}</div>
                      <div className="num-lg">{new Date(e.starts_at).getDate()}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-extrabold text-lg text-royal">{e.title}</div>
                      <div className="text-xs font-semibold text-muted mt-1">{fmtDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ""}</div>
                      {e.description && <p className="text-sm text-muted mt-2">{e.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
