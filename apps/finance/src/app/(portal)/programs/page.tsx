import Link from "next/link";
import { Button, Card, EmptyState, Field, Label, PageHeader, Select, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { money } from "@phanet/supabase/format";
import type { Event } from "@phanet/supabase/types";
import { getPeriod, listPrograms, listTxForYear, yearOptions, yearRange } from "@/lib/queries";

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const period = await getPeriod(supabase);
  const years = yearOptions(period.year);
  const year = sp.year && /^\d{4}\/\d{2}$/.test(sp.year) ? sp.year : period.year;
  const range = yearRange(year);
  const [programs, txs, { data: evData }] = await Promise.all([
    listPrograms(supabase), listTxForYear(supabase, year),
    supabase.from("events").select("id, program_id").gte("starts_at", range.from).lt("starts_at", range.to).limit(2000),
  ]);
  const events = (evData ?? []) as Pick<Event, "id" | "program_id">[];

  type Agg = { income: number; expense: number; pending: number; events: number; count: number };
  const empty = (): Agg => ({ income: 0, expense: 0, pending: 0, events: 0, count: 0 });
  const agg = new Map<string | null, Agg>();
  programs.forEach((p) => agg.set(p.id, empty()));
  agg.set(null, empty());
  const slot = (id: string | null) => { const key = id && agg.has(id) ? id : null; let a = agg.get(key); if (!a) { a = empty(); agg.set(key, a); } return a; };
  for (const t of txs) {
    const a = slot(t.program_id); a.count++;
    if (t.kind === "income") a.income += Number(t.amount);
    else if (t.status === "approved" || t.status === "paid") a.expense += Number(t.amount);
    else if (t.status === "pending") a.pending += Number(t.amount);
  }
  for (const e of events) slot(e.program_id).events++;
  const rows = [...programs.map((p) => ({ id: p.id as string | null, name: p.name, active: p.is_active, ...slot(p.id) })), { id: null, name: "Unassigned", active: true, ...slot(null) }];
  const totals = rows.reduce((s, r) => ({ income: s.income + r.income, expense: s.expense + r.expense, pending: s.pending + r.pending, events: s.events + r.events, count: s.count + r.count }), empty());
  const link = (id: string | null) => `/transactions?program=${id ?? "none"}&from=${range.from.slice(0, 10)}&to=${new Date(new Date(range.to).getTime() - 86400000).toISOString().slice(0, 10)}`;

  return (
    <>
      <PageHeader
        eyebrow={`Finance · ${year}`}
        title="Programs"
        script="by program"
        actions={
          <form method="get" className="flex items-end gap-2">
            <Field label="Academic year"><Select name="year" defaultValue={year} className="!w-auto !py-2.5">{[...new Set([...years, year])].map((y) => <option key={y} value={y}>{y}</option>)}</Select></Field>
            <Button type="submit" variant="ice" size="sm" className="mb-0.5">Show</Button>
          </form>
        }
      />

      <Card>
        {rows.some((r) => r.count || r.events) || programs.length ? (
          <Table>
            <thead><tr><th>Program</th><th className="text-right">Income</th><th className="text-right">Expenses</th><th className="text-right">Net</th><th className="text-right hidden md:table-cell">Pending</th><th className="text-right hidden md:table-cell">Events</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id ?? "none"}>
                  <td>
                    <div className="font-semibold">{r.name}{!r.active && <span className="text-xs text-muted font-medium"> · inactive</span>}</div>
                    <div className="text-xs text-muted">{r.count} entr{r.count === 1 ? "y" : "ies"}</div>
                  </td>
                  <td className="text-right amt-in">{money(r.income)}</td>
                  <td className="text-right amt-out">{money(r.expense)}</td>
                  <td className={`text-right font-bold ${r.income - r.expense < 0 ? "text-ember" : ""}`}>{money(r.income - r.expense)}</td>
                  <td className="text-right text-muted hidden md:table-cell">{r.pending ? money(r.pending) : "—"}</td>
                  <td className="text-right hidden md:table-cell">{r.events}</td>
                  <td className="text-right"><Link href={link(r.id)} className="btn btn-ice btn-sm">Ledger</Link></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="font-bold">All programs</td>
                <td className="text-right amt-in">{money(totals.income)}</td>
                <td className="text-right amt-out">{money(totals.expense)}</td>
                <td className={`text-right font-bold ${totals.income - totals.expense < 0 ? "text-ember" : ""}`}>{money(totals.income - totals.expense)}</td>
                <td className="text-right text-muted hidden md:table-cell">{totals.pending ? money(totals.pending) : "—"}</td>
                <td className="text-right hidden md:table-cell">{totals.events}</td>
                <td />
              </tr>
            </tfoot>
          </Table>
        ) : (
          <EmptyState title="No programs yet" body="Programs are managed by the admin. Once they exist, income and expenses roll up here." />
        )}
      </Card>
      <p className="text-xs text-muted px-1"><Label tone="muted" className="inline">Note</Label> Expenses count once approved or paid. Academic year runs 1 Aug – 31 Jul.</p>
    </>
  );
}
