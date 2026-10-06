"use client";
import Link from "next/link";
import { money } from "@phanet/supabase/format";
import { useCart } from "@/lib/cart";

export function CartBar() {
  const { count, subtotal, ready } = useCart();
  if (!ready || count === 0) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center">
      <Link href="/shop/bag" className="card-blue no-underline px-5 py-3 flex items-center gap-4 rounded-pill shadow-card-blue">
        <span className="pill pill-white">{count}</span>
        <span className="font-bold">Your bag · {money(subtotal)}</span>
        <span className="btn btn-orange btn-sm">Checkout →</span>
      </Link>
    </div>
  );
}
