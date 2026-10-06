import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, ConfirmSubmit, Label, PageHeader, StatCard, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDateTime, fmtTime } from "@phanet/supabase/format";
import type { Program } from "@phanet/supabase/types";
import { eventAttendance, getEvent } from "@/lib/queries";
import { Group, Item } from "@/components/bits";
import { deleteEventAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const event = await getEvent(supabase, id);
  if (!event) notFound();
  const [marked, { data: program }] = await Promise.all([
    eventAttendance(supabase, id),
    event.program_id ? supabase.from("programs").select("id, name").eq("id", event.program_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const prog = program as Pick<Program, "id" | "name"> | null;
  const byMethod = marked.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.method]: (acc[r.method] ?? 0) + 1 }), {});
  const past = new Date(event.starts_at).getTime() < Date.now();

  return (
    <>
      <PageHeader
        eyebrow={fmtDateTime(event.starts_at)}
        title={event.title}
        actions={
          <>
            <ButtonLink href="/events" variant="ice" size="sm">← Events</ButtonLink>
            <ButtonLink href={`/events/${id}/edit`} variant="blue" size="sm">Edit</ButtonLink>
            <ButtonLink href={`/attendance/${id}`} size="sm">Mark attendance</ButtonLink>
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="Present" value={marked.length} tone="blue" />
        <StatCard label="By ushers" value={byMethod.usher ?? 0} />
        <StatCard label="By leaders" value={byMethod.leader ?? 0} />
        <StatCard label="Status" value={<span className="text-[22px]">{past ? "Held" : "Upcoming"}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Group title="Details">
            <Item label="Programme" value={prog?.name} />
            <Item label="Location" value={event.location} />
            <Item label="Starts" value={fmtDateTime(event.starts_at)} />
            <Item label="Ends" value={event.ends_at ? fmtDateTime(event.ends_at) : null} />
            <Item label="Academic year" value={event.academic_year} />
            <Item label="Semester" value={event.semester ? `Semester ${event.semester}` : null} />
            <Item label="Visibility" value={event.is_public ? "Public" : "Private"} />
          </Group>
          {event.description && <Card><Label tone="orange" className="mb-2">About</Label><p className="text-sm whitespace-pre-wrap">{event.description}</p></Card>}
          <Card tone="ice">
            <Label tone="orange" className="mb-2">Danger zone</Label>
            <p className="text-xs text-muted mb-3">Deleting the event also deletes its attendance records.</p>
            <form action={deleteEventAction}>
              <input type="hidden" name="id" value={event.id} />
              <ConfirmSubmit message={`Delete “${event.title}” and its attendance?`} variant="danger" size="sm">Delete event</ConfirmSubmit>
            </form>
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <Label tone="orange">Attendance</Label>
            <Link href={`/attendance/${id}`} className="text-xs font-bold text-royal">Mark more →</Link>
          </div>
          {marked.length === 0 ? (
            <p className="text-sm text-muted">No one marked yet.</p>
          ) : (
            <ul className="divide-y divide-ice max-h-[560px] overflow-y-auto">
              {marked.map((r) => {
                const name = r.members ? [r.members.first_name, r.members.other_names, r.members.last_name].filter(Boolean).join(" ") : "Member";
                return (
                  <li key={r.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link href={`/members/${r.member_id}`} className="font-bold truncate block">{name}</Link>
                      <div className="text-xs text-muted">{r.members?.member_code ?? ""}{r.marker_name ? ` · by ${r.marker_name}` : ""}</div>
                    </div>
                    <span className="text-xs text-muted whitespace-nowrap">{fmtTime(r.marked_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
