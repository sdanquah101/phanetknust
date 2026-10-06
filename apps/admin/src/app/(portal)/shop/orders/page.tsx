import Link from "next/link";
import { Badge, type BadgeTone, Card, ConfirmSubmit, EmptyState, PageHeader, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDateTime, money } from "@phanet/supabase/format";
import type { Order, OrderItem } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { cancelOrder, fulfilOrder } from "../actions";

const STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "paid", label: "To fulfil" },
  { value: "pending", label: "Unpaid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
];
const TONE: Record<Order["status"], BadgeTone> = { pending: "warn", paid: "orange", fulfilled: "mint", cancelled: "good" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<FlashParams & { status?: string }> }) {
  const sp = await searchParams;
  const status = STATUSES.some((s) => s.value === sp.status) ? sp.status ?? "" : "";
  const supabase = await createClient();
  let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data: orderRows } = await q;
  const orders = (orderRows ?? []) as Order[];
  const ids = orders.map((o) => o.id);
  const { data: itemRows } = ids.length ? await supabase.from("order_items").select("*").in("order_id", ids) : { data: [] as OrderItem[] };
  const itemsByOrder = new Map<string, OrderItem[]>();
  ((itemRows ?? []) as OrderItem[]).forEach((it) => itemsByOrder.set(it.order_id, [...(itemsByOrder.get(it.order_id) ?? []), it]));

  return (
    <>
      <PageHeader eyebrow="Shop" title="Orders &" script="pickups" actions={<Link href="/shop" className="btn btn-ice btn-sm">← Products</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <Link key={s.value} href={s.value ? `/shop/orders?status=${s.value}` : "/shop/orders"} className="chip no-underline" data-selected={s.value === status ? "true" : undefined}>{s.label}</Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <EmptyState title="No orders here." body={status ? "Try another filter." : "Orders appear once someone checks out on the main site."} />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><th>Order</th><th>Buyer</th><th>Items</th><th>Total</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const items = itemsByOrder.get(o.id) ?? [];
                return (
                  <tr key={o.id}>
                    <td>
                      <div className="font-bold">{o.order_no}</div>
                      <div className="text-xs text-muted whitespace-nowrap">{fmtDateTime(o.created_at)}</div>
                    </td>
                    <td>
                      <div className="font-semibold">{o.buyer_name}</div>
                      <div className="text-xs text-muted">{o.buyer_phone} · {o.buyer_email}</div>
                      {o.pickup_note && <div className="text-xs text-muted italic mt-1">“{o.pickup_note}”</div>}
                    </td>
                    <td>
                      <ul className="text-xs flex flex-col gap-0.5">
                        {items.map((it) => (
                          <li key={it.id}><span className="font-semibold">{it.qty}×</span> {it.name}{it.option ? ` (${it.option})` : ""} <span className="text-muted">· {money(it.unit_price)}</span></li>
                        ))}
                        {items.length === 0 && <li className="text-muted">—</li>}
                      </ul>
                    </td>
                    <td className="amt-in whitespace-nowrap">{money(o.subtotal)}</td>
                    <td>
                      <Badge tone={TONE[o.status]}>{o.status}</Badge>
                      {o.paid_at && <div className="text-[11px] text-muted mt-1 whitespace-nowrap">Paid {fmtDateTime(o.paid_at)}</div>}
                      {o.fulfilled_at && <div className="text-[11px] text-muted mt-1 whitespace-nowrap">Picked up {fmtDateTime(o.fulfilled_at)}</div>}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {o.status === "paid" && (
                        <form action={fulfilOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="back_status" value={status} />
                          <SubmitButton size="sm" pendingText="Saving…">Mark fulfilled</SubmitButton>
                        </form>
                      )}
                      {o.status === "pending" && (
                        <form action={cancelOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="back_status" value={status} />
                          <ConfirmSubmit variant="danger" size="sm" message={`Cancel order ${o.order_no} and restore its stock?`}>Cancel</ConfirmSubmit>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
