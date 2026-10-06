"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@phanet/supabase/server";
import { requiredApproverRole, ROLE_LABELS } from "@phanet/supabase/roles";
import { money } from "@phanet/supabase/format";
import type { MemberSearchRow, TxChannel } from "@phanet/supabase/types";
import { CHANNELS, str } from "@/lib/finance";

function safePath(v: FormDataEntryValue | null, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}
function withParam(path: string, key: "ok" | "error", msg: string) {
  const [base, qs] = path.split("?");
  const sp = new URLSearchParams(qs ?? "");
  sp.delete("ok"); sp.delete("error");
  sp.set(key, msg);
  return `${base}?${sp.toString()}`;
}
function friendly(message: string) {
  if (/row-level security|permission|not allowed/i.test(message)) return "You don't have permission to do that.";
  if (/transactions_reference_key|duplicate key/i.test(message)) return "That reference is already on another transaction.";
  return message;
}
function revalidateAll() {
  revalidatePath("/", "layout");
}

/** Member search for the picker (rpc search_members). */
export async function searchMembersAction(q: string): Promise<MemberSearchRow[]> {
  const s = String(q ?? "").trim();
  if (s.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_members", { q: s, lim: 20 });
  return (data ?? []) as MemberSearchRow[];
}

type Common = { amount: number; channel: TxChannel; program_id: string | null; event_id: string | null; budget_id: string | null; budget_line_id: string | null; description: string | null; occurred_at: string };
function readCommon(fd: FormData): { ok: true; v: Common } | { ok: false; error: string } {
  const amount = Number(fd.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter an amount greater than zero." };
  const channel = str(fd, "channel") as TxChannel | null;
  if (!channel || !CHANNELS.includes(channel)) return { ok: false, error: "Pick a payment channel." };
  const line = str(fd, "budget_line"); // "budgetId:lineId"
  let budget_id: string | null = null, budget_line_id: string | null = null;
  if (line) { const [b, l] = line.split(":"); budget_id = b || null; budget_line_id = l || null; }
  const occurredRaw = str(fd, "occurred_at");
  const occurred = occurredRaw ? new Date(occurredRaw) : new Date();
  if (Number.isNaN(occurred.getTime())) return { ok: false, error: "That date doesn't look right." };
  return {
    ok: true,
    v: {
      amount: Math.round(amount * 100) / 100, channel,
      program_id: str(fd, "program_id"), event_id: str(fd, "event_id"), budget_id, budget_line_id,
      description: str(fd, "description"), occurred_at: occurred.toISOString(),
    },
  };
}

export async function recordIncomeAction(fd: FormData) {
  const back = "/transactions/new?kind=income";
  const category = str(fd, "category");
  if (!category) redirect(withParam(back, "error", "Pick a fund or category."));
  const c = readCommon(fd);
  if (!c.ok) redirect(withParam(back, "error", c.error));
  const session = await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").insert({
    kind: "income", category, ...c.v,
    status: c.v.channel === "cash" ? "counted" : "paid", source: "manual",
    payer_name: str(fd, "payer_name"), member_id: str(fd, "member_id"), reference: str(fd, "reference"),
    recorded_by: session?.user.id ?? null,
  }).select("id").single();
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  revalidateAll();
  redirect(withParam(`/transactions/${data.id}`, "ok", `Income of ${money(c.v.amount)} recorded.`));
}

export async function recordExpenseAction(fd: FormData) {
  const back = "/transactions/new?kind=expense";
  const category = str(fd, "category");
  if (!category) redirect(withParam(back, "error", "Give the expense a category."));
  const c = readCommon(fd);
  if (!c.ok) redirect(withParam(back, "error", c.error));
  const session = await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").insert({
    kind: "expense", category, ...c.v, status: "pending", source: "manual",
    payee_name: str(fd, "payee_name"), reference: str(fd, "reference"),
    recorded_by: session?.user.id ?? null,
  }).select("id").single();
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  revalidateAll();
  const approver = ROLE_LABELS[requiredApproverRole(c.v.amount)];
  redirect(withParam(`/transactions/${data.id}`, "ok", `Expense of ${money(c.v.amount)} recorded. Needs approval by ${approver}.`));
}

/** Edit an income or a still-pending expense (RLS enforces the rest). */
export async function updateTransactionAction(fd: FormData) {
  const id = str(fd, "id");
  if (!id) redirect("/transactions");
  const back = `/transactions/${id}`;
  const kind = str(fd, "kind");
  const category = str(fd, "category");
  if (!category) redirect(withParam(back, "error", "Category is required."));
  const c = readCommon(fd);
  if (!c.ok) redirect(withParam(back, "error", c.error));
  const supabase = await createClient();
  const patch: Record<string, unknown> = { category, ...c.v, reference: str(fd, "reference") };
  if (kind === "income") {
    patch.payer_name = str(fd, "payer_name");
    patch.member_id = str(fd, "member_id");
    const status = str(fd, "status");
    if (status === "paid" || status === "counted") patch.status = status;
  } else {
    patch.payee_name = str(fd, "payee_name");
  }
  const { data, error } = await supabase.from("transactions").update(patch).eq("id", id).select("id");
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  if (!data?.length) redirect(withParam(back, "error", "Nothing was changed — this entry may no longer be editable."));
  revalidateAll();
  redirect(withParam(back, "ok", "Saved."));
}

/** rpc decide_expense — approve or reject a pending expense. */
export async function decideExpenseAction(fd: FormData) {
  const id = str(fd, "id");
  const decision = str(fd, "decision");
  const next = safePath(fd.get("next"), id ? `/transactions/${id}` : "/approvals");
  if (!id || (decision !== "approved" && decision !== "rejected")) redirect(withParam(next, "error", "Pick approve or reject."));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decide_expense", { p_id: id, p_decision: decision, p_note: str(fd, "note") });
  if (error) redirect(withParam(next, "error", friendly(error.message)));
  revalidateAll();
  const t = data as { amount?: number } | null;
  redirect(withParam(next, "ok", `${decision === "approved" ? "Approved" : "Rejected"}${t?.amount ? ` ${money(t.amount)}` : ""}.`));
}

/** rpc mark_expense_paid — disburse an approved expense. */
export async function markPaidAction(fd: FormData) {
  const id = str(fd, "id");
  const next = safePath(fd.get("next"), id ? `/transactions/${id}` : "/approvals");
  if (!id) redirect("/approvals");
  const channel = str(fd, "channel") as TxChannel | null;
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_expense_paid", { p_id: id, p_channel: channel && CHANNELS.includes(channel) ? channel : null });
  if (error) redirect(withParam(next, "error", friendly(error.message)));
  revalidateAll();
  redirect(withParam(next, "ok", "Marked as paid."));
}

/** Admin only (RLS). */
export async function deleteTransactionAction(fd: FormData) {
  const id = str(fd, "id");
  if (!id) redirect("/transactions");
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").delete().eq("id", id).select("id");
  if (error) redirect(withParam(`/transactions/${id}`, "error", friendly(error.message)));
  if (!data?.length) redirect(withParam(`/transactions/${id}`, "error", "Only an admin can delete entries."));
  revalidateAll();
  redirect(withParam("/transactions", "ok", "Entry deleted."));
}
