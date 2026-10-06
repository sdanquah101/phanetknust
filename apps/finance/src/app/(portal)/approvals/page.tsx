import Link from "next/link";
import { Badge, Card, EmptyState, Label, Notice, PageHeader, Table, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { fmtDate, fmtDateTime, money } from "@phanet/supabase/format";
import { listPendingExpenses, listRecentlyDecided, profileNames } from "@/lib/queries";
import { APPROVAL_LEVELS, canDecide, counterparty } from "@/lib/finance";
import { DecideForm } from "@/components/DecideForm";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const [pending, decided] = await Promise.all([listPendingExpenses(supabase), listRecentlyDecided(supabase, 20)]);
  const names = await profileNames(supabase, decided.map((d) => d.approved_by));
  const mineCount = pending.filter((t) => canDecide(roles, t.approver_role)).length;

  return (
    <>
      <PageHeader eyebrow="Finance" title="Approvals" script="ladder" />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />
      {pending.length > 0 && (
        <Notice tone={mineCount ? "orange" : "ice"}>
          {mineCount ? `${mineCount} of ${pending.length} pending expense${pending.length === 1 ? "" : "s"} need${mineCount === 1 ? "s" : ""} your decision.` : `${pending.length} pending expense${pending.length === 1 ? "" : "s"} waiting on other approvers.`}
        </Notice>
      )}

      {APPROVAL_LEVELS.map((lvl) => {
        const rows = pending.filter((t) => t.approver_role === lvl.role);
        const iDecide = canDecide(roles, lvl.role);
        const total = rows.reduce((s, t) => s + Number(t.amount), 0);
        return (
          <Card key={lvl.role}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <Label tone="orange">{lvl.title} · {lvl.range}</Label>
                <h2 className="text-xl">{rows.length ? `${rows.length} waiting · ${money(total)}` : "Nothing waiting"}</h2>
              </div>
              {iDecide ? <Badge tone="mint">You decide here</Badge> : <Badge tone="good">View only</Badge>}
            </div>
            {rows.length ? (
              <Table>
                <thead>
                  <tr><th>Date</th><th>Payee / note</th><th className="hidden md:table-cell">Category</th><th className="hidden md:table-cell">Program</th><th className="text-right">Amount</th>{iDecide && <th>Decision</th>}</tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap text-muted">{fmtDate(t.occurred_at)}</td>
                      <td>
                        <Link href={`/transactions/${t.id}`} className="font-semibold hover:underline">{counterparty(t)}</Link>
                        {t.description && counterparty(t) !== t.description && <div className="text-xs text-muted line-clamp-1">{t.description}</div>}
                      </td>
                      <td className="hidden md:table-cell text-muted">{t.category}</td>
                      <td className="hidden md:table-cell text-muted">{t.programs?.name ?? "—"}</td>
                      <td className="text-right whitespace-nowrap amt-out">{money(t.amount)}</td>
                      {iDecide && <td><DecideForm id={t.id} next="/approvals" /></td>}
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-sm text-muted">No expenses at this level right now.</p>
            )}
          </Card>
        );
      })}

      <Card>
        <Label tone="orange" className="mb-1">Recently decided</Label>
        <h2 className="text-xl mb-4">Last {decided.length} decisions</h2>
        {decided.length ? (
          <Table>
            <thead><tr><th>Decided</th><th>Payee / note</th><th className="hidden md:table-cell">By</th><th className="text-right">Amount</th><th>Status</th></tr></thead>
            <tbody>
              {decided.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap text-muted">{fmtDateTime(t.approved_at)}</td>
                  <td>
                    <Link href={`/transactions/${t.id}`} className="font-semibold hover:underline">{counterparty(t)}</Link>
                    {t.decision_note && <div className="text-xs text-muted line-clamp-1">“{t.decision_note}”</div>}
                  </td>
                  <td className="hidden md:table-cell text-muted">{t.approved_by ? names[t.approved_by] ?? "—" : "—"}</td>
                  <td className="text-right whitespace-nowrap amt-out">{money(t.amount)}</td>
                  <td><StatusBadge tx={t} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="No decisions yet" body="Approved and rejected expenses will be listed here." />
        )}
      </Card>
    </>
  );
}
