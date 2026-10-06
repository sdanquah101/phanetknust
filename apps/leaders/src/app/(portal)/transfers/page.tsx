import { ButtonLink, Card, EmptyState, Label, Notice, PageHeader, Toast } from "@phanet/ui";
import { fmtDate } from "@phanet/supabase/format";
import type { TransferRequest } from "@phanet/supabase/types";
import { fullName, getLeaderContext, leaderNames, listMySheep, lookupMemberNames } from "@/lib/queries";
import { NotLinked, StatusBadge } from "@/components/bits";

export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Move a sheep" title="Trans" script="fers" />
        <NotLinked />
      </>
    );
  }

  const [outRes, inRes, sheep, leaders] = await Promise.all([
    supabase.from("transfer_requests").select("*").eq("from_leader", leaderMemberId).order("created_at", { ascending: false }),
    supabase.from("transfer_requests").select("*").eq("to_leader", leaderMemberId).order("created_at", { ascending: false }),
    listMySheep(supabase, leaderMemberId),
    leaderNames(supabase),
  ]);
  const outgoing = (outRes.data ?? []) as TransferRequest[];
  const incoming = (inRes.data ?? []) as TransferRequest[];

  const mySheepNames = new Map(sheep.map((s) => [s.id, fullName(s)]));
  const otherIds = [...outgoing, ...incoming].map((t) => t.sheep_id).filter((id) => !mySheepNames.has(id));
  const otherNames = await lookupMemberNames(supabase, otherIds);
  const sheepName = (id: string) => mySheepNames.get(id) ?? otherNames.get(id) ?? "A member";
  const leaderName = (id: string | null) => (id ? leaders.get(id) ?? "A leader" : "Unassigned");

  const List = ({ rows, direction }: { rows: TransferRequest[]; direction: "out" | "in" }) =>
    rows.length === 0 ? (
      <EmptyState title={direction === "out" ? "No requests yet" : "Nothing incoming"} body={direction === "out" ? "Request a transfer when a sheep should move to another leader." : "Transfers other leaders send your way show up here."} className="!p-6" />
    ) : (
      <ul className="flex flex-col divide-y divide-ice">
        {rows.map((t) => (
          <li key={t.id} className="py-3 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm">{sheepName(t.sheep_id)}</span>
              <span className="text-xs text-muted">{direction === "out" ? `→ ${leaderName(t.to_leader)}` : `from ${leaderName(t.from_leader)}`}</span>
              <span className="ml-auto"><StatusBadge status={t.status} /></span>
            </div>
            {t.reason && <p className="text-sm text-muted">{t.reason}</p>}
            <div className="text-[11px] text-muted">Requested {fmtDate(t.created_at)}{t.decided_at ? ` · decided ${fmtDate(t.decided_at)}` : ""}</div>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <PageHeader eyebrow="Move a sheep" title="Trans" script="fers" actions={<ButtonLink href="/transfers/new" size="sm">Request a transfer</ButtonLink>} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />
      <Notice tone="ice">Transfers are approved or rejected by the database team in the Database portal. You'll see the status update here.</Notice>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label tone="orange">My requests</Label>
            <span className="text-xs text-muted">{outgoing.length}</span>
          </div>
          <List rows={outgoing} direction="out" />
        </Card>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label tone="orange">Coming to me</Label>
            <span className="text-xs text-muted">{incoming.length}</span>
          </div>
          <List rows={incoming} direction="in" />
        </Card>
      </div>
    </>
  );
}
