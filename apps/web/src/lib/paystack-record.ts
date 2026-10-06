import "server-only";
import { createAdminClient } from "@phanet/supabase/server";
import { ledgerChannel, verifyTransaction } from "@phanet/supabase/paystack";
import { sendEmail } from "@phanet/supabase/email";
import { money } from "@phanet/supabase/format";

export type PaystackCharge = {
  reference: string;
  status: string;
  amount: number; // pesewas
  channel?: string;
  paid_at?: string;
  customer?: { email?: string };
  authorization?: { bank?: string | null; channel?: string };
  metadata?: Record<string, unknown> | null;
};

/**
 * Idempotently record a successful Paystack charge in the ledger (and mark shop orders paid).
 * Called from the webhook and, as a fallback, from the thank-you pages after verify.
 */
export async function recordPaystackPayment(c: PaystackCharge): Promise<{ recorded: boolean; kind: string }> {
  if (c.status !== "success") return { recorded: false, kind: "none" };
  const supabase = createAdminClient();
  const meta = (c.metadata ?? {}) as Record<string, string | boolean | undefined>;
  const kind = String(meta.kind ?? "giving");
  const amount = Math.round(c.amount) / 100;
  const channel = ledgerChannel(c.channel ?? c.authorization?.channel, c.authorization?.bank);
  const email = c.customer?.email ?? null;

  const { data: existing } = await supabase.from("transactions").select("id").eq("reference", c.reference).maybeSingle();
  if (existing) return { recorded: false, kind };

  if (kind === "order") {
    const orderId = String(meta.order_id ?? "");
    const { data: order } = await supabase.from("orders").select("id,order_no,status,buyer_name,buyer_phone,buyer_email").eq("id", orderId).maybeSingle();
    if (order && order.status === "pending") {
      await supabase.from("orders").update({ status: "paid", paid_at: c.paid_at ?? new Date().toISOString(), paystack_reference: c.reference }).eq("id", orderId);
    }
    await supabase.from("transactions").insert({
      kind: "income", category: "shop", amount, channel, status: "paid", source: "paystack", reference: c.reference,
      payer_name: order?.buyer_name ?? (meta.name as string | undefined) ?? null, payer_email: email, payer_phone: order?.buyer_phone ?? null,
      description: `Shop order ${order?.order_no ?? meta.order_no ?? ""}`.trim(), occurred_at: c.paid_at ?? new Date().toISOString(), metadata: { paystack: true, order_id: orderId },
    });
    if (email) {
      void sendEmail({ to: email, subject: `Your PHANET order ${order?.order_no ?? ""} is confirmed`, html: `<p>Akwaaba! We received ${money(amount)} for order <b>${order?.order_no ?? ""}</b>.</p><p>Collect at Midweek Altar, Great Hall foyer. Show this email.</p><p>— PHANET KNUST</p>` });
    }
    return { recorded: true, kind };
  }

  const fund = String(meta.fund ?? "offering");
  const anonymous = meta.anonymous === true || meta.anonymous === "true";
  await supabase.from("transactions").insert({
    kind: "income", category: fund, amount, channel, status: "paid", source: "paystack", reference: c.reference,
    payer_name: anonymous ? "Anonymous" : ((meta.name as string | undefined) ?? null), payer_email: anonymous ? null : email, payer_phone: anonymous ? null : ((meta.phone as string | undefined) ?? null),
    description: (meta.note as string | undefined) || `Online giving · ${fund}`, occurred_at: c.paid_at ?? new Date().toISOString(), metadata: { paystack: true, anonymous },
  });
  if (email) {
    void sendEmail({ to: email, subject: `Receipt · ${money(amount)} to PHANET KNUST`, html: `<p>Thank you for sowing ${money(amount)} into <b>${fund}</b>.</p><p>Reference: ${c.reference}</p><p>“Sow where you're planted.” — PHANET KNUST</p>` });
  }
  return { recorded: true, kind };
}

/** Verify with Paystack then record. Safe to call repeatedly. */
export async function verifyAndRecord(reference: string) {
  try {
    const data = (await verifyTransaction(reference)) as unknown as PaystackCharge;
    const res = await recordPaystackPayment(data);
    return { ok: data.status === "success", data, ...res };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "verify failed", data: null, recorded: false, kind: "none" };
  }
}
