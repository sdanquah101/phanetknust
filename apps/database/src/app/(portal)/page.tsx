import Link from "next/link";
import { ButtonLink, Card, EmptyState, Label, PageHeader, StatCard } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { fmtDateTime, greeting } from "@phanet/supabase/format";
import { getDashboard } from "@/lib/queries";
import { academicYearLabel } from "@/lib/constants";
import { Bars } from "@/components/bits";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const d = await getDashboard(supabase);
  const genderTotal = d.gender.male + d.gender.female + d.gender.unknown;
  const pctOf = (n: number) => (genderTotal ? Math.round((n / genderTotal) * 100) : 0);

  return (
    <>
      <PageHeader
        eyebrow={`${greeting(session?.profile?.full_name)} · ${academicYearLabel()}`}
        title="Dashboard"
        script="today"
        actions={
          <>
            <ButtonLink href="/members/new" size="sm">+ Add member</ButtonLink>
            <ButtonLink href="/attendance" variant="blue" size="sm">Mark attendance</ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Total members" value={d.total} tone="blue" />
        <StatCard label="Active" value={d.active} sub={d.total ? `${Math.round((d.active / d.total) * 100)}% of members` : undefined} />
        <StatCard label="New this semester" value={d.newThisSemester} sub="Joined since 1 Aug" tone="orange" />
        <StatCard label="Alumni" value={d.alumni} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Label tone="orange" className="mb-4">By hall · top 8</Label>
          <Bars rows={d.byHall} total={d.active} />
        </Card>
        <Card>
          <Label tone="orange" className="mb-4">By programme · top 8</Label>
          <Bars rows={d.byProgramme} total={d.active} orange />
        </Card>
        <Card>
          <Label tone="orange" className="mb-4">By year of study</Label>
          <Bars rows={d.byYear} total={d.active} />
        </Card>
        <Card>
          <Label tone="orange" className="mb-4">Gender split</Label>
          {genderTotal === 0 ? (
            <p className="text-sm text-muted">No active members yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex h-5 w-full rounded-pill overflow-hidden bg-ice" role="img" aria-label={`Male ${pctOf(d.gender.male)}%, female ${pctOf(d.gender.female)}%`}>
                <div className="bg-royal h-full" style={{ width: `${pctOf(d.gender.male)}%` }} />
                <div className="bg-tangerine h-full" style={{ width: `${pctOf(d.gender.female)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="inline-block w-2.5 h-2.5 rounded-full bg-royal mr-2" />Male <b>{d.gender.male}</b> <span className="text-muted">· {pctOf(d.gender.male)}%</span></div>
                <div><span className="inline-block w-2.5 h-2.5 rounded-full bg-tangerine mr-2" />Female <b>{d.gender.female}</b> <span className="text-muted">· {pctOf(d.gender.female)}%</span></div>
                <div><span className="inline-block w-2.5 h-2.5 rounded-full bg-ice mr-2" />Unknown <b>{d.gender.unknown}</b></div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Label tone="orange">Upcoming events</Label>
            <Link href="/events" className="text-xs font-bold text-royal">All events →</Link>
          </div>
          {d.upcoming.length === 0 ? (
            <EmptyState title="Nothing scheduled" body="Create the next programme so ushers can mark attendance." action={<ButtonLink href="/events/new" size="sm" variant="blue">+ New event</ButtonLink>} />
          ) : (
            <ul className="divide-y divide-ice">
              {d.upcoming.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/events/${e.id}`} className="font-bold text-sm truncate block">{e.title}</Link>
                    <div className="text-xs text-muted">{fmtDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ""}</div>
                  </div>
                  <Link href={`/attendance/${e.id}`} className="btn btn-ice btn-sm">Mark</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Label tone="orange">Latest attendance</Label>
            <Link href="/events?tab=past" className="text-xs font-bold text-royal">Past events →</Link>
          </div>
          {d.latest.length === 0 ? (
            <p className="text-sm text-muted">No events have happened yet.</p>
          ) : (
            <ul className="divide-y divide-ice">
              {d.latest.map((e) => (
                <li key={e.event_id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/events/${e.event_id}`} className="font-bold text-sm truncate block">{e.title}</Link>
                    <div className="text-xs text-muted">{fmtDateTime(e.starts_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="num-lg">{e.attendees}</div>
                    <div className="text-[10px] font-bold tracking-[.14em] uppercase text-muted">present</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
