"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { slugify } from "@phanet/supabase/format";
import { str } from "@/lib/finance";

const BACK = "/funds";
function withParam(key: "ok" | "error", msg: string) {
  return `${BACK}?${key}=${encodeURIComponent(msg)}`;
}
function friendly(message: string) {
  if (/row-level security|permission|not allowed/i.test(message)) return "Only the finance head or an admin can change giving funds.";
  if (/giving_funds_slug_key|duplicate key/i.test(message)) return "A fund with that slug already exists.";
  return message;
}
function readTarget(fd: FormData): number | null | "bad" {
  const raw = str(fd, "target_amount");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : "bad";
}

export async function createFundAction(fd: FormData) {
  const name = str(fd, "name");
  if (!name) redirect(withParam("error", "Name the fund."));
  const slug = slugify(str(fd, "slug") ?? name);
  if (!slug) redirect(withParam("error", "Slug can't be empty."));
  const target = readTarget(fd);
  if (target === "bad") redirect(withParam("error", "Target must be a number."));
  const supabase = await createClient();
  const { error } = await supabase.from("giving_funds").insert({ name, slug, description: str(fd, "description"), target_amount: target, is_active: fd.get("is_active") !== "off", sort_order: Number(fd.get("sort_order")) || 0 });
  if (error) redirect(withParam("error", friendly(error.message)));
  revalidatePath(BACK);
  redirect(withParam("ok", `Fund “${name}” added.`));
}

export async function updateFundAction(fd: FormData) {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!id) redirect(BACK);
  if (!name) redirect(withParam("error", "Name the fund."));
  const target = readTarget(fd);
  if (target === "bad") redirect(withParam("error", "Target must be a number."));
  const supabase = await createClient();
  const { data, error } = await supabase.from("giving_funds").update({ name, description: str(fd, "description"), target_amount: target, sort_order: Number(fd.get("sort_order")) || 0 }).eq("id", id).select("id");
  if (error) redirect(withParam("error", friendly(error.message)));
  if (!data?.length) redirect(withParam("error", "Only the finance head or an admin can change giving funds."));
  revalidatePath(BACK);
  redirect(withParam("ok", `Fund “${name}” saved.`));
}

export async function toggleFundAction(fd: FormData) {
  const id = str(fd, "id");
  const to = str(fd, "to") === "true";
  if (!id) redirect(BACK);
  const supabase = await createClient();
  const { data, error } = await supabase.from("giving_funds").update({ is_active: to }).eq("id", id).select("id");
  if (error) redirect(withParam("error", friendly(error.message)));
  if (!data?.length) redirect(withParam("error", "Only the finance head or an admin can change giving funds."));
  revalidatePath(BACK);
  redirect(withParam("ok", to ? "Fund is now active." : "Fund paused."));
}
