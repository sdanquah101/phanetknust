"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button, Crest, Field, Input, Notice, Script, Textarea } from "@phanet/ui";
import { money } from "@phanet/supabase/format";
import { useCart } from "@/lib/cart";
import { checkoutAction } from "../actions";

export function BagClient() {
  const { lines, setQty, subtotal, ready } = useCart();
  const [state, action, pending] = useActionState(checkoutAction, undefined);
  if (!ready) return null;
  if (lines.length === 0) {
    return (
      <div className="card card-lg p-10 text-center max-w-lg mx-auto flex flex-col items-center gap-4">
        <Crest size={43} className="opacity-90" />
        <h1 className="text-2xl">Your bag is empty</h1>
        <Link href="/shop" className="btn btn-blue">Browse the shop</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] items-start">
      <div>
        <h1 className="h3d t-h1 mb-8">Your <Script peach className="text-[1.2em]">bag</Script></h1>
        <div className="glass p-4 flex flex-col divide-y divide-white/15">
          {lines.map((l) => (
            <div key={l.product_id + (l.option ?? "")} className="flex items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-[16px] bg-white/20 overflow-hidden grid place-items-center flex-none">
                {l.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image_url} alt="" className="w-full h-full object-cover" />
                ) : <Crest size={36} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{l.name}{l.option ? ` · ${l.option}` : ""}</div>
                <div className="text-sm text-white">{money(l.unit_price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-ghost btn-sm !px-3" onClick={() => setQty(l.product_id, l.option, l.qty - 1)} aria-label="Decrease">−</button>
                <span className="font-bold w-5 text-center">{l.qty}</span>
                <button type="button" className="btn btn-ghost btn-sm !px-3" onClick={() => setQty(l.product_id, l.option, l.qty + 1)} aria-label="Increase">+</button>
              </div>
              <div className="font-extrabold w-24 text-right">{money(l.qty * l.unit_price)}</div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-4 text-lg">
            <span className="font-semibold">Total</span>
            <span className="num-lg">{money(subtotal)}</span>
          </div>
        </div>
      </div>

      <form action={action} className="card card-lg p-7 md:p-8 flex flex-col gap-4">
        <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ product_id: l.product_id, qty: l.qty, option: l.option })))} />
        <div className="label-caps-orange">Pickup details</div>
        <h2 className="text-2xl">Almost there</h2>
        {state?.error && <Notice tone="peach">{state.error}</Notice>}
        <Field label="Full name"><Input name="name" autoComplete="name" required placeholder="Ama Owusu" /></Field>
        <Field label="Email" hint="Your receipt goes here."><Input name="email" type="email" autoComplete="email" required placeholder="you@st.knust.edu.gh" /></Field>
        <Field label="Phone" hint="The MoMo number you'll pay with, ideally."><Input name="phone" type="tel" autoComplete="tel" required placeholder="024 000 0000" /></Field>
        <Field label="Note (optional)"><Textarea name="note" placeholder="Hall and room, or anything we should know" className="!min-h-[80px]" /></Field>
        <Button type="submit" size="lg" disabled={pending} className="mt-2">{pending ? "Starting payment…" : `Pay ${money(subtotal)} →`}</Button>
        <p className="text-xs text-muted">You'll be taken to Paystack to approve the MoMo prompt or enter your card. Collect at the Gathering of the Adelphos on Saturday.</p>
      </form>
    </div>
  );
}
