import Link from "next/link";
import { Avatar, Badge, Button, Card, Disclosure, EmptyState, Field, Input, Notice, PageHeader, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDate } from "@phanet/supabase/format";
import { memberName, type Member, type Profile, type UserRole } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { hasServiceRole, NO_SERVICE_ROLE } from "@/lib/admin";
import { RoleCheckboxes } from "./RoleCheckboxes";
import { createUserWithPassword, inviteUser } from "./actions";

type MemberLite = Pick<Member, "id" | "member_code" | "first_name" | "last_name" | "other_names">;

export default async function UsersPage({ searchParams }: { searchParams: Promise<FlashParams & { q?: string; invite?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const supabase = await createClient();

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(300);
  if (q) {
    const like = `%${q.replace(/[%_,]/g, " ")}%`;
    query = query.or(`full_name.ilike.${like},email.ilike.${like}`);
  }
  const [{ data: profileRows }, { data: roleRows }] = await Promise.all([query, supabase.from("user_roles").select("*")]);
  const profiles = (profileRows ?? []) as Profile[];
  const roles = (roleRows ?? []) as UserRole[];
  const memberIds = profiles.map((p) => p.member_id).filter((x): x is string => Boolean(x));
  const { data: memberRows } = memberIds.length
    ? await supabase.from("members").select("id, member_code, first_name, last_name, other_names").in("id", memberIds)
    : { data: [] as MemberLite[] };
  const members = new Map(((memberRows ?? []) as MemberLite[]).map((m) => [m.id, m]));
  const rolesByUser = new Map<string, string[]>();
  roles.forEach((r) => rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role]));

  return (
    <>
      <PageHeader eyebrow="Users & access" title="Who gets in" script="where" />
      <Flash ok={sp.ok} error={sp.error} />
      {!hasServiceRole() && <Notice tone="peach">{NO_SERVICE_ROLE}</Notice>}

      <Disclosure
        id="invite"
        label="Invite"
        title="Add a new account"
        description="Send an email invite, or create the account with a password right away."
        defaultOpen={Boolean(sp.invite) || (profiles.length === 0 && !q)}
      >
        <form className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name"><Input name="full_name" placeholder="Ama Owusu" required /></Field>
            <Field label="Email"><Input name="email" type="email" placeholder="ama@st.knust.edu.gh" required /></Field>
          </div>
          <RoleCheckboxes idPrefix="invite" />
          <Field label="Password (only for 'Create with password')" hint="At least 8 characters. Leave blank when inviting by email." className="md:max-w-md">
            <Input name="password" type="text" autoComplete="off" placeholder="••••••••" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <SubmitButton formAction={inviteUser} pendingText="Sending…">Send invite</SubmitButton>
            <SubmitButton formAction={createUserWithPassword} variant="blue" pendingText="Creating…">Create with password</SubmitButton>
          </div>
        </form>
      </Disclosure>

      <Card className="flex flex-col gap-4">
        <form className="flex flex-wrap gap-2 items-end" action="/users" method="get">
          <Field label="Search" className="flex-1 min-w-[200px]">
            <Input name="q" defaultValue={q} placeholder="Name or email" />
          </Field>
          <Button type="submit" variant="blue">Search</Button>
          {q && <Link href="/users" className="btn btn-ice">Clear</Link>}
        </form>

        {profiles.length === 0 ? (
          <EmptyState title={q ? "No one matches that search." : "No accounts yet."} body={q ? "Try a shorter name or the email address." : "Invite the first executive using the form above."} />
        ) : (
          <Table>
            <thead>
              <tr><th>Person</th><th>Roles</th><th className="hidden xl:table-cell">Member</th><th className="hidden 2xl:table-cell">Joined</th><th /></tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const rs = rolesByUser.get(p.id) ?? [];
                const m = p.member_id ? members.get(p.member_id) : undefined;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.full_name ?? p.email} src={p.avatar_url} />
                        <div className="min-w-0">
                          <div className="font-bold truncate">{p.full_name ?? "—"}</div>
                          <div className="text-xs text-muted truncate">{p.email ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {rs.length === 0 && <span className="text-xs text-muted">No portal access</span>}
                        {rs.map((r) => <Badge key={r} tone={r === "admin" ? "orange" : "good"}>{r}</Badge>)}
                      </div>
                    </td>
                    <td>
                      {m ? (
                        <div><div className="font-semibold">{memberName(m)}</div><div className="text-xs text-muted">{m.member_code}</div></div>
                      ) : (
                        <span className="text-xs text-muted">Not linked</span>
                      )}
                    </td>
                    <td className="hidden 2xl:table-cell whitespace-nowrap">{fmtDate(p.created_at)}</td>
                    <td className="text-right"><Link href={`/users/${p.id}`} className="btn btn-ice btn-sm">Manage</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
