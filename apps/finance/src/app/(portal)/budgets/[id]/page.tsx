import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Card, ConfirmSubmit, Field, Input, Label, PageHeader, Select, SubmitButton, Table, Textarea, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { money, pct } from "@phanet/supabase/format";
import type { Transaction } from "@phanet/supabase/types";
import { getBudget, listEvents, listPrograms, TX_SELECT, type TxRow } from "@/lib/queries";
import { canWrite, isAdmin } from "@/lib/finance";
import { BudgetStatusBadge } from "@/components/StatusBadge";
import { TxTable } from "@/components/TxTable";
import { addLineAction, deleteBudgetAction, deleteLineAction, setBudgetStatusAction, updateBudgetAction } from "../actions";

export default async function BudgetDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const budget = await getBudget(supabase, id);
  if (!budget) notFound();
  const write = canWrite(roles);
  const [programs, events, { data: txData }] = await Promise.all([
    write ? listPrograms(supabase) : Promise.resolve([]),
    write ? listEvents(supabase, 100) : Promise.resolve([]),
    supabase.from("transactions").select(TX_SELECT).eq("budget_id", id).order("occurred_at", { ascending: false }).limit(500),
  ]);
  const txs = (txData ?? []) as TxRow[];
  const counts = (t: Pick<Transaction, "kind" | "status">) => t.kind === "income" || t.status === "approved" || t.status === "paid";
  const actualByLine = new Map<string, number>();
  let unlinkedIncome = 0, unlinkedExpense = 0;
  for (const t of txs) {
    if (!counts(t)) continue;
    if (t.budget_line_id) actualByLine.set(t.budget_line_id, (actualByLine.get(t.budget_line_id) ?? 0) + Number(t.amount));
    else if (t.kind === "income") unlinkedIncome += Number(t.amount);
    else unlinkedExpense += Number(t.amount);
  }
  const program = budget.program_id ? programs.find((p) => p.id === budget.program_id) : null;

  const groups = (["income", "expense"] as const).map((kind) => {
    const lines = budget.budget_lines.filter((l) => l.kind === kind);
    const planned = lines.reduce((s, l) => s + Number(l.planned_amount), 0);
    const actual = lines.reduce((s, l) => s + (actualByLine.get(l.id) ?? 0), 0) + (kind === "income" ? unlinkedIncome : unlinkedExpense);
    return { kind, lines, planned, actual };
  });
  const plannedNet = groups[0].planned - groups[1].planned;
  const actualNet = groups[0].actual - groups[1].actual;

  return (
    <>
      <PageHeader
        eyebrow={`Budget · ${budget.academic_year}${budget.semester ? ` S${budget.semester}` : ""}${program ? ` · ${program.name}` : ""}`}
        title={budget.title}
        actions={
          <>
            <ButtonLink href="/budgets" variant="ice" size="sm">← Budgets</ButtonLink>
            <ButtonLink href={`/transactions?budget=${budget.id}`} variant="ice" size="sm">Ledger entries</ButtonLink>
            {write && <ButtonLink href={`/transactions/new?kind=expense${budget.program_id ? `&program=${budget.program_id}` : ""}`} size="sm">+ Expense</ButtonLink>}
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-2">
          <Label tone="orange">Status</Label>
          <div className="flex items-center gap-3"><BudgetStatusBadge status={budget.status} />
            {write && (
              <form action={setBudgetStatusAction} className="flex items-center gap-2 ml-auto">
                <input type="hidden" name="id" value={budget.id} />
                <Select name="status" defaultValue={budget.status} className="!w-auto !py-2" aria-label="Change status">
                  <option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option>
                </Select>
                <SubmitButton variant="ice" size="sm" pendingText="…">Set</SubmitButton>
              </form>
            )}
          </div>
          {budget.notes && <p className="text-sm text-muted mt-1">{budget.notes}</p>}
        </Card>
        <Card className="flex flex-col gap-2">
          <Label tone="orange">Planned</Label>
          <div className="num-lg">{money(plannedNet, { compact: true })}</div>
          <div className="text-xs text-muted">In {money(groups[0].planned, { compact: true })} · Out {money(groups[1].planned, { compact: true })}</div>
        </Card>
        <Card className="flex flex-col gap-2" tone={actualNet < 0 ? "orange" : "blue"}>
          <Label tone="peach">Actual so far</Label>
          <div className="num-lg">{money(actualNet, { compact: true })}</div>
          <div className="text-xs text-white/85">In {money(groups[0].actual, { compact: true })} · Out {money(groups[1].actual, { compact: true })} · {pct(groups[1].actual, groups[1].planned)}% of expense plan used</div>
        </Card>
      </div>

      {groups.map((g) => (
        <Card key={g.kind}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <Label tone="orange">{g.kind === "income" ? "Income lines" : "Expense lines"}</Label>
              <h2 className="text-xl">{money(g.actual)} <span className="text-muted text-sm font-medium">of {money(g.planned)} planned</span></h2>
            </div>
          </div>
          {g.lines.length ? (
            <Table>
              <thead><tr><th>Line</th><th className="text-right">Planned</th><th className="text-right">Actual</th><th className="text-right">Variance</th><th className="hidden md:table-cell w-40">Used</th>{write && <th />}</tr></thead>
              <tbody>
                {g.lines.map((l) => {
                  const actual = actualByLine.get(l.id) ?? 0;
                  const variance = g.kind === "income" ? actual - Number(l.planned_amount) : Number(l.planned_amount) - actual;
                  const p = pct(actual, Number(l.planned_amount));
                  return (
                    <tr key={l.id}>
                      <td className="font-semibold">{l.name}</td>
                      <td className="text-right">{money(l.planned_amount)}</td>
                      <td className={`text-right ${g.kind === "income" ? "amt-in" : "amt-out"}`}>{money(actual)}</td>
                      <td className={`text-right font-bold ${variance < 0 ? "text-ember" : "text-royal"}`}>{variance < 0 ? "−" : "+"}{money(Math.abs(variance))}</td>
                      <td className="hidden md:table-cell"><div className="h-2 rounded-pill bg-ice overflow-hidden"><div className={`h-full rounded-pill ${p > 100 ? "bg-ember" : g.kind === "income" ? "bg-royal" : "bg-tangerine"}`} style={{ width: `${Math.min(100, p)}%` }} /></div></td>
                      {write && (
                        <td className="text-right">
                          <form action={deleteLineAction}>
                            <input type="hidden" name="id" value={l.id} />
                            <input type="hidden" name="budget_id" value={budget.id} />
                            <ConfirmSubmit message={`Remove “${l.name}”? Linked transactions stay in the ledger.`} variant="ice" size="sm" className="!text-ember">Remove</ConfirmSubmit>
                          </form>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {(g.kind === "income" ? unlinkedIncome : unlinkedExpense) > 0 && (
                  <tr><td className="text-muted italic">Linked to budget, no line</td><td className="text-right text-muted">—</td><td className={`text-right ${g.kind === "income" ? "amt-in" : "amt-out"}`}>{money(g.kind === "income" ? unlinkedIncome : unlinkedExpense)}</td><td /><td className="hidden md:table-cell" />{write && <td />}</tr>
                )}
              </tbody>
            </Table>
          ) : (
            <p className="text-sm text-muted">No {g.kind} lines yet.</p>
          )}
          {write && (
            <form action={addLineAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end card-ice p-4">
              <input type="hidden" name="budget_id" value={budget.id} />
              <input type="hidden" name="kind" value={g.kind} />
              <input type="hidden" name="sort_order" value={g.lines.length + 1} />
              <Field label={`New ${g.kind} line`}><Input name="name" placeholder={g.kind === "income" ? "Offerings" : "Venue & sound"} required /></Field>
              <Field label="Planned (GH₵)"><Input name="planned_amount" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0.00" required className="sm:w-40" /></Field>
              <SubmitButton variant="blue" size="sm" pendingText="Adding…" className="mb-0.5">Add line</SubmitButton>
            </form>
          )}
        </Card>
      ))}

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div><Label tone="orange">Linked transactions</Label><h2 className="text-xl">{txs.length} entr{txs.length === 1 ? "y" : "ies"}</h2></div>
          <Link href={`/transactions?budget=${budget.id}`} className="btn btn-ice btn-sm">Open in ledger</Link>
        </div>
        <TxTable rows={txs.slice(0, 50)} compact emptyTitle="No transactions linked" emptyBody="Pick this budget's lines when recording income or expenses." />
      </Card>

      {write && (
        <Card>
          <Label tone="orange" className="mb-1">Details</Label>
          <h2 className="text-xl mb-4">Edit budget</h2>
          <form action={updateBudgetAction} className="grid gap-4 md:grid-cols-2">
            <input type="hidden" name="id" value={budget.id} />
            <Field label="Title" className="md:col-span-2"><Input name="title" defaultValue={budget.title} required /></Field>
            <Field label="Program">
              <Select name="program_id" defaultValue={budget.program_id ?? ""}><option value="">— None —</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            </Field>
            <Field label="Event">
              <Select name="event_id" defaultValue={budget.event_id ?? ""}>
                <option value="">— None —</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                {budget.event_id && !events.some((e) => e.id === budget.event_id) && <option value={budget.event_id}>Current event</option>}
              </Select>
            </Field>
            <Field label="Notes" className="md:col-span-2"><Textarea name="notes" defaultValue={budget.notes ?? ""} className="!min-h-[80px]" /></Field>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <SubmitButton variant="blue" pendingText="Saving…">Save</SubmitButton>
              {isAdmin(roles) && <span className="ml-auto" />}
            </div>
          </form>
          {isAdmin(roles) && (
            <form action={deleteBudgetAction} className="mt-4 pt-4 border-t border-ice flex items-center justify-between gap-3">
              <input type="hidden" name="id" value={budget.id} />
              <span className="text-xs text-muted">Deleting removes the lines; transactions stay but lose their budget link.</span>
              <ConfirmSubmit message="Delete this budget and all its lines?" variant="danger" size="sm">Delete budget</ConfirmSubmit>
            </form>
          )}
        </Card>
      )}
    </>
  );
}
