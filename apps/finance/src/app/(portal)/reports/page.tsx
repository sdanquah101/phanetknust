import { Card, EmptyState, Field, Input, Label, Notice, PageHeader, Select, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { money } from "@phanet/supabase/format";
import { getPeriod, listTxInRange, periodLabel, periodRange } from "@/lib/queries";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; kind?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const period = await getPeriod(supabase);
  const pr = periodRange(period.year, period.semester);
  const defaultFrom = sp.from ?? pr.from.slice(0, 10);
  const defaultTo = sp.to ?? new Date(Math.min(Date.now(), new Date(pr.to).getTime() - 1)).toISOString().slice(0, 10);

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const txs = await listTxInRange(supabase, { from: start.toISOString(), to: end.toISOString() });
  const months: { key: string; label: string; income: number; expense: number; pending: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }), income: 0, expense: 0, pending: 0 });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const t of txs) {
    const m = byKey.get(t.occurred_at.slice(0, 7));
    if (!m) continue;
    if (t.kind === "income") m.income += Number(t.amount);
    else if (t.status === "approved" || t.status === "paid") m.expense += Number(t.amount);
    else if (t.status === "pending") m.pending += Number(t.amount);
  }
  const tot = months.reduce((s, m) => ({ income: s.income + m.income, expense: s.expense + m.expense }), { income: 0, expense: 0 });
  const hasAny = txs.length > 0;

  return (
    <>
      <PageHeader eyebrow={`Finance · ${periodLabel(period)}`} title="Reports" script="export" />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <Card>
          <Label tone="orange" className="mb-1">CSV export</Label>
          <h2 className="text-xl mb-4">Download the ledger</h2>
          <form action="/api/export" method="get" className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="From"><Input type="date" name="from" defaultValue={defaultFrom} required /></Field>
              <Field label="To"><Input type="date" name="to" defaultValue={defaultTo} required /></Field>
            </div>
            <Field label="Type">
              <Select name="kind" defaultValue={sp.kind ?? ""}>
                <option value="">Income and expenses</option>
                <option value="income">Income only</option>
                <option value="expense">Expenses only</option>
              </Select>
            </Field>
            <SubmitButton variant="blue" pendingText="Preparing…">Download CSV</SubmitButton>
            <Notice tone="ice">Columns: date, kind, category, channel, amount, status, payer/payee, program, reference, description. Opens in Excel or Google Sheets.</Notice>
          </form>
        </Card>

        <Card className="min-w-0">
          <Label tone="orange" className="mb-1">Monthly totals</Label>
          <h2 className="text-xl mb-4">Last 12 months</h2>
          {hasAny ? (
            <Table>
              <thead><tr><th>Month</th><th className="text-right">Income</th><th className="text-right">Expenses</th><th className="text-right">Net</th><th className="text-right hidden md:table-cell">Pending</th></tr></thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.key}>
                    <td className="font-semibold whitespace-nowrap">{m.label}</td>
                    <td className="text-right amt-in">{m.income ? money(m.income) : <span className="text-muted font-normal">—</span>}</td>
                    <td className="text-right amt-out">{m.expense ? money(m.expense) : <span className="text-muted font-normal">—</span>}</td>
                    <td className={`text-right font-bold ${m.income - m.expense < 0 ? "text-ember" : ""}`}>{m.income || m.expense ? money(m.income - m.expense) : "—"}</td>
                    <td className="text-right text-muted hidden md:table-cell">{m.pending ? money(m.pending) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td className="font-bold">12 months</td><td className="text-right amt-in">{money(tot.income)}</td><td className="text-right amt-out">{money(tot.expense)}</td><td className={`text-right font-bold ${tot.income - tot.expense < 0 ? "text-ember" : ""}`}>{money(tot.income - tot.expense)}</td><td className="hidden md:table-cell" /></tr>
              </tfoot>
            </Table>
          ) : (
            <EmptyState title="Nothing in the last 12 months" body="Monthly totals appear once the ledger has entries." />
          )}
        </Card>
      </div>
    </>
  );
}
