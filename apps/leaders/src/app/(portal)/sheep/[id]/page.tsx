import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Badge, ButtonLink, Card, EmptyState, Label, PageHeader, Toast } from "@phanet/ui";
import { fmtDate, fmtDateTime } from "@phanet/supabase/format";
import type { Attendance, Event, Followup } from "@phanet/supabase/types";
import { fullName, getLeaderContext, getMySheep, listMyFollowups, whatsappLink } from "@/lib/queries";
import { KindBadge, NotLinked } from "@/components/bits";
import { FollowupForm } from "@/components/followup-form";
import { createFollowupAction } from "../../followups/actions";

type AttendanceRow = Attendance & { events: Pick<Event, "id" | "title" | "starts_at" | "location"> | null };

export default async function SheepProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="My sheep" title="Member" />
        <NotLinked />
      </>
    );
  }
  const m = await getMySheep(supabase, leaderMemberId, id);
  if (!m) notFound();

  const [followups, attendanceRes] = await Promise.all([
    listMyFollowups(supabase, leaderMemberId, { sheepId: m.id }),
    supabase.from("attendance").select("*, events(id, title, starts_at, location)").eq("member_id", m.id).order("marked_at", { ascending: false }).limit(10),
  ]);
  const attendance = ((attendanceRes.data ?? []) as AttendanceRow[]).sort((a, b) => (b.events?.starts_at ?? b.marked_at).localeCompare(a.events?.starts_at ?? a.marked_at));

  const name = fullName(m);
  const wa = whatsappLink(m);
  const now = new Date();
  const birthdayThisMonth = m.dob ? new Date(m.dob).getMonth() === now.getMonth() : false;

  const facts: [string, string | null][] = [
    ["Programme", m.programme],
    ["College", m.college],
    ["Year", m.year_of_study],
    ["Hall", m.hall],
    ["Room", m.room],
    ["Hometown", [m.hometown, m.region].filter(Boolean).join(", ") || null],
    ["Birthday", m.dob ? fmtDate(m.dob, { day: "numeric", month: "long" }) : null],
    ["Joined", m.joined_at ? fmtDate(m.joined_at) : null],
    ["Status", m.membership_status],
  ];

  return (
    <>
      <PageHeader
        eyebrow="My sheep"
        title={name}
        actions={
          <>
            <ButtonLink href={`/followups?sheep=${m.id}`} size="sm" variant="ice">All follow-ups</ButtonLink>
            <ButtonLink href={`/transfers/new?sheep=${m.id}`} size="sm" variant="outline-blue">Request transfer</ButtonLink>
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />
      <Link href="/sheep" className="text-sm font-bold text-royal no-underline -mt-2">← Back to my sheep</Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-4 lg:col-span-1">
          <div className="flex items-center gap-4">
            <Avatar name={name} className="!w-16 !h-16 !text-lg" peach />
            <div>
              <div className="font-bold text-lg leading-tight">{name}</div>
              <div className="text-xs text-muted">{m.member_code}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {birthdayThisMonth && <Badge tone="orange">Birthday this month</Badge>}
                {m.baptized && <Badge tone="mint">Baptized</Badge>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {m.phone && <a href={`tel:${m.phone}`} className="btn btn-blue btn-sm">Call {m.phone}</a>}
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-ice btn-sm">WhatsApp</a>}
            {m.email && <a href={`mailto:${m.email}`} className="btn btn-ice btn-sm">Email</a>}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt className="label-caps text-muted !text-[10px]">{k}</dt>
                <dd className="font-semibold capitalize">{v}</dd>
              </div>
            ))}
          </dl>
          {m.notes && (
            <div>
              <Label>Notes</Label>
              <p className="text-sm text-muted mt-1 whitespace-pre-line">{m.notes}</p>
            </div>
          )}
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <Label tone="orange">Log a follow-up</Label>
            <FollowupForm action={createFollowupAction} sheepId={m.id} back={`/sheep/${m.id}`} submitLabel="Log follow-up" />
          </Card>

          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label tone="orange">Follow-up timeline</Label>
              <span className="text-xs text-muted">{followups.length} total</span>
            </div>
            {followups.length === 0 ? (
              <EmptyState title="No follow-ups yet" body="Log your first call or visit above." />
            ) : (
              <ol className="flex flex-col divide-y divide-ice">
                {followups.map((f: Followup) => (
                  <li key={f.id} className="py-4 flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <KindBadge kind={f.kind} />
                      <span className="text-xs text-muted">{fmtDateTime(f.occurred_at)}</span>
                      <Link href={`/followups/${f.id}`} className="ml-auto text-xs font-bold text-royal no-underline">Open →</Link>
                    </div>
                    <p className="text-sm font-medium">{f.summary}</p>
                    {(f.needs || f.prayer_points) && (
                      <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted">
                        {f.needs && <div><span className="font-bold text-deep">Needs:</span> {f.needs}</div>}
                        {f.prayer_points && <div><span className="font-bold text-deep">Prayer:</span> {f.prayer_points}</div>}
                      </div>
                    )}
                    {f.next_action && (
                      <div className="text-xs"><span className="badge badge-good mr-2">Next</span>{f.next_action}{f.next_action_date ? ` · ${fmtDate(f.next_action_date)}` : ""}</div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <Label tone="orange">Attendance · last 10</Label>
            {attendance.length === 0 ? (
              <EmptyState title="No attendance recorded" body="Mark them present from the Attendance page." />
            ) : (
              <ul className="flex flex-col divide-y divide-ice">
                {attendance.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold">{a.events?.title ?? "Event"}</div>
                      <div className="text-xs text-muted">{fmtDateTime(a.events?.starts_at ?? a.marked_at)}{a.events?.location ? ` · ${a.events.location}` : ""}</div>
                    </div>
                    <Badge tone="mint">Present</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
