"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Badge, Button, EmptyState, Field, Input, Notice, Textarea } from "@phanet/ui";
import type { WelfareItem } from "@phanet/supabase/types";
import { clearBasket, readBasket, writeBasket, type Basket } from "@/lib/basket";
import { submitRequestAction, type CheckoutState } from "./actions";

export function CheckoutForm({ items }: { items: WelfareItem[] }) {
  const router = useRouter();
  const [basket, setBasket] = React.useState<Basket>({});
  const [ready, setReady] = React.useState(false);
  const [dropped, setDropped] = React.useState(0);
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(submitRequestAction, undefined);

  React.useEffect(() => {
    const stored = readBasket();
    const byId = new Map(items.map((i) => [i.id, i]));
    const clean: Basket = {};
    let lost = 0;
    for (const [id, qty] of Object.entries(stored)) {
      const it = byId.get(id);
      const max = it ? Math.min(it.max_per_request, it.qty_available) : 0;
      if (!it || max <= 0) { lost++; continue; }
      clean[id] = Math.min(qty, max);
    }
    setBasket(clean);
    setDropped(lost);
    writeBasket(clean);
    setReady(true);
  }, [items]);

  React.useEffect(() => {
    if (state?.code) {
      clearBasket();
      router.replace(`/request/${encodeURIComponent(state.code)}`);
    }
  }, [state?.code, router]);

  const lines = items.filter((i) => basket[i.id]).map((i) => ({ item: i, qty: basket[i.id] }));
  const payload = JSON.stringify(lines.map((l) => ({ item_id: l.item.id, qty: l.qty })));

  function remove(id: string) {
    const next = { ...basket };
    delete next[id];
    setBasket(next);
    writeBasket(next);
  }

  if (!ready) return <div className="card p-8 text-sm text-muted">Loading your basket…</div>;

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your basket is empty"
        body={dropped ? "Some items you picked are no longer on the shelf. Head back and choose again." : "Pick a few things from the shelf first."}
        action={<Link href="/" className="btn btn-orange">Back to the shop</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] items-start">
      <section className="card p-6 flex flex-col gap-4">
        <h2 className="text-xl">Your basket</h2>
        {dropped > 0 && <Notice tone="peach">{dropped} {dropped === 1 ? "item" : "items"} we removed — no longer available.</Notice>}
        <ul className="flex flex-col divide-y divide-ice">
          {lines.map(({ item, qty }) => (
            <li key={item.id} className="py-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-[14px] bg-row overflow-hidden grid place-items-center flex-none">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold truncate">{item.name}</div>
                <div className="text-xs text-muted">{qty} × {item.unit}</div>
              </div>
              <Badge tone="good">{qty}</Badge>
              <button type="button" className="text-xs font-bold text-ember" onClick={() => remove(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <Link href="/" className="text-sm font-bold text-royal">← Add more</Link>
      </section>

      <form action={formAction} className="card p-6 flex flex-col gap-4">
        <h2 className="text-xl">Who is this for?</h2>
        <input type="hidden" name="items" value={payload} />
        {state?.error && <Notice tone="peach">{state.error}</Notice>}
        <Field label="Full name"><Input name="name" autoComplete="name" placeholder="Ama Owusu" required minLength={2} /></Field>
        <Field label="Phone" hint="Ghana number, e.g. 024 123 4567. We'll text or call when it's ready.">
          <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" required pattern="[0-9+ ]{9,16}" />
        </Field>
        <Field label="Hall / hostel & room" hint="Optional, helps us find you."><Input name="hall_room" placeholder="Unity Hall, Room 214" /></Field>
        <Field label="Note (optional)"><Textarea name="note" placeholder="Anything we should know?" maxLength={500} className="min-h-[90px]" /></Field>
        <Button type="submit" size="lg" disabled={pending} className="mt-2">{pending ? "Sending…" : "Send my request →"}</Button>
        <p className="text-xs text-muted">No judgement, no questions. The team only sees your name, phone and what you picked.</p>
      </form>
    </div>
  );
}
