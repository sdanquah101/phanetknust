import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, ConfirmSubmit, Field, Input, Label, Notice, PageHeader, SubmitButton, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { fmtDate, fmtDateTime } from "@phanet/supabase/format";
import { memberName } from "@phanet/supabase/types";
import { getMember, getMemberLite, memberAttendance, memberFollowupCount } from "@/lib/queries";
import { photoUrl } from "@/lib/photo";
import { Group, Item, MemberAvatarLarge, StatusBadge } from "@/components/bits";
import { deleteMemberAction, linkAccountAction, unlinkAccountAction, updatePhotoAction } from "../actions";

export const dynamic = "force-dynamic";

const cap = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : null);

export default async function MemberPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp, session, supabase] = await Promise.all([params, searchParams, getSession(), createClient()]);
  const member = await getMember(supabase, id);
  if (!member) notFound();
  const [photo, leader, history, followups] = await Promise.all([
    photoUrl(supabase, member.photo_path),
    member.leader_id ? getMemberLite(supabase, member.leader_id) : Promise.resolve(null),
    memberAttendance(supabase, id, 20),
    memberFollowupCount(supabase, id),
  ]);
  const name = memberName(member);
  const isAdmin = session?.roles.includes("admin") ?? false;

  return (
    <>
      <PageHeader
        eyebrow={member.member_code}
        title={name}
        actions={
          <>
            <ButtonLink href="/members" variant="ice" size="sm">← Members</ButtonLink>
            <ButtonLink href={`/members/${id}/edit`} variant="blue" size="sm">Edit</ButtonLink>
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center text-center gap-4">
            <MemberAvatarLarge name={name} src={photo} />
            <div>
              <div className="text-xl font-extrabold">{name}</div>
              <div className="text-sm text-muted">{[member.programme, member.year_of_study].filter(Boolean).join(" · ") || "Programme not set"}</div>
            </div>
            <StatusBadge status={member.membership_status} />
            <form action={updatePhotoAction} className="w-full flex flex-col gap-2">
              <input type="hidden" name="id" value={member.id} />
              <Field label="Change photo">
                <input name="photo" type="file" accept="image/*" required className="input !py-2.5 text-xs" />
              </Field>
              <SubmitButton variant="ice" size="sm" pendingText="Uploading…">Upload photo</SubmitButton>
            </form>
          </Card>

          <Card>
            <Label tone="orange" className="mb-3">Leader</Label>
            {leader ? (
              <Link href={`/leaders/${leader.id}`} className="option-row no-underline">
                <span className="avatar">{memberName(leader).split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("")}</span>
                <span className="min-w-0">
                  <span className="block truncate">{memberName(leader)}</span>
                  <span className="block text-xs text-muted font-medium">{leader.member_code}</span>
                </span>
              </Link>
            ) : (
              <p className="text-sm text-muted">No leader assigned yet. <Link href={`/members/${id}/edit`} className="text-royal font-semibold">Assign one →</Link></p>
            )}
          </Card>

          <Card>
            <Label tone="orange" className="mb-3">Login account</Label>
            {member.user_id ? (
              <div className="flex flex-col gap-3">
                <Notice tone="mint">Linked to a login account.</Notice>
                {isAdmin && (
                  <form action={unlinkAccountAction}>
                    <input type="hidden" name="id" value={member.id} />
                    <ConfirmSubmit message="Unlink this member's login account?" variant="ice" size="sm">Unlink</ConfirmSubmit>
                  </form>
                )}
              </div>
            ) : isAdmin ? (
              <form action={linkAccountAction} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={member.id} />
                <Field label="Account email" hint="They must have signed in at least once."><Input name="email" type="email" required placeholder="ama@st.knust.edu.gh" /></Field>
                <SubmitButton variant="blue" size="sm" pendingText="Linking…">Link account</SubmitButton>
              </form>
            ) : (
              <Notice tone="ice">Not linked. Ask the admin to link this member's login account.</Notice>
            )}
          </Card>

          <Card tone="ice">
            <Label tone="orange" className="mb-2">Danger zone</Label>
            <p className="text-xs text-muted mb-3">Deleting removes the member, their photo and attendance history.</p>
            <form action={deleteMemberAction}>
              <input type="hidden" name="id" value={member.id} />
              <ConfirmSubmit message={`Delete ${name}? This cannot be undone.`} variant="danger" size="sm">Delete member</ConfirmSubmit>
            </form>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Group title="Personal">
            <Item label="First name" value={member.first_name} />
            <Item label="Last name" value={member.last_name} />
            <Item label="Other names" value={member.other_names} />
            <Item label="Gender" value={cap(member.gender)} />
            <Item label="Date of birth" value={member.dob ? fmtDate(member.dob) : null} />
            <Item label="Member since" value={member.joined_at ? fmtDate(member.joined_at) : null} />
          </Group>
          <Group title="Contact">
            <Item label="Phone" value={member.phone ? <a href={`tel:${member.phone}`}>{member.phone}</a> : null} />
            <Item label="WhatsApp" value={member.whatsapp ? <a href={`https://wa.me/${member.whatsapp.replace(/\D/g, "")}`}>{member.whatsapp}</a> : null} />
            <Item label="Email" value={member.email ? <a href={`mailto:${member.email}`}>{member.email}</a> : null} />
            <Item label="Hometown" value={member.hometown} />
            <Item label="Region" value={member.region} />
          </Group>
          <Group title="Campus">
            <Item label="Programme" value={member.programme} />
            <Item label="College" value={member.college} />
            <Item label="Year of study" value={member.year_of_study} />
            <Item label="Hall / hostel" value={member.hall} />
            <Item label="Room" value={member.room} />
            <Item label="Residence type" value={cap(member.residence_type)} />
          </Group>
          <Group title="Church">
            <Item label="Status" value={<StatusBadge status={member.membership_status} />} />
            <Item label="Joined" value={member.joined_at ? fmtDate(member.joined_at) : null} />
            <Item label="Baptized" value={member.baptized === true ? "Yes" : member.baptized === false ? "No" : null} />
            <Item label="Department" value={member.department} />
            <Item label="Follow-ups logged" value={String(followups)} />
            <Item label="Notes" value={member.notes} />
          </Group>
          <Group title="Emergency">
            <Item label="Contact name" value={member.emergency_contact_name} />
            <Item label="Contact phone" value={member.emergency_contact_phone ? <a href={`tel:${member.emergency_contact_phone}`}>{member.emergency_contact_phone}</a> : null} />
          </Group>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <Label tone="orange">Attendance · last 20</Label>
              <span className="num-lg">{history.length}</span>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-muted">No attendance recorded yet.</p>
            ) : (
              <ul className="divide-y divide-ice">
                {history.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      {a.events ? <Link href={`/events/${a.events.id}`} className="font-bold truncate block">{a.events.title}</Link> : <span className="font-bold">Event</span>}
                      <div className="text-xs text-muted">{fmtDateTime(a.events?.starts_at ?? a.marked_at)}</div>
                    </div>
                    <span className="badge badge-good">{a.method}</span>
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
