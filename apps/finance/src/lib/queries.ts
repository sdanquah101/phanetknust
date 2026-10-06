import "server-only";
import { createClient, type Db } from "@phanet/supabase/server";
import type { Budget, BudgetLine, BudgetSummary, Event, GivingFund, Program, Transaction } from "@phanet/supabase/types";
import { DEFAULT_PERIOD, periodRange, yearRange, type Period } from "./period";

export { periodRange, yearRange, periodLabel, yearOptions, DEFAULT_PERIOD } from "./period";
export type { Period } from "./period";

/** Transaction row with the joined names we show in tables. */
export type TxRow = Transaction & { programs?: { name: string } | null; events?: { title: string } | null; budget_lines?: { name: string } | null };

export const TX_SELECT = "*, programs(name), events(title), budget_lines(name)";
export const PAGE_SIZE = 50;

/** Current academic period from site_settings.academic; falls back to 2026/27 S1. */
export async function getPeriod(db?: Db): Promise<Period> {
  try {
    const supabase = db ?? (await createClient());
    const { data } = await supabase.from("site_settings").select("value").eq("key", "academic").maybeSingle();
    const v = (data?.value ?? null) as { year?: string; semester?: number } | null;
    if (v?.year && (v.semester === 1 || v.semester === 2)) return { year: v.year, semester: v.semester };
  } catch {
    /* fall through */
  }
  return DEFAULT_PERIOD;
}

export async function listPrograms(db: Db): Promise<Program[]> {
  const { data } = await db.from("programs").select("*").order("sort_order").order("name");
  return (data ?? []) as Program[];
}

export async function listEvents(db: Db, limit = 200): Promise<Event[]> {
  const { data } = await db.from("events").select("*").order("starts_at", { ascending: false }).limit(limit);
  return (data ?? []) as Event[];
}

export async function listFunds(db: Db): Promise<GivingFund[]> {
  const { data } = await db.from("giving_funds").select("*").order("sort_order").order("name");
  return (data ?? []) as GivingFund[];
}

export type BudgetWithLines = Budget & { budget_lines: BudgetLine[] };
/** Active (and draft) budgets with their lines, for the budget-line pickers. */
export async function listOpenBudgetsWithLines(db: Db): Promise<BudgetWithLines[]> {
  const { data } = await db.from("budgets").select("*, budget_lines(*)").in("status", ["active", "draft"]).order("created_at", { ascending: false });
  return ((data ?? []) as BudgetWithLines[]).map((b) => ({ ...b, budget_lines: [...(b.budget_lines ?? [])].sort((a, c) => a.sort_order - c.sort_order || a.name.localeCompare(c.name)) }));
}

export async function listBudgetSummaries(db: Db): Promise<BudgetSummary[]> {
  const { data } = await db.from("budget_summary").select("*").order("academic_year", { ascending: false }).order("semester", { ascending: false });
  return (data ?? []) as BudgetSummary[];
}

export async function getBudget(db: Db, id: string): Promise<BudgetWithLines | null> {
  const { data } = await db.from("budgets").select("*, budget_lines(*)").eq("id", id).maybeSingle();
  if (!data) return null;
  const b = data as BudgetWithLines;
  return { ...b, budget_lines: [...(b.budget_lines ?? [])].sort((a, c) => a.sort_order - c.sort_order || a.name.localeCompare(c.name)) };
}

/** Distinct expense categories already used, for the datalist. */
export async function listExpenseCategories(db: Db): Promise<string[]> {
  const { data } = await db.from("transactions").select("category").eq("kind", "expense").order("category").limit(1000);
  const set = new Set<string>();
  ((data ?? []) as { category: string }[]).forEach((r) => set.add(r.category));
  return [...set].sort();
}

export type TxFilters = {
  kind?: string; category?: string; channel?: string; program?: string; status?: string;
  from?: string; to?: string; q?: string; budget?: string; event?: string;
};

/** Filter builder for transactions. Typed loosely: the fully generic PostgREST builder type is too deep for tsc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxQuery = any;
function applyFilters<T extends TxQuery>(input: T, f: TxFilters): T {
  let q: TxQuery = input;
  if (f.kind === "income" || f.kind === "expense") q = q.eq("kind", f.kind);
  if (f.category) q = q.eq("category", f.category);
  if (f.channel) q = q.eq("channel", f.channel);
  if (f.program === "none") q = q.is("program_id", null);
  else if (f.program) q = q.eq("program_id", f.program);
  if (f.budget) q = q.eq("budget_id", f.budget);
  if (f.event) q = q.eq("event_id", f.event);
  if (f.status) q = q.eq("status", f.status);
  if (f.from) q = q.gte("occurred_at", dayStart(f.from));
  if (f.to) q = q.lte("occurred_at", dayEnd(f.to));
  if (f.q) {
    const s = f.q.replace(/[%,()]/g, " ").trim();
    if (s) q = q.or(`payer_name.ilike.%${s}%,payee_name.ilike.%${s}%,description.ilike.%${s}%,reference.ilike.%${s}%,category.ilike.%${s}%`);
  }
  return q;
}

/** "2026-10-01" → ISO at start of that day (UTC). Full ISO strings pass through. */
export function dayStart(d: string) {
  return d.length === 10 ? `${d}T00:00:00.000Z` : d;
}
export function dayEnd(d: string) {
  return d.length === 10 ? `${d}T23:59:59.999Z` : d;
}

