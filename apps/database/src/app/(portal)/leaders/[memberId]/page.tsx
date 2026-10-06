import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, ConfirmSubmit, EmptyState, Label, PageHeader, StatCard, Table, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { memberName } from "@phanet/supabase/types";
import { getMemberLite, listLeaders, listSheep } from "@/lib/queries";
import { photoUrls } from "@/lib/photo";
import { MemberAvatar, StatusBadge } from "@/components/bits";
import { SheepAssigner } from "@/components/SheepAssigner";
import { unassignSheepAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LeaderPage({ params, searchParams }: { params: Promise<{ memberId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ memberId }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [leader, sheep, leaders] = await Promise.all([getMemberLite(supabase, memberId), listSheep(supabase, memberId), listLeaders(supabase)]);
  if (!leader) notFound();
  const photos = await photoUrls(supabase, sheep.map((s) => s.photo_path));
  const name = memberName(leader);
  const leaderNames = Object.fromEntries(leaders.map((l) => [l.id, l.full_name]));
  const active = sheep.filter((s) => s.membership_status === "active").length;

  return (
    <>
      <PageHeader
        eyebrow={leader.member_code}
        title={name}
        actions={
          <>
            <ButtonLink href="/leaders" variant="ice" size="sm">← Leaders</ButtonLink>
            <ButtonLink href={`/members/${leader.id}`} variant="blue" size="sm">Profile</ButtonLink>
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <StatCard label="Sheep" value={sheep.length} tone="blue" />
        <StatCard label="Active" value={active} />
        <StatCard label="Inactive / other" value={sheep.length - active} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="!p-4 md:!p-6">
          <Label tone="orange" className="mb-4">Sheep</Label>
          {sheep.length === 0 ? (
            <EmptyState title="No sheep yet" body="Use the assign tool to give this leader members to shepherd." />
          ) : (
            <Table>
              <thead><tr><th>Member</th><th>Programme</th><th>Hall</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {sheep.map((s) => {
                  const n = memberName(s);
                  return (
                    <tr key={s.id}>
                      <td>
                        <Link href={`/members/${s.id}`} className="flex items-center gap-3 font-bold">
                          <MemberAvatar name={n} src={s.photo_path ? photos.get(s.photo_path) : null} />
                          <span><span className="block">{n}</span><span className="block text-xs text-muted font-medium">{s.member_code}</span></span>
                        </Link>
                      </td>
                      <td className="text-muted">{s.programme ?? "—"}{s.year_of_study ? ` · ${s.year_of_study}` : ""}</td>
                      <td className="text-muted">{s.hall ?? "—"}</td>
                      <td><StatusBadge status={s.membership_status} /></td>
                      <td className="text-right">
                        <form action={unassignSheepAction}>
                          <input type="hidden" name="leader_id" value={leader.id} />
                          <input type="hidden" name="member_id" value={s.id} />
                          <ConfirmSubmit message={`Remove ${n} from ${name}'s sheep?`} variant="ice" size="sm">Unassign</ConfirmSubmit>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
        <SheepAssigner leaderId={leader.id} leaderNames={leaderNames} />
      </div>
    </>
  );
}
