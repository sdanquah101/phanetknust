"use server";
import { redirect } from "next/navigation";
import { createClient } from "@phanet/supabase/server";
import { initializeTransaction } from "@phanet/supabase/paystack";
import { SITE_URL } from "@/lib/links";

export type CheckoutState = { error?: string } | undefined;

export async function checkoutAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  let items: { product_id: string; qty: number; option: string | null }[] = [];
  try { items = JSON.parse(String(formData.get("items") ?? "[]")); } catch { items = []; }
  if (!name || !email || !phone) return { error: "Name, email and phone are required." };
  if (!items.length) return { error: "Your bag is empty." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_order", { p_name: name, p_email: email, p_phone: phone, p_note: note, p_items: items });
  if (error) return { error: error.message };
  const order = (Array.isArray(data) ? data[0] : data) as { order_id: string; order_no: string; subtotal: number };

  let url: string;
  try {
    const init = await initializeTransaction({
      email, amount: Number(order.subtotal),
      reference: `${order.order_no}-${Date.now().toString(36).toUpperCase()}`,
      callback_url: `${SITE_URL}/shop/thanks?order=${encodeURIComponent(order.order_no)}&email=${encodeURIComponent(email)}`,
      metadata: { kind: "order", order_id: order.order_id, order_no: order.order_no, name, phone, custom_fields: [{ display_name: "Order", variable_name: "order_no", value: order.order_no }] },
      channels: ["mobile_money", "card"],
    });
    url = init.authorization_url;
  } catch (e) {
    return { error: e instanceof Error ? `Payment could not start: ${e.message}` : "Payment could not start." };
  }
  redirect(url);
}
