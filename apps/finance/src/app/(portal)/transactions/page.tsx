import Link from "next/link";
import { Button, ButtonLink, Card, Field, Input, PageHeader, Select, Toast } from "@phanet/ui";
import { createClient, getSession } from "@phanet/supabase/server";
import { CHANNEL_LABELS } from "@phanet/supabase/types";
import { listFunds, listPrograms, listTransactions, listExpenseCategories, type TxFilters } from "@/lib/queries";
import { canWrite, CHANNELS, EXPENSE_STATUSES, INCOME_STATUSES } from "@/lib/finance";
import { TxTable } from "@/components/TxTable";

type SP = TxFilters & { page?: string; ok?: string; error?: string };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [session, supabase] = await Promise.all([getSession(), createClient()]);
  const roles = session?.roles ?? [];
  const filters: TxFilters = { kind: sp.kind, category: sp.category, channel: sp.channel, program: sp.program, status: sp.status, from: sp.from, to: sp.to, q: sp.q, budget: sp.budget, event: sp.event };
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, programs, funds, expenseCats] = await Promise.all([listTransactions(supabase, filters, page), listPrograms(supabase), listFunds(supabase), listExpenseCategories(supabase)]);
  const categories = [...new Set([...funds.map((f) => f.slug), "shop", "other", ...expenseCats])];

  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    Object.entries({ ...filters, ...over }).forEach(([k, v]) => { if (v) p.set(k, v); });
    const s = p.toString();
    return s ? `/transactions?${s}` : "/transactions";
  };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Transactions"
        script="ledger"
        actions={
          <>
            <ButtonLink href={`/api/export?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string>).toString()}`} variant="ice" size="sm">Export CSV</ButtonLink>
            {canWrite(roles) && (
              <>
                <ButtonLink href="/transactions/new?kind=income" variant="blue" size="sm">+ Income</ButtonLink>
                <ButtonLink href="/transactions/new?kind=expense" size="sm">+ Expense</ButtonLink>
              </>
            )}
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <Card>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Search" className="sm:col-span-2">
            <Input name="q" defaultValue={sp.q ?? ""} placeholder="Name, payee, reference, note…" />
          </Field>
          <Field label="Type">
            <Select name="kind" defaultValue={sp.kind ?? ""}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue={sp.status ?? ""}>
              <option value="">Any</option>
              <optgroup label="Income">{INCOME_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</optgroup>
              <optgroup label="Expense">{EXPENSE_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</optgroup>
            </Select>
          </Field>
          <Field label="Category">
            <Select name="category" defaultValue={sp.category ?? ""}>
              <option value="">Any</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Channel">
            <Select name="channel" defaultValue={sp.channel ?? ""}>
              <option value="">Any</option>
              {CHANNELS.map((c) => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
            </Select>
          </Field>
          <Field label="Program">
            <Select name="program" defaultValue={sp.program ?? ""}>
              <option value="">Any</option>
              <option value="none">Unassigned</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From"><Input type="date" name="from" defaultValue={sp.from ?? ""} /></Field>
            <Field label="To"><Input type="date" name="to" defaultValue={sp.to ?? ""} /></Field>
          </div>
          {sp.budget && <input type="hidden" name="budget" value={sp.budget} />}
          {sp.event && <input type="hidden" name="event" value={sp.event} />}
          <div className="flex items-end gap-2 lg:col-span-4">
            <Button type="submit" variant="blue" size="sm">Filter</Button>
            {hasFilters && <ButtonLink href="/transactions" variant="ice" size="sm">Clear</ButtonLink>}
            <span className="text-xs text-muted ml-auto self-center">{result.total} {result.total === 1 ? "entry" : "entries"}</span>
          </div>
        </form>
      </Card>

      <Card>
        <TxTable rows={result.rows} totals={result.totals} emptyTitle={hasFilters ? "No matches" : "No entries yet"} emptyBody={hasFilters ? "Try widening the filters." : undefined} />
        {result.pages > 1 && (
          <div className="flex items-center justify-between gap-3 mt-4 text-sm">
            {result.page > 1 ? <Link href={qs({ page: String(result.page - 1) })} className="btn btn-ice btn-sm">← Newer</Link> : <span />}
            <span className="text-muted">Page {result.page} of {result.pages}</span>
            {result.page < result.pages ? <Link href={qs({ page: String(result.page + 1) })} className="btn btn-ice btn-sm">Older →</Link> : <span />}
          </div>
        )}
      </Card>
    </>
  );
}
