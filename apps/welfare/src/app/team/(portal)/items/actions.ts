"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;
const REASONS = ["donation", "purchase", "adjustment", "returned"] as const;

function withParam(path: string, key: "ok" | "error", msg: string) {
  const url = new URL(path, "http://x");
  url.searchParams.set(key, msg);
  return url.pathname + url.search;
}
function revalidateAll(id?: string) {
  revalidatePath("/");
  revalidatePath("/team");
  revalidatePath("/team/items");
  revalidatePath("/team/movements");
  if (id) revalidatePath(`/team/items/${id}`);
}

type ItemFields = { name: string; category: string; unit: string; max_per_request: number };
function readFields(formData: FormData): ItemFields | string {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Groceries";
  const unit = String(formData.get("unit") ?? "").trim() || "pc";
  const max_per_request = Number(formData.get("max_per_request"));
  if (name.length < 2) return "Give the item a name.";
  if (!Number.isInteger(max_per_request) || max_per_request < 1 || max_per_request > 50) return "Max per request must be a whole number from 1 to 50.";
  return { name, category, unit, max_per_request };
}

async function uploadImage(formData: FormData): Promise<string | null | "error"> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) return "error";
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `items/${crypto.randomUUID()}.${ext}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from("welfare").upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) return "error";
  return supabase.storage.from("welfare").getPublicUrl(path).data.publicUrl;
}

export async function createItemAction(formData: FormData) {
  const fields = readFields(formData);
  if (typeof fields === "string") redirect(withParam("/team/items", "error", fields));
  const qty = Number(formData.get("qty_available"));
  if (!Number.isInteger(qty) || qty < 0) redirect(withParam("/team/items", "error", "Quantity must be 0 or more."));

  const image_url = await uploadImage(formData);
  if (image_url === "error") redirect(withParam("/team/items", "error", "Image upload failed. Use a JPG/PNG under 5MB."));

  const supabase = await createClient();
  const { data, error } = await supabase.from("welfare_items").insert({ ...fields, qty_available: 0, image_url, is_active: true }).select("id").single();
  if (error || !data) redirect(withParam("/team/items", "error", error?.message ?? "Could not add the item."));

  if (qty > 0) {
    const reason = String(formData.get("reason") ?? "donation");
    const { error: e2 } = await supabase.rpc("adjust_welfare_stock", {
      p_item: (data as { id: string }).id,
      p_delta: qty,
      p_reason: REASONS.includes(reason as (typeof REASONS)[number]) ? reason : "donation",
      p_note: "Opening stock",
    });
    if (e2) {
      revalidateAll();
      redirect(withParam("/team/items", "error", `Item added but stock not recorded: ${e2.message}`));
    }
  }
  revalidateAll();
  redirect(withParam("/team/items", "ok", `${fields.name} added to the shelf.`));
}

export async function updateItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const back = `/team/items/${id}`;
  if (!UUID.test(id)) redirect(withParam("/team/items", "error", "Item not found."));
  const fields = readFields(formData);
  if (typeof fields === "string") redirect(withParam(back, "error", fields));

  const image_url = await uploadImage(formData);
  if (image_url === "error") redirect(withParam(back, "error", "Image upload failed. Use a JPG/PNG under 5MB."));

  const patch: Record<string, unknown> = { ...fields, is_active: formData.get("is_active") === "on" };
  if (image_url) patch.image_url = image_url;
  if (formData.get("remove_image") === "on" && !image_url) patch.image_url = null;

  const supabase = await createClient();
  const { error } = await supabase.from("welfare_items").update(patch).eq("id", id);
  if (error) redirect(withParam(back, "error", error.message));
  revalidateAll(id);
  redirect(withParam(back, "ok", "Item saved."));
}

export async function toggleItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("is_active") === "true";
  if (!UUID.test(id)) redirect(withParam("/team/items", "error", "Item not found."));
  const supabase = await createClient();
  const { error } = await supabase.from("welfare_items").update({ is_active: active }).eq("id", id);
  if (error) redirect(withParam("/team/items", "error", error.message));
  revalidateAll(id);
  redirect(withParam("/team/items", "ok", active ? "Item is back on the shelf." : "Item hidden from the shop."));
}

export async function adjustStockAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const back = `/team/items/${id}`;
  if (!UUID.test(id)) redirect(withParam("/team/items", "error", "Item not found."));
  const direction = formData.get("direction") === "out" ? -1 : 1;
  const amount = Number(formData.get("amount"));
  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isInteger(amount) || amount < 1) redirect(withParam(back, "error", "Enter a whole number of units."));
  if (!REASONS.includes(reason as (typeof REASONS)[number])) redirect(withParam(back, "error", "Pick a reason."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_welfare_stock", { p_item: id, p_delta: direction * amount, p_reason: reason, p_note: note || null });
  if (error) redirect(withParam(back, "error", error.message.includes("check") ? "That would take stock below zero." : error.message));
  revalidateAll(id);
  redirect(withParam(back, "ok", `${direction > 0 ? "+" : "−"}${amount} recorded.`));
}
