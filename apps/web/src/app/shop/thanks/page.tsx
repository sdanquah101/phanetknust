import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Blobs, Script } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDateTime, money } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ClearBag } from "./ClearBag";
import { getSettings } from "@/lib/queries";
import { verifyAndRecord } from "@/lib/paystack-record";

export const metadata: Metadata = { title: "Thank you" };
export const dynamic = "force-dynamic";

type OrderStatus = { order_no: string; buyer_name: string; status: string; subtotal: number; paid_at: string | null; items: { name: string; option: string | null; qty: number; unit_price: number }[] };

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ order?: string; email?: string; reference?: string; trxref?: string }> }) {
  const sp = await searchParams;
  const { theme, socials } = await getSettings();
  const reference = sp.reference ?? sp.trxref;
  if (reference) await verifyAndRecord(reference);
  let order: OrderStatus | null = null;
  if (sp.order && sp.email) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.rpc("order_status", { p_order_no: sp.order, p_email: sp.email });
      order = ((Array.isArray(data) ? data[0] : data) as OrderStatus | undefined) ?? null;
    } catch { order = null; }
  }
  const paid = order?.status === "paid" || order?.status === "fulfilled";
  return (
    <>
      <section className="ground-blue min-h-[70dvh]">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-12 pb-20 max-w-3xl">
          {paid && <ClearBag />}
          <h1 className="h3d t-h1">{paid ? <>Medaase, <Script peach className="text-[1.2em]">{order?.buyer_name.split(" ")[0]}</Script></> : <>Almost <Script peach className="text-[1.2em]">there</Script></>}</h1>
          <p className="mt-4 text-white">{paid ? "Your payment went through. Collect at the Gathering of the Adelphos on Saturday. We've emailed your receipt." : "We haven't confirmed your payment yet. If you approved the prompt, refresh this page in a moment."}</p>
          {order && (
            <div className="card card-lg p-7 mt-8">
              <div className="flex items-center justify-between">
                <div><div className="label-caps-orange">Order</div><div className="text-2xl font-extrabold text-deep">{order.order_no}</div></div>
                <Badge tone={paid ? "mint" : "warn"}>{order.status}</Badge>
              </div>
              <ul className="mt-5 divide-y divide-ice">
                {order.items.map((it, i) => (
                  <li key={i} className="flex justify-between py-3 text-sm"><span>{it.name}{it.option ? ` · ${it.option}` : ""} × {it.qty}</span><span className="font-bold">{money(it.unit_price * it.qty)}</span></li>
                ))}
              </ul>
              <div className="flex justify-between pt-4 text-lg"><span className="font-semibold">Total</span><span className="num-lg text-royal">{money(order.subtotal)}</span></div>
              {order.paid_at && <div className="text-xs text-muted mt-2">Paid {fmtDateTime(order.paid_at)}</div>}
            </div>
          )}
          <div className="mt-8 flex gap-3">
            <Link href="/shop" className="btn btn-white">Back to shop</Link>
            {!paid && <Link href={`/shop/thanks?order=${sp.order ?? ""}&email=${sp.email ?? ""}${reference ? `&reference=${reference}` : ""}`} className="btn btn-ghost">Check again</Link>}
          </div>
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
