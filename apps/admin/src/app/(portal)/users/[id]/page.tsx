import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Badge, Card, ConfirmSubmit, Label, Notice, PageHeader, SubmitButton } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDate, fmtDateTime } from "@phanet/supabase/format";
import type { Role } from "@phanet/supabase/roles";
import { memberName, type Member, type Profile, type UserRole } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { adminClient, hasServiceRole, NO_SERVICE_ROLE } from "@/lib/admin";
import { isUuid } from "@/lib/form";
import { RoleCheckboxes } from "../RoleCheckboxes";
import { deleteUser, sendPasswordReset, syncRoles, unlinkMember } from "../actions";
import { MemberLinker } from "./MemberLinker";

export default async function UserPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const supabase = await createClient();
  const [{ data: profileRow }, { data: roleRows }, { data: memberRow }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("user_roles").select("*").eq("user_id", id),
    supabase.from("members").select("*").eq("user_id", id).maybeSingle(),
  ]);
  const profile = profileRow as Profile | null;
  if (!profile) notFound();
  const roles = ((roleRows ?? []) as UserRole[]).map((r) => r.role as Role);
  let member = memberRow as Member | null;
  if (!member && profile.member_id) {
    const { data } = await supabase.from("members").select("*").eq("id", profile.member_id).maybeSingle();
    member = (data as Member | null) ?? null;
  }
  let lastSignIn: string | null = null;
  let confirmed: boolean | null = null;
  const admin = adminClient();
  if (admin) {
    try {
      const { data } = await admin.auth.admin.getUserById(id);
      lastSignIn = data.user?.last_sign_in_at ?? null;
      confirmed = Boolean(data.user?.email_confirmed_at);
    } catch { /* fine without */ }
  }

  return (
    <>
      <PageHeader
        eyebrow="Users & access"
        title={profile.full_name ?? profile.email ?? "Account"}
        actions={<Link href="/users" className="btn btn-ice btn-sm">← All users</Link>}
      />
      <Flash ok={sp.ok} error={sp.error} />
      {!hasServiceRole() && <Notice tone="peach">{NO_SERVICE_ROLE}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] items-start">
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={profile.full_name ?? profile.email} src={profile.avatar_url} className="!w-14 !h-14 !text-lg" />
              <div className="min-w-0">
                <div className="font-bold text-lg truncate">{profile.full_name ?? "—"}</div>
                <div className="text-sm text-muted truncate">{profile.email ?? "—"}</div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="label-caps text-muted">Phone</dt><dd className="font-semibold">{profile.phone ?? "—"}</dd></div>
              <div><dt className="label-caps text-muted">Joined</dt><dd className="font-semibold">{fmtDate(profile.created_at)}</dd></div>
              <div><dt className="label-caps text-muted">Last sign-in</dt><dd className="font-semibold">{lastSignIn ? fmtDateTime(lastSignIn) : "—"}</dd></div>
              <div><dt className="label-caps text-muted">Email</dt><dd>{confirmed === null ? <span className="text-muted">—</span> : confirmed ? <Badge tone="mint">Confirmed</Badge> : <Badge tone="warn">Unconfirmed</Badge>}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-ice">
              <form action={sendPasswordReset}>
                <input type="hidden" name="user_id" value={profile.id} />
                <input type="hidden" name="email" value={profile.email ?? ""} />
                <SubmitButton variant="ice" size="sm" pendingText="Sending…">Send password reset</SubmitButton>
              </form>
              <form action={deleteUser}>
                <input type="hidden" name="user_id" value={profile.id} />
                <ConfirmSubmit variant="danger" size="sm" message="Delete this account? They will lose access to every portal. Their member record stays in the database.">Delete user</ConfirmSubmit>
              </form>
            </div>
          </Card>

          <Card className="flex flex-col gap-4">
            <div>
              <Label tone="orange">Member record</Label>
              <p className="text-sm text-muted mt-1">Linking lets portals know which member this account belongs to (leaders see their sheep, dues, attendance).</p>
            </div>
            {member ? (
              <div className="card-ice p-4 flex items-center gap-3">
                <Avatar name={memberName(member)} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold truncate">{memberName(member)}</div>
                  <div className="text-xs text-muted truncate">{member.member_code}{member.hall ? ` · ${member.hall}` : ""}{member.programme ? ` · ${member.programme}` : ""}</div>
                </div>
                <form action={unlinkMember}>
                  <input type="hidden" name="user_id" value={profile.id} />
                  <input type="hidden" name="member_id" value={member.id} />
                  <ConfirmSubmit variant="ice" size="sm" message="Unlink this member record from the account?">Unlink</ConfirmSubmit>
                </form>
              </div>
            ) : (
              <MemberLinker userId={profile.id} />
            )}
          </Card>
        </div>

        <Card className="flex flex-col gap-4">
          <div>
            <Label tone="orange">Portal access</Label>
            <h2 className="text-xl mt-1">Roles</h2>
            <p className="text-sm text-muted mt-1">Tick the portals this person may enter. Administrators can go everywhere.</p>
          </div>
          <form action={syncRoles} className="flex flex-col gap-4">
            <input type="hidden" name="user_id" value={profile.id} />
            <RoleCheckboxes selected={roles} idPrefix="edit" />
            <div><SubmitButton pendingText="Saving…">Save roles</SubmitButton></div>
          </form>
        </Card>
      </div>
    </>
  );
}
