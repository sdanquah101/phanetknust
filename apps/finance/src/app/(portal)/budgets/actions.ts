"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@phanet/supabase/server";
import { str } from "@/lib/finance";

function withParam(path: string, key: "ok" | "error", msg: string) {
  const [base, qs] = path.split("?");
  const sp = new URLSearchParams(qs ?? "");
  sp.delete("ok"); sp.delete("error");
  sp.set(key, msg);
  return `${base}?${sp.toString()}`;
}
function friendly(message: string) {
  if (/row-level security|permission|not allowed/i.test(message)) return "You don't have permission to do that.";
  return message;
}

export async function createBudgetAction(fd: FormData) {
  const back = "/budgets/new";
  const title = str(fd, "title");
  const academic_year = str(fd, "academic_year");
  if (!title) redirect(withParam(back, "error", "Give the budget a title."));
  if (!academic_year || !/^\d{4}\/\d{2}$/.test(academic_year)) redirect(withParam(back, "error", "Academic year looks like 2026/27."));
  const semRaw = str(fd, "semester");
  const semester = semRaw === "1" || semRaw === "2" ? Number(semRaw) : null;
  const session = await getSession();
  const supabase = await createClient();
  const { data, error } = await supabase.from("budgets").insert({
    title, academic_year, semester, program_id: str(fd, "program_id"), event_id: str(fd, "event_id"), notes: str(fd, "notes"),
    status: "draft", created_by: session?.user.id ?? null,
  }).select("id").single();
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  revalidatePath("/budgets");
  redirect(withParam(`/budgets/${data.id}`, "ok", "Budget created. Add your lines below."));
}

export async function setBudgetStatusAction(fd: FormData) {
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!id) redirect("/budgets");
  const back = `/budgets/${id}`;
  if (status !== "draft" && status !== "active" && status !== "closed") redirect(withParam(back, "error", "Unknown status."));
  const supabase = await createClient();
  const { data, error } = await supabase.from("budgets").update({ status }).eq("id", id).select("id");
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  if (!data?.length) redirect(withParam(back, "error", "You don't have permission to change this budget."));
  revalidatePath("/budgets"); revalidatePath(back);
  redirect(withParam(back, "ok", `Budget is now ${status}.`));
}

export async function updateBudgetAction(fd: FormData) {
  const id = str(fd, "id");
  if (!id) redirect("/budgets");
  const back = `/budgets/${id}`;
  const title = str(fd, "title");
  if (!title) redirect(withParam(back, "error", "Title is required."));
  const supabase = await createClient();
  const { data, error } = await supabase.from("budgets").update({ title, notes: str(fd, "notes"), program_id: str(fd, "program_id"), event_id: str(fd, "event_id") }).eq("id", id).select("id");
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  if (!data?.length) redirect(withParam(back, "error", "You don't have permission to change this budget."));
  revalidatePath("/budgets"); revalidatePath(back);
  redirect(withParam(back, "ok", "Budget saved."));
}

export async function addLineAction(fd: FormData) {
  const budget_id = str(fd, "budget_id");
  if (!budget_id) redirect("/budgets");
  const back = `/budgets/${budget_id}`;
  const name = str(fd, "name");
  const kind = str(fd, "kind");
  const planned_amount = Number(fd.get("planned_amount"));
  if (!name) redirect(withParam(back, "error", "Name the line."));
  if (kind !== "income" && kind !== "expense") redirect(withParam(back, "error", "Pick income or expense."));
  if (!Number.isFinite(planned_amount) || planned_amount < 0) redirect(withParam(back, "error", "Planned amount must be zero or more."));
  const sort_order = Number(fd.get("sort_order")) || 0;
  const supabase = await createClient();
  const { error } = await supabase.from("budget_lines").insert({ budget_id, name, kind, planned_amount: Math.round(planned_amount * 100) / 100, sort_order });
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  revalidatePath("/budgets"); revalidatePath(back);
  redirect(withParam(back, "ok", `Added “${name}”.`));
}

export async function deleteLineAction(fd: FormData) {
  const id = str(fd, "id");
  const budget_id = str(fd, "budget_id");
  const back = budget_id ? `/budgets/${budget_id}` : "/budgets";
  if (!id) redirect(back);
  const supabase = await createClient();
  const { data, error } = await supabase.from("budget_lines").delete().eq("id", id).select("id");
  if (error) redirect(withParam(back, "error", friendly(error.message)));
  if (!data?.length) redirect(withParam(back, "error", "You don't have permission to remove lines."));
  revalidatePath("/budgets"); revalidatePath(back);
  redirect(withParam(back, "ok", "Line removed."));
}

export async function deleteBudgetAction(fd: FormData) {
  const id = str(fd, "id");
  if (!id) redirect("/budgets");
  const supabase = await createClient();
  const { data, error } = await supabase.from("budgets").delete().eq("id", id).select("id");
  if (error) redirect(withParam(`/budgets/${id}`, "error", friendly(error.message)));
  if (!data?.length) redirect(withParam(`/budgets/${id}`, "error", "You don't have permission to delete this budget."));
  revalidatePath("/budgets");
  redirect(withParam("/budgets", "ok", "Budget deleted."));
}
