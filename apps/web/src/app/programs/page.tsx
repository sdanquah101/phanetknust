import type { Metadata } from "next";
import { Badge, Blobs, EmptyState, HeroCurve, Label } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProgramArt } from "@/components/ProgramArt";
import { getProgramViews, getSettings, getUpcomingEvents } from "@/lib/queries";

export const metadata: Metadata = { title: "Programs" };
export const revalidate = 60;

export default async function ProgramsPage() {
  const [{ theme, socials }, programs, events] = await Promise.all([getSettings(), getProgramViews(), getUpcomingEvents(12)]);
  const main = programs.find((p) => p.main) ?? programs[0];
  const rest = programs.filter((p) => p !== main);
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-14 pb-6">
          <Label tone="peach" className="mb-3">Programs</Label>
          <h1 className="t-h1 h3d">Where we gather</h1>
          <p className="t-lead mt-5 max-w-[46ch]">Every Saturday, every month, every semester. Come as you are.</p>
        </div>
        <div className="mt-8"><HeroCurve /></div>
      </section>

      <section className="ground-ice section !pt-6">
        <div className="container-page flex flex-col gap-12">
          {main && (
            <article id={main.slug} className="card p-5 md:p-6 grid gap-6 lg:grid-cols-[1.15fr_1fr] items-center scroll-mt-24">
              <ProgramArt slug={main.slug} name={main.name} cover={main.cover} icon={main.icon} sizes="(min-width: 1024px) 55vw, 100vw" priority />
              <div className="flex flex-col gap-3 lg:pr-4">
                <div className="flex flex-wrap gap-2"><Badge tone="orange">Main meeting</Badge><Badge tone="good">{main.schedule_label}</Badge></div>
                <h2 className="t-h2 text-deep">{main.name}</h2>
                <p className="t-lead text-deep">{main.tagline}</p>
                <p className="t-body text-muted">{main.description}</p>
                {main.location && <div className="t-small text-deep font-semibold">{main.location}</div>}
              </div>
            </article>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {rest.map((p) => (
              <article key={p.slug} id={p.slug} className="card p-5 flex flex-col gap-4 scroll-mt-24">
                <ProgramArt slug={p.slug} name={p.name} cover={p.cover} icon={p.icon} sizes="(min-width: 768px) 45vw, 100vw" />
                <div className="flex flex-col gap-2 px-1 pb-1">
                  <Badge tone="good" className="self-start">{p.schedule_label}</Badge>
                  <h3 className="t-h3 text-deep">{p.name}</h3>
                  <p className="t-body text-muted">{p.description}</p>
                  {p.location && <div className="t-small text-deep font-semibold">{p.location}</div>}
                </div>
              </article>
            ))}
          </div>

          <div>
            <h2 className="t-h2 text-deep mb-6">Coming up</h2>
            {events.length === 0 ? (
              <EmptyState title="No dates announced yet" body="Dates for the next all-night, retreat and convocation will appear here. The Gathering of the Adelphos meets every Saturday at 2:30pm." />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {events.map((e) => (
                  <li key={e.id} className="card p-6 flex gap-5 items-start">
                    <div className="card-blue rounded-[18px] px-4 py-3 text-center min-w-[76px]">
                      <div className="label-caps text-white">{new Date(e.starts_at).toLocaleDateString("en-GB", { month: "short" })}</div>
                      <div className="num-lg">{new Date(e.starts_at).getDate()}</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-deep">{e.title}</div>
                      <div className="t-small text-muted mt-1">{fmtDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ""}</div>
                      {e.description && <p className="t-small text-muted mt-2">{e.description}</p>}
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
