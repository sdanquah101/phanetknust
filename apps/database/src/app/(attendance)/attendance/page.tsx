import Link from "next/link";
import { Card, EmptyState, Input, PageHeader } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDateTime } from "@phanet/supabase/format";
import { attendanceCounts, eventsForAttendance } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AttendanceIndex({ searchParams }: { searchParams: Promise<{ all?: string; q?: string }> }) {
  const sp = await searchParams;
  const all = sp.all === "1";
  const supabase = await createClient();
  const events = await eventsForAttendance(supabase, { all, q: sp.q });
  const counts = await attendanceCounts(supabase, events.map((e) => e.id));
  const now = Date.now();
  const today = events.filter((e) => Math.abs(new Date(e.starts_at).getTime() - now) < 36 * 3600000);

  return (
    <>
      <PageHeader eyebrow="Attendance" title="Who's" script="here?" />
      <Card className="!p-4">
        <form method="get" className="flex flex-col sm:flex-row gap-2 items-stretch">
          <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search older events by title…" aria-label="Search events" />
          <button type="submit" className="btn btn-blue btn-sm">Search</button>
          {all || sp.q ? (
            <Link href="/attendance" className="btn btn-ice btn-sm">Recent only</Link>
          ) : (
            <Link href="/attendance?all=1" className="btn btn-ice btn-sm">Show all events</Link>
          )}
        </form>
      </Card>

      {events.length === 0 ? (
        <EmptyState
          title={sp.q ? "No events match" : "No events in the next two weeks"}
          body={sp.q ? "Try a different title." : "Show all events to find an older one, or ask the database team to create the next service."}
          action={<Link href="/attendance?all=1" className="btn btn-ice btn-sm">Show all events</Link>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((e) => {
            const isToday = today.includes(e);
            return (
              <Link key={e.id} href={`/attendance/${e.id}`} className={`${isToday ? "card-blue" : "card"} p-5 no-underline flex items-center justify-between gap-4 hover:-translate-y-0.5 transition-transform`}>
                <div className="min-w-0">
                  {isToday && <div className="label-caps-peach mb-1">Happening now</div>}
                  <div className="font-extrabold text-base truncate">{e.title}</div>
                  <div className={`text-xs ${isToday ? "text-white/80" : "text-muted"}`}>{fmtDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ""}</div>
                </div>
                <div className="text-right flex-none">
                  <div className="num-lg">{counts.get(e.id) ?? 0}</div>
                  <div className={`text-[10px] font-bold tracking-[.14em] uppercase ${isToday ? "text-white/80" : "text-muted"}`}>present</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
