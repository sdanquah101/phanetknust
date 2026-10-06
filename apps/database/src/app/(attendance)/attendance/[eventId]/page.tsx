import { notFound } from "next/navigation";
import { ButtonLink, PageHeader } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { PORTAL_ROLES, canAccess } from "@phanet/supabase/roles";
import { fmtDateTime } from "@phanet/supabase/format";
import { eventAttendance, getEvent } from "@/lib/queries";
import { AttendanceMarker } from "@/components/AttendanceMarker";

export const dynamic = "force-dynamic";

export default async function MarkAttendancePage({ params }: { params: Promise<{ eventId: string }> }) {
  const [{ eventId }, session, supabase] = await Promise.all([params, getSession(), createClient()]);
  const event = await getEvent(supabase, eventId);
  if (!event || !session) notFound();
  const marked = await eventAttendance(supabase, eventId);
  const full = canAccess(session.roles, PORTAL_ROLES.database);

  return (
    <>
      <PageHeader
        eyebrow={`${fmtDateTime(event.starts_at)}${event.location ? ` · ${event.location}` : ""}`}
        title={event.title}
        actions={
          <>
            <ButtonLink href="/attendance" variant="ice" size="sm">← Events</ButtonLink>
            {full && <ButtonLink href={`/events/${eventId}`} variant="blue" size="sm">Event details</ButtonLink>}
          </>
        }
      />
      <div className="card-orange p-5 flex items-center justify-between gap-4">
        <div>
          <div className="label-caps-peach">Marked present</div>
          <div className="text-sm text-white/90">{full ? "Search, tap Present, or scan a member code." : "You can mark the members assigned to you."}</div>
        </div>
        <div className="num-xl">{marked.length}</div>
      </div>
      <AttendanceMarker eventId={eventId} marked={marked} markedIds={marked.map((m) => m.member_id)} userId={session.user.id} canUnmarkAll={full} />
    </>
  );
}
