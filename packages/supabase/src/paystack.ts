import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.paystack.co";

function secret() {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return k;
}

export type InitArgs = {
  email: string;
  /** Amount in GH₵ (not pesewas). */
  amount: number;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  /** Restrict channels e.g. ["mobile_money"] or ["card"]. */
  channels?: ("card" | "mobile_money" | "bank" | "ussd" | "bank_transfer")[];
};

export async function initializeTransaction(args: InitArgs): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...args, amount: Math.round(args.amount * 100), currency: "GHS" }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message ?? "Paystack initialize failed");
  return json.data;
}

export async function verifyTransaction(reference: string): Promise<{ status: string; amount: number; channel: string; customer: { email: string }; metadata: Record<string, unknown>; paid_at: string; reference: string }> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message ?? "Paystack verify failed");
  return json.data;
}

/** Validate the x-paystack-signature header against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Map Paystack channel strings onto our ledger channels. */
export function ledgerChannel(channel: string | undefined, bank?: string | null): "momo_mtn" | "telecel_cash" | "card" | "bank" | "cash" {
  if (channel === "mobile_money") {
    const b = (bank ?? "").toLowerCase();
    if (b.includes("vodafone") || b.includes("telecel")) return "telecel_cash";
    return "momo_mtn";
  }
  if (channel === "card") return "card";
  if (channel === "bank" || channel === "bank_transfer") return "bank";
  return "cash";
}

export function newReference(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}