export type TxTotals = { income: number; expense: number; pending: number; count: number };

/** Paged, filtered ledger plus totals for the whole filtered set. */
export async function listTransactions(db: Db, f: TxFilters, page = 1): Promise<{ rows: TxRow[]; total: number; totals: TxTotals; page: number; pages: number }> {
  const from = (Math.max(1, page) - 1) * PAGE_SIZE;
  const rowsQ = applyFilters(db.from("transactions").select(TX_SELECT, { count: "exact" }), f).order("occurred_at", { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const totQ = applyFilters(db.from("transactions").select("kind, amount, status"), f).limit(5000);
  const [{ data, count }, { data: tot }] = await Promise.all([rowsQ, totQ]);
  const totals = sumTotals((tot ?? []) as Pick<Transaction, "kind" | "amount" | "status">[]);
  const total = count ?? 0;
  return { rows: (data ?? []) as TxRow[], total, totals, page: Math.max(1, page), pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function sumTotals(rows: Pick<Transaction, "kind" | "amount" | "status">[]): TxTotals {
  const t: TxTotals = { income: 0, expense: 0, pending: 0, count: rows.length };
  for (const r of rows) {
    const a = Number(r.amount);
    if (r.kind === "income") t.income += a;
    else if (r.status === "approved" || r.status === "paid") t.expense += a;
    else if (r.status === "pending") t.pending += a;
  }
  return t;
}

export async function getTransaction(db: Db, id: string): Promise<TxRow | null> {
  const { data } = await db.from("transactions").select(TX_SELECT).eq("id", id).maybeSingle();
  return (data as TxRow | null) ?? null;
}

/** Light rows for aggregations within a date range. */
export type TxLite = Pick<Transaction, "id" | "kind" | "amount" | "status" | "category" | "program_id" | "event_id" | "occurred_at" | "approver_role">;
export async function listTxInRange(db: Db, range: { from: string; to: string }, extra: Partial<TxFilters> = {}): Promise<TxLite[]> {
  const q = applyFilters(db.from("transactions").select("id, kind, amount, status, category, program_id, event_id, occurred_at, approver_role"), { ...extra })
    .gte("occurred_at", range.from).lt("occurred_at", range.to).limit(10000);
  const { data } = await q;
  return (data ?? []) as TxLite[];
}

export async function listTxForSemester(db: Db, period: Period) {
  return listTxInRange(db, periodRange(period.year, period.semester));
}

export async function listTxForYear(db: Db, year: string, extra: Partial<TxFilters> = {}) {
  return listTxInRange(db, yearRange(year), extra);
}

export async function listRecent(db: Db, limit = 10): Promise<TxRow[]> {
  const { data } = await db.from("transactions").select(TX_SELECT).order("occurred_at", { ascending: false }).limit(limit);
  return (data ?? []) as TxRow[];
}

export async function listPendingExpenses(db: Db): Promise<TxRow[]> {
  const { data } = await db.from("transactions").select(TX_SELECT).eq("kind", "expense").eq("status", "pending").order("occurred_at", { ascending: true }).limit(500);
  return (data ?? []) as TxRow[];
}

export async function listRecentlyDecided(db: Db, limit = 20): Promise<TxRow[]> {
  const { data } = await db.from("transactions").select(TX_SELECT).eq("kind", "expense").in("status", ["approved", "rejected", "paid"]).not("approved_at", "is", null).order("approved_at", { ascending: false }).limit(limit);
  return (data ?? []) as TxRow[];
}

/** Display names for approver / recorder user ids (profiles are staff-readable). */
export async function profileNames(db: Db, ids: (string | null | undefined)[]): Promise<Record<string, string>> {
  const uniq = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!uniq.length) return {};
  const { data } = await db.from("profiles").select("id, full_name, email").in("id", uniq);
  const out: Record<string, string> = {};
  ((data ?? []) as { id: string; full_name: string | null; email: string | null }[]).forEach((p) => { out[p.id] = p.full_name || p.email || "Someone"; });
  return out;
}
