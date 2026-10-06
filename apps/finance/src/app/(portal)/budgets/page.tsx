import Link from "next/link";
import { ButtonLink, Card, EmptyState, Label, PageHeader, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { money, pct } from "@phanet/supabase/format";
import { listBudgetSummaries, listPrograms } from "@/lib/queries";
import { canWrite } from "@/lib/finance";
import { BudgetStatusBadge } from "@/components/StatusBadge";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const [budgets, programs] = await Promise.all([listBudgetSummaries(supabase), listPrograms(supabase)]);
  const programName = (id: string | null) => (id ? programs.find((p) => p.id === id)?.name ?? null : null);
  const order = { active: 0, draft: 1, closed: 2 } as Record<string, number>;
  const sorted = [...budgets].sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));

  return (
    <>
      <PageHeader eyebrow="Finance" title="Budgets" script="planned" actions={canWrite(roles) && <ButtonLink href="/budgets/new" size="sm">+ New budget</ButtonLink>} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      {sorted.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((b) => {
            const incPct = pct(Number(b.actual_income), Number(b.planned_income));
            const expPct = pct(Number(b.actual_expense), Number(b.planned_expense));
            const over = Number(b.actual_expense) > Number(b.planned_expense) && Number(b.planned_expense) > 0;
            return (
              <Card key={b.budget_id} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Label tone="orange">{b.academic_year}{b.semester ? ` · S${b.semester}` : ""}{programName(b.program_id) ? ` · ${programName(b.program_id)}` : ""}</Label>
                    <h2 className="text-xl mt-1 truncate"><Link href={`/budgets/${b.budget_id}`} className="hover:underline">{b.title}</Link></h2>
                  </div>
                  <BudgetStatusBadge status={b.status} />
                </div>
                <div className="flex flex-col gap-3">
                  <Bar label="Income" actual={Number(b.actual_income)} planned={Number(b.planned_income)} p={incPct} color="bg-royal" />
                  <Bar label="Expenses" actual={Number(b.actual_expense)} planned={Number(b.planned_expense)} p={expPct} color={over ? "bg-ember" : "bg-tangerine"} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>Planned net {money(Number(b.planned_income) - Number(b.planned_expense), { compact: true })}</span>
                  <span className={Number(b.actual_income) - Number(b.actual_expense) < 0 ? "text-ember font-bold" : "font-bold text-royal"}>Actual net {money(Number(b.actual_income) - Number(b.actual_expense), { compact: true })}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No budgets yet" body="Plan income and expense lines per program or event, then link transactions to them." action={canWrite(roles) ? <ButtonLink href="/budgets/new" size="sm">+ New budget</ButtonLink> : undefined} />
      )}
    </>
  );
}

function Bar({ label, actual, planned, p, color }: { label: string; actual: number; planned: number; p: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-bold">{label}</span>
        <span className="text-muted">{money(actual, { compact: true })} of {money(planned, { compact: true })} · {p}%</span>
      </div>
      <div className="h-2.5 rounded-pill bg-ice overflow-hidden"><div className={`h-full rounded-pill ${color}`} style={{ width: `${Math.min(100, p)}%` }} /></div>
    </div>
  );
}
