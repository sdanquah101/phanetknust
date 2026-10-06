"use client";
import * as React from "react";
import Link from "next/link";
import { Badge, Label, cn } from "@phanet/ui";
import type { WelfareItem } from "@phanet/supabase/types";
import { basketCount, readBasket, writeBasket, type Basket } from "@/lib/basket";

function groupByCategory(items: WelfareItem[]) {
  const groups = new Map<string, WelfareItem[]>();
  for (const it of items) {
    const key = it.category || "Groceries";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(it);
  }
  return [...groups.entries()];
}

export function Shop({ items }: { items: WelfareItem[] }) {
  const [basket, setBasket] = React.useState<Basket>({});
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // Drop anything that is no longer on the shelf or over the limit.
    const stored = readBasket();
    const byId = new Map(items.map((i) => [i.id, i]));
    const clean: Basket = {};
    for (const [id, qty] of Object.entries(stored)) {
      const it = byId.get(id);
      if (!it) continue;
      const max = Math.min(it.max_per_request, it.qty_available);
      if (max > 0) clean[id] = Math.min(qty, max);
    }
    setBasket(clean);
    writeBasket(clean);
    setReady(true);
  }, [items]);

  function setQty(item: WelfareItem, qty: number) {
    const max = Math.min(item.max_per_request, item.qty_available);
    const next = { ...basket };
    const q = Math.max(0, Math.min(max, qty));
    if (q === 0) delete next[item.id];
    else next[item.id] = q;
    setBasket(next);
    writeBasket(next);
  }

  const count = basketCount(basket);
  const lines = Object.keys(basket).length;
  const groups = groupByCategory(items);

  return (
    <div className="flex flex-col gap-10">
      {groups.map(([category, list]) => (
        <section key={category} className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-2xl md:text-[28px] text-deep">{category}</h2>
            <span className="text-xs text-muted font-semibold">{list.filter((i) => i.qty_available > 0).length} available</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((item) => (
              <ItemCard key={item.id} item={item} qty={basket[item.id] ?? 0} onChange={(q) => setQty(item, q)} disabled={!ready} />
            ))}
          </div>
        </section>
      ))}

      {count > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
          <div className="card-blue pointer-events-auto flex items-center justify-between gap-4 px-5 py-4 w-full max-w-xl fade-up">
            <div>
              <Label tone="peach">Your basket</Label>
              <div className="font-bold">{count} {count === 1 ? "item" : "items"} · {lines} {lines === 1 ? "line" : "lines"}</div>
            </div>
            <Link href="/checkout" className="btn btn-orange">Request these →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemCard({ item, qty, onChange, disabled }: { item: WelfareItem; qty: number; onChange: (q: number) => void; disabled?: boolean }) {
  const out = item.qty_available <= 0;
  const max = Math.min(item.max_per_request, item.qty_available);
  return (
    <article className={cn("card p-4 flex flex-col gap-3", out && "opacity-60 grayscale")} aria-disabled={out}>
      <div className="aspect-[4/3] rounded-[18px] bg-row overflow-hidden grid place-items-center">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="dot-orange" style={{ width: 44, height: 44 }} />
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold leading-tight truncate">{item.name}</div>
          <div className="text-xs text-muted">per {item.unit}</div>
        </div>
        {out ? <Badge tone="white" className="!bg-ice !text-muted">Out of stock</Badge> : <Badge tone={item.qty_available <= 3 ? "warn" : "good"}>{item.qty_available} left</Badge>}
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="text-[11px] text-muted font-semibold">max {item.max_per_request} per request</span>
        {!out && (
          <div className="inline-flex items-center gap-1 rounded-pill bg-ice p-1" role="group" aria-label={`Quantity of ${item.name}`}>
            <button type="button" className="w-8 h-8 rounded-full bg-white text-royal font-bold disabled:opacity-40" onClick={() => onChange(qty - 1)} disabled={disabled || qty <= 0} aria-label={`Remove one ${item.name}`}>−</button>
            <span className="w-6 text-center font-bold text-sm tabular-nums">{qty}</span>
            <button type="button" className="w-8 h-8 rounded-full bg-royal text-white font-bold disabled:opacity-40" onClick={() => onChange(qty + 1)} disabled={disabled || qty >= max} aria-label={`Add one ${item.name}`}>+</button>
          </div>
        )}
      </div>
    </article>
  );
}
