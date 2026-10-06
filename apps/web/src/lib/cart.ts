"use client";
import { useCallback, useEffect, useState } from "react";

export type CartLine = { product_id: string; slug: string; name: string; option: string | null; unit_price: number; qty: number; image_url: string | null };
const KEY = "phanet-bag";

function read(): CartLine[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function write(lines: CartLine[]) {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); window.dispatchEvent(new Event("phanet-bag")); } catch { /* ignore */ }
}

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setLines(read());
    sync(); setReady(true);
    window.addEventListener("phanet-bag", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("phanet-bag", sync); window.removeEventListener("storage", sync); };
  }, []);
  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    const cur = read();
    const i = cur.findIndex((l) => l.product_id === line.product_id && l.option === line.option);
    if (i >= 0) cur[i].qty += qty; else cur.push({ ...line, qty });
    write(cur);
  }, []);
  const setQty = useCallback((product_id: string, option: string | null, qty: number) => {
    const cur = read().map((l) => (l.product_id === product_id && l.option === option ? { ...l, qty } : l)).filter((l) => l.qty > 0);
    write(cur);
  }, []);
  const clear = useCallback(() => write([]), []);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit_price, 0);
  return { lines, ready, add, setQty, clear, count, subtotal };
}
