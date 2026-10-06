"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { slugify } from "@phanet/supabase/format";
import { done, fail } from "@/lib/flash";
import { bool, isUuid, num, opt, str } from "@/lib/form";

export async function saveFund(formData: FormData) {
  const id = str(formData, "id");
  const isNew = !isUuid(id);
  const back = isNew ? "/funds" : `/funds/${id}`;
  const name = str(formData, "name");
  if (!name) fail(back, "Give the fund a name.");
  const slug = slugify(str(formData, "slug") || name);
  const targetRaw = str(formData, "target_amount");
  const target = targetRaw ? num(formData, "target_amount", -1) : null;
  if (target !== null && target < 0) fail(back, "Enter a valid target amount.");
  const row = {
    slug,
    name,
    description: opt(formData, "description"),
    target_amount: target,
    is_active: bool(formData, "is_active"),
    sort_order: Math.round(num(formData, "sort_order", 0)),
  };
  const supabase = await createClient();
  const dup = (m: string) => (m.includes("duplicate") ? "That slug is already used by another fund." : m);
  if (isNew) {
    const { error } = await supabase.from("giving_funds").insert(row);
    if (error) fail(back, dup(error.message));
    revalidatePath("/funds");
    done("/funds", `${name} added.`);
  }
  const { error } = await supabase.from("giving_funds").update(row).eq("id", id);
  if (error) fail(back, dup(error.message));
  revalidatePath("/funds");
  revalidatePath(back);
  done("/funds", `${name} saved.`);
}

export async function toggleFund(formData: FormData) {
  const id = str(formData, "id");
  const active = bool(formData, "is_active");
  if (!isUuid(id)) fail("/funds", "Unknown fund.");
  const supabase = await createClient();
  const { error } = await supabase.from("giving_funds").update({ is_active: active }).eq("id", id);
  if (error) fail("/funds", error.message);
  revalidatePath("/funds");
  done("/funds", active ? "Fund is open for giving." : "Fund closed.");
}

export async function deleteFund(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail("/funds", "Unknown fund.");
  const supabase = await createClient();
  const { error } = await supabase.from("giving_funds").delete().eq("id", id);
  if (error) fail(`/funds/${id}`, error.message);
  revalidatePath("/funds");
  done("/funds", "Fund deleted.");
}
