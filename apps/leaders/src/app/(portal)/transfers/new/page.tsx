import Link from "next/link";
import { Card, EmptyState, Field, Notice, PageHeader, Select, SubmitButton, Textarea, Toast } from "@phanet/ui";
import { fullName, getLeaderContext, listLeaders, listMySheep } from "@/lib/queries";
import { NotLinked } from "@/components/bits";
import { requestTransferAction } from "../actions";

export default async function NewTransferPage({ searchParams }: { searchParams: Promise<{ sheep?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Transfers" title="Request a" script="transfer" />
        <NotLinked />
      </>
    );
  }
  const [sheep, leaders] = await Promise.all([listMySheep(supabase, leaderMemberId), listLeaders(supabase)]);
  const others = leaders.filter((l) => l.id !== leaderMemberId);
  const preselected = sheep.some((s) => s.id === sp.sheep) ? sp.sheep : "";

  return (
    <>
      <PageHeader eyebrow="Transfers" title="Request a" script="transfer" actions={<Link href="/transfers" className="btn btn-ice btn-sm">← All transfers</Link>} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />
      <Notice tone="ice">The database team approves transfers in the Database portal. Until then the member stays with you.</Notice>

      {sheep.length === 0 ? (
        <EmptyState title="No sheep to transfer" body="You don't have any members assigned yet." />
      ) : others.length === 0 ? (
        <EmptyState title="No other leaders yet" body="There's no one to transfer to right now." />
      ) : (
        <Card>
          <form action={requestTransferAction} className="flex flex-col gap-4 max-w-xl">
            <Field label="Sheep">
              <Select name="sheep_id" defaultValue={preselected} required>
                <option value="" disabled>Choose a member…</option>
                {sheep.map((m) => <option key={m.id} value={m.id}>{fullName(m)} · {m.member_code}</option>)}
              </Select>
            </Field>
            <Field label="Transfer to">
              <Select name="to_leader" defaultValue="" required>
                <option value="" disabled>Choose a leader…</option>
                {others.map((l) => <option key={l.id} value={l.id}>{l.full_name}{l.department ? ` · ${l.department}` : ""}</option>)}
              </Select>
            </Field>
            <Field label="Reason" hint="Help the database team understand why.">
              <Textarea name="reason" placeholder="e.g. They moved to Unity Hall, closer to Kwame's cell" className="!min-h-[100px]" />
            </Field>
            <div className="flex justify-end">
              <SubmitButton pendingText="Sending…">Send request</SubmitButton>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
