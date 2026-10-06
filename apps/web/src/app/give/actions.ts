"use server";
import { redirect } from "next/navigation";
import { initializeTransaction, newReference } from "@phanet/supabase/paystack";
import { SITE_URL } from "@/lib/links";

export type GiveState = { error?: string } | undefined;

export async function giveAction(_prev: GiveState, formData: FormData): Promise<GiveState> {
  const fund = String(formData.get("fund") ?? "offering");
  const amount = Number(formData.get("amount"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const anonymous = formData.get("anonymous") === "on";
  const method = String(formData.get("method") ?? "mobile_money");
  if (!email) return { error: "We need an email for your receipt." };
  if (!Number.isFinite(amount) || amount < 1) return { error: "Enter an amount of at least GH₵ 1." };
  if (amount > 100000) return { error: "For amounts above GH₵ 100,000 please contact the finance team." };
  let url: string;
  try {
    const init = await initializeTransaction({
      email, amount, reference: newReference("GIVE"),
      callback_url: `${SITE_URL}/give/thanks`,
      metadata: { kind: "giving", fund, name: anonymous ? "" : name, phone: anonymous ? "" : phone, note, anonymous },
      channels: method === "card" ? ["card"] : ["mobile_money"],
    });
    url = init.authorization_url;
  } catch (e) {
    return { error: e instanceof Error ? `Payment could not start: ${e.message}` : "Payment could not start." };
  }
  redirect(url);
}
