import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader, Table, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDateTime } from "@phanet/supabase/format";
import { attendanceCounts, listEvents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ tab?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "past" ? "past" : "upcoming";
  const supabase = await createClient();
  const events = await listEvents(supabase, tab);
  const counts = await attendanceCounts(supabase, events.map((e) => e.id));

  return (
    <>
      <PageHeader eyebrow="Programmes & services" title="Events" script="gather" actions={<ButtonLink href="/events/new" size="sm">+ New event</ButtonLink>} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="flex gap-2">
        <Link href="/events" className="chip" data-selected={tab === "upcoming"}>Upcoming</Link>
        <Link href="/events?tab=past" className="chip" data-selected={tab === "past"}>Past</Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title={tab === "upcoming" ? "No upcoming events" : "No past events"}
          body={tab === "upcoming" ? "Add the next service or programme so attendance can be marked." : "Past events will show here with their attendance."}
          action={tab === "upcoming" ? <ButtonLink href="/events/new" size="sm" variant="blue">+ New event</ButtonLink> : undefined}
        />
      ) : (
        <Card className="!p-4 md:!p-6">
          <Table>
            <thead><tr><th>Event</th><th>When</th><th>Location</th><th>Visibility</th><th>Present</th><th></th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td><Link href={`/events/${e.id}`} className="font-bold">{e.title}</Link>{e.academic_year && <div className="text-xs text-muted">{e.academic_year}{e.semester ? ` · Sem ${e.semester}` : ""}</div>}</td>
                  <td className="text-muted whitespace-nowrap">{fmtDateTime(e.starts_at)}</td>
                  <td className="text-muted">{e.location ?? "—"}</td>
                  <td><span className={`badge ${e.is_public ? "badge-good" : "badge-warn"}`}>{e.is_public ? "Public" : "Private"}</span></td>
                  <td className="font-bold">{counts.get(e.id) ?? 0}</td>
                  <td className="text-right"><Link href={`/attendance/${e.id}`} className="btn btn-ice btn-sm">Mark</Link></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
