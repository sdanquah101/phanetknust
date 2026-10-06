import Link from "next/link";
import { ButtonLink, Card, EmptyState, Label, PageHeader, StatCard, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { fmtDate, money, pct } from "@phanet/supabase/format";
import { getPeriod, listFunds, listPendingExpenses, listPrograms, listRecent, listTxForSemester, periodLabel } from "@/lib/queries";
import { canDecide, canWrite, counterparty } from "@/lib/finance";
import { TxTable } from "@/components/TxTable";
import { DecideForm } from "@/components/DecideForm";

export default async function OverviewPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const period = await getPeriod(supabase);
  const [semTx, recent, pending, funds, programs] = await Promise.all([
    listTxForSemester(supabase, period), listRecent(supabase, 10), listPendingExpenses(supabase), listFunds(supabase), listPrograms(supabase),
  ]);

  const fundSlugs = new Set(funds.map((f) => f.slug));
  let collected = 0, expenses = 0, giving = 0;
  const byProgram = new Map<string | null, { income: number; expense: number }>();
  for (const t of semTx) {
    const a = Number(t.amount);
    const slot = byProgram.get(t.program_id) ?? { income: 0, expense: 0 };
    if (t.kind === "income") {
      collected += a; slot.income += a;
      if (fundSlugs.has(t.category)) giving += a;
    } else if (t.status === "approved" || t.status === "paid") {
      expenses += a; slot.expense += a;
    }
    byProgram.set(t.program_id, slot);
  }
  const pendingAmount = pending.reduce((s, t) => s + Number(t.amount), 0);
  const mine = pending.filter((t) => canDecide(roles, t.approver_role)).slice(0, 6);
  const programName = (id: string | null) => (id ? programs.find((p) => p.id === id)?.name ?? "Unknown program" : "Unassigned");
  const bars = [...byProgram.entries()].map(([id, v]) => ({ id, name: programName(id), ...v })).sort((a, b) => b.income + b.expense - (a.income + a.expense)).slice(0, 6);
  const barMax = Math.max(1, ...bars.map((b) => Math.max(b.income, b.expense)));

  return (
    <>
      <PageHeader
        eyebrow={`Finance · ${periodLabel(period)}`}
        title="Ledger"
        script="overview"
        actions={
          <>
            <ButtonLink href="/reports" variant="ice" size="sm">Export CSV</ButtonLink>
            {canWrite(roles) && (
              <>
                <ButtonLink href="/transactions/new?kind=income" variant="blue" size="sm">+ Record income</ButtonLink>
                <ButtonLink href="/transactions/new?kind=expense" size="sm">+ Record expense</ButtonLink>
              </>
            )}
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Collected · this semester" value={money(collected, { compact: true })} sub={`${semTx.filter((t) => t.kind === "income").length} gifts & payments`} />
        <StatCard label="Expenses · this semester" value={money(expenses, { compact: true })} sub="Approved and paid out" />
        <StatCard label="Pending approval" value={pending.length} sub={pending.length ? `${money(pendingAmount)} waiting` : "Nothing waiting"} tone="orange" />
        <StatCard label="Giving funds" value={money(giving, { compact: true })} sub={`${funds.filter((f) => f.is_active).length} active funds`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="min-w-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <Label tone="orange">Recent</Label>
              <h2 className="text-xl">Latest entries</h2>
            </div>
            <ButtonLink href="/transactions" variant="ice" size="sm">Full ledger</ButtonLink>
          </div>
          <TxTable rows={recent} compact emptyTitle="No entries yet" emptyBody="Record the first offering or expense to start the ledger." />
        </Card>

        <div className="flex flex-col gap-6 min-w-0">
          <Card>
            <Label tone="orange" className="mb-1">Needs your decision</Label>
            <h2 className="text-xl mb-4">{mine.length ? `${mine.length} expense${mine.length === 1 ? "" : "s"}` : "All clear"}</h2>
            {mine.length ? (
              <ul className="flex flex-col gap-3">
                {mine.map((t) => (
                  <li key={t.id} className="card-ice p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/transactions/${t.id}`} className="font-bold hover:underline block truncate">{counterparty(t)}</Link>
                        <div className="text-xs text-muted">{t.category} · {fmtDate(t.occurred_at)}{t.programs?.name ? ` · ${t.programs.name}` : ""}</div>
                      </div>
                      <div className="amt-out whitespace-nowrap font-bold">{money(t.amount)}</div>
                    </div>
                    <DecideForm id={t.id} next="/" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nothing waiting on you" body={pending.length ? `${pending.length} pending expense${pending.length === 1 ? " is" : "s are"} with other approvers.` : "New expenses will appear here when they need your approval."} action={<ButtonLink href="/approvals" variant="ice" size="sm">See approvals</ButtonLink>} />
            )}
          </Card>

          <Card>
            <Label tone="orange" className="mb-1">By program</Label>
            <h2 className="text-xl mb-4">This semester</h2>
            {bars.length ? (
              <ul className="flex flex-col gap-4">
                {bars.map((b) => (
                  <li key={b.id ?? "none"}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <Link href={b.id ? `/transactions?program=${b.id}` : "/transactions?program=none"} className="font-semibold hover:underline truncate">{b.name}</Link>
                      <span className="text-xs text-muted whitespace-nowrap">net {money(b.income - b.expense, { compact: true })}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-2.5 rounded-pill bg-ice overflow-hidden"><div className="h-full rounded-pill bg-royal" style={{ width: `${pct(b.income, barMax)}%` }} aria-label={`Income ${money(b.income)}`} /></div>
                      <div className="h-2.5 rounded-pill bg-ice overflow-hidden"><div className="h-full rounded-pill bg-tangerine" style={{ width: `${pct(b.expense, barMax)}%` }} aria-label={`Expense ${money(b.expense)}`} /></div>
                    </div>
                  </li>
                ))}
                <li className="flex gap-4 text-xs text-muted pt-1"><span><span className="inline-block w-2.5 h-2.5 rounded-full bg-royal mr-1.5 align-middle" />Income</span><span><span className="inline-block w-2.5 h-2.5 rounded-full bg-tangerine mr-1.5 align-middle" />Expenses</span></li>
              </ul>
            ) : (
              <EmptyState title="No activity yet" body="Program totals appear once this semester has entries." />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
