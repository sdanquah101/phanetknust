import Link from "next/link";
import { Badge, Card, EmptyState, Label, Notice, PageHeader, StatCard, SubmitButton, Toast } from "@phanet/ui";
import { fmtDateTime, pct } from "@phanet/supabase/format";
import type { Attendance, Event } from "@phanet/supabase/types";
import { addDays, fullName, getLeaderContext, listMySheep } from "@/lib/queries";
import { NotLinked } from "@/components/bits";
import { markAttendanceAction } from "./actions";

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ event?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { session, leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Mark your sheep" title="Attend" script="ance" />
        <NotLinked />
      </>
    );
  }

  const now = new Date();
  const { data: eventRows } = await supabase
    .from("events")
    .select("*")
    .gte("starts_at", addDays(now, -14).toISOString())
    .lte("starts_at", addDays(now, 7).toISOString())
    .order("starts_at", { ascending: false });
  const events = (eventRows ?? []) as Event[];
  const nowIso = now.toISOString();
  const defaultEvent = events.find((e) => e.starts_at <= nowIso) ?? events[0];
  const event = events.find((e) => e.id === sp.event) ?? defaultEvent;

  const sheep = await listMySheep(supabase, leaderMemberId);
  let marks: Attendance[] = [];
  if (event && sheep.length) {
    const { data } = await supabase.from("attendance").select("*").eq("event_id", event.id).in("member_id", sheep.map((s) => s.id));
    marks = (data ?? []) as Attendance[];
  }
  const markByMember = new Map(marks.map((m) => [m.member_id, m]));
  const presentCount = marks.length;
  const mineCount = marks.filter((m) => m.marked_by === session.user.id).length;

  return (
    <>
      <PageHeader eyebrow="Mark your sheep" title="Attend" script="ance" />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      {events.length === 0 ? (
        <EmptyState title="No events nearby" body="There are no events in the last two weeks or the next seven days. The database team adds events." />
      ) : (
        <>
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Pick an event</Label>
            <div className="flex flex-wrap gap-2">
              {events.map((e) => (
                <Link key={e.id} href={`/attendance?event=${e.id}`} className="chip no-underline !text-[13px]" data-selected={event?.id === e.id}>
                  {e.title} <span className="opacity-70 font-medium">· {fmtDateTime(e.starts_at)}</span>
                </Link>
              ))}
            </div>
          </Card>

          {event && (
            <>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                <StatCard label="Present" value={`${presentCount}/${sheep.length}`} sub={event.title} tone="orange" />
                <StatCard label="Marked by you" value={mineCount} sub="this event" />
                <StatCard label="Turnout" value={`${pct(presentCount, sheep.length)}%`} sub="of your sheep" className="col-span-2 md:col-span-1" />
              </div>

              {sheep.length === 0 ? (
                <EmptyState title="No sheep assigned yet" body="Once members are assigned to you, mark them present here." />
              ) : (
                <form action={markAttendanceAction} className="flex flex-col gap-4">
                  <input type="hidden" name="event_id" value={event.id} />
                  <Card className="!p-2 md:!p-4 flex flex-col gap-2">
                    <div className="px-3 pt-2 flex items-center justify-between">
                      <Label tone="orange">{event.title}</Label>
                      <span className="text-xs text-muted">{fmtDateTime(event.starts_at)}{event.location ? ` · ${event.location}` : ""}</span>
                    </div>
                    <ul className="flex flex-col divide-y divide-ice">
                      {sheep.map((s) => {
                        const mark = markByMember.get(s.id);
                        const byOther = Boolean(mark && mark.marked_by !== session.user.id);
                        return (
                          <li key={s.id}>
                            <label className="flex items-center gap-3 px-3 py-3 cursor-pointer">
                              <input type="checkbox" className="check" name="present" value={s.id} defaultChecked={Boolean(mark)} disabled={byOther} />
                              {byOther && <input type="hidden" name="present" value={s.id} />}
                              <span className="flex-1 min-w-0">
                                <span className="block font-bold text-sm truncate">{fullName(s)}</span>
                                <span className="block text-[11px] text-muted">{s.member_code}{s.hall ? ` · ${s.hall}` : ""}</span>
                              </span>
                              {mark ? <Badge tone="mint">{byOther ? `Marked by ${mark.method}` : "Present"}</Badge> : <Badge tone="good">Absent</Badge>}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                  <Notice tone="ice">Tick everyone who was there and save. Marks made by ushers stay as they are; you can only undo your own.</Notice>
                  <div className="flex justify-end">
                    <SubmitButton pendingText="Saving…">Save attendance</SubmitButton>
                  </div>
                </form>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
