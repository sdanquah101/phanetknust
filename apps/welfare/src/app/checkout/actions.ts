"use server";
import { createClient } from "@phanet/supabase/server";

export type CheckoutState = { error?: string; code?: string } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitRequestAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const hall_room = String(formData.get("hall_room") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (name.length < 2) return { error: "Tell us your full name." };
  if (phone.replace(/\D/g, "").length < 9) return { error: "Enter a phone number we can reach you on (e.g. 024 123 4567)." };

  let items: { item_id: string; qty: number }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("items") ?? "[]")) as unknown;
    if (!Array.isArray(parsed)) throw new Error();
    items = parsed
      .map((x) => ({ item_id: String((x as { item_id?: unknown }).item_id ?? ""), qty: Number((x as { qty?: unknown }).qty) }))
      .filter((x) => UUID.test(x.item_id) && Number.isInteger(x.qty) && x.qty > 0);
  } catch {
    return { error: "Your basket looks broken. Go back to the shop and pick again." };
  }
  if (items.length === 0) return { error: "Pick at least one item." };
  if (items.length > 6) return { error: "A request can hold at most 6 different items." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_welfare_request", {
    p_name: name,
    p_phone: phone,
    p_hall_room: hall_room || null,
    p_note: note || null,
    p_items: items,
  });
  if (error) return { error: error.message };
  const code = typeof data === "string" ? data : null;
  if (!code) return { error: "Something went wrong. Please try again." };
  return { code };
}
