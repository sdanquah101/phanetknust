import Link from "next/link";
import { Badge, Card, EmptyState, Label, PageHeader, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDate, fmtTime } from "@phanet/supabase/format";
import type { Event, Program } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";

function EventTable({ events, programs }: { events: Event[]; programs: Map<string, string> }) {
  return (
    <Table>
      <thead>
        <tr><th>Event</th><th>When</th><th className="hidden xl:table-cell">Where</th><th>Visibility</th><th /></tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr key={e.id}>
            <td className="min-w-[15rem]">
              <div className="font-bold">{e.title}</div>
              <div className="text-xs text-muted">
                {[e.program_id ? programs.get(e.program_id) : null, e.academic_year, e.semester ? `Sem ${e.semester}` : null].filter(Boolean).join(" · ") || "—"}
              </div>
            </td>
            <td className="min-w-[9rem] text-sm">
              <div className="font-semibold whitespace-nowrap">{fmtDate(e.starts_at, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>
              <div className="text-xs text-muted whitespace-nowrap">{fmtTime(e.starts_at)}{e.ends_at ? ` – ${fmtTime(e.ends_at)}` : ""}</div>
            </td>
            <td className="hidden xl:table-cell text-sm max-w-[14rem]"><div className="truncate">{e.location ?? "—"}</div></td>
            <td>{e.is_public ? <Badge tone="good">Public</Badge> : <Badge tone="warn">Staff only</Badge>}</td>
            <td className="text-right"><Link href={`/events/${e.id}`} className="btn btn-blue btn-sm">Edit</Link></td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<FlashParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const [{ data: upcomingRows }, { data: pastRows }, { data: programRows }] = await Promise.all([
    supabase.from("events").select("*").gte("starts_at", nowIso).order("starts_at", { ascending: true }).limit(100),
    supabase.from("events").select("*").lt("starts_at", nowIso).order("starts_at", { ascending: false }).limit(50),
    supabase.from("programs").select("id, name"),
  ]);
  const upcoming = (upcomingRows ?? []) as Event[];
  const past = (pastRows ?? []) as Event[];
  const programs = new Map(((programRows ?? []) as Pick<Program, "id" | "name">[]).map((p) => [p.id, p.name]));

  return (
    <>
      <PageHeader eyebrow="Main site" title="What's" script="coming up" actions={<Link href="/events/new" className="btn btn-orange btn-sm">+ New event</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><Label tone="orange">Upcoming</Label><Badge tone="good">{upcoming.length}</Badge></div>
        {upcoming.length === 0 ? (
          <EmptyState title="Nothing scheduled." body="Add the next service, retreat or outreach so it shows on the site and ushers can mark attendance." action={<Link href="/events/new" className="btn btn-orange btn-sm">Add an event</Link>} />
        ) : (
          <EventTable events={upcoming} programs={programs} />
        )}
      </Card>
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between"><Label tone="orange">Past</Label><Badge tone="good">{past.length}</Badge></div>
        {past.length === 0 ? <EmptyState title="No past events yet." /> : <EventTable events={past} programs={programs} />}
      </Card>
    </>
  );
}
