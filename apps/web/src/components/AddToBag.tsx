"use client";
import { useState } from "react";
import { Button } from "@phanet/ui";
import { useCart } from "@/lib/cart";
import type { Product } from "@phanet/supabase/types";

export function AddToBag({ product }: { product: Product }) {
  const { add } = useCart();
  const options = Array.isArray(product.options) ? product.options : [];
  const [option, setOption] = useState<string | null>(options[0] ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const out = product.stock <= 0;
  return (
    <div className="flex flex-col gap-5">
      {options.length > 0 && (
        <div>
          <div className="field-label mb-2">Size</div>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button key={o} type="button" className="chip" data-selected={option === o} onClick={() => setOption(o)}>{o}</button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="field-label">Qty</div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-ice btn-sm !px-4" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
          <span className="font-bold w-6 text-center">{qty}</span>
          <button type="button" className="btn btn-ice btn-sm !px-4" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} aria-label="Increase">+</button>
        </div>
      </div>
      <Button size="lg" disabled={out} onClick={() => { add({ product_id: product.id, slug: product.slug, name: product.name, option, unit_price: Number(product.price), image_url: product.image_url }, qty); setAdded(true); setTimeout(() => setAdded(false), 1800); }}>
        {out ? "Sold out" : added ? "Added to bag ✓" : "Add to bag"}
      </Button>
    </div>
  );
}
