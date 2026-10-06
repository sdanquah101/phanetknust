import Link from "next/link";
import { Badge, Card, EmptyState, Label, PageHeader, SubmitButton, Table, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDate } from "@phanet/supabase/format";
import { listTransfers, type TransferRow } from "@/lib/queries";
import { decideTransferAction } from "./actions";

export const dynamic = "force-dynamic";

const nameOf = (m: TransferRow["sheep"]) => (m ? [m.first_name, m.other_names, m.last_name].filter(Boolean).join(" ") : "—");
const linkOf = (m: TransferRow["sheep"], href: (id: string) => string) => (m ? <Link href={href(m.id)} className="font-bold">{nameOf(m)}</Link> : <span className="text-muted">—</span>);

export default async function TransfersPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { pending, history } = await listTransfers(supabase);

  return (
    <>
      <PageHeader eyebrow={`${pending.length} waiting`} title="Transfers" script="handover" />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      {pending.length === 0 ? (
        <EmptyState title="Nothing pending" body="When a leader asks to move a sheep to another leader, it shows up here for approval." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pending.map((t) => (
            <Card key={t.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label tone="orange" className="mb-1">Sheep</Label>
                  <div className="text-lg font-extrabold">{linkOf(t.sheep, (id) => `/members/${id}`)}</div>
                  {t.sheep?.member_code && <div className="text-xs text-muted">{t.sheep.member_code}</div>}
                </div>
                <Badge tone="warn">Pending</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="label-caps text-muted mb-0.5">From</div>{linkOf(t.from, (id) => `/leaders/${id}`)}</div>
                <div><div className="label-caps text-muted mb-0.5">To</div>{linkOf(t.to, (id) => `/leaders/${id}`)}</div>
              </div>
              {t.reason && <p className="text-sm text-muted bg-row rounded-[16px] p-3">“{t.reason}”</p>}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-xs text-muted">Requested {fmtDate(t.created_at)}</span>
                <div className="flex gap-2">
                  <form action={decideTransferAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <SubmitButton variant="ice" size="sm" pendingText="…">Reject</SubmitButton>
                  </form>
                  <form action={decideTransferAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <SubmitButton variant="blue" size="sm" pendingText="…">Approve</SubmitButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="!p-4 md:!p-6">
        <Label tone="orange" className="mb-4">History</Label>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No decisions yet.</p>
        ) : (
          <Table>
            <thead><tr><th>Sheep</th><th>From</th><th>To</th><th>Reason</th><th>Decision</th><th>Decided</th></tr></thead>
            <tbody>
              {history.map((t) => (
                <tr key={t.id}>
                  <td>{linkOf(t.sheep, (id) => `/members/${id}`)}</td>
                  <td className="text-muted">{nameOf(t.from)}</td>
                  <td className="text-muted">{nameOf(t.to)}</td>
                  <td className="text-muted max-w-[260px] truncate">{t.reason ?? "—"}</td>
                  <td><Badge tone={t.status === "approved" ? "mint" : "warn"}>{t.status}</Badge></td>
                  <td className="text-muted whitespace-nowrap">{fmtDate(t.decided_at)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
