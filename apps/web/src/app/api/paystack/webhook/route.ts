import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@phanet/supabase/paystack";
import { recordPaystackPayment, type PaystackCharge } from "@/lib/paystack-record";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const raw = await request.text();
  let valid = false;
  try { valid = verifyWebhookSignature(raw, request.headers.get("x-paystack-signature")); } catch { valid = false; }
  if (!valid) return NextResponse.json({ ok: false }, { status: 401 });
  const body = JSON.parse(raw) as { event: string; data: PaystackCharge };
  if (body.event === "charge.success") {
    try { await recordPaystackPayment(body.data); } catch (e) { console.error("webhook record failed", e); return NextResponse.json({ ok: false }, { status: 500 }); }
  }
  return NextResponse.json({ ok: true });
}
