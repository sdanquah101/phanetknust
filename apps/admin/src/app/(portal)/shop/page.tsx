import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, StatCard, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { money } from "@phanet/supabase/format";
import type { Product } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { toggleProduct } from "./actions";

export default async function ShopPage({ searchParams }: { searchParams: Promise<FlashParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data }, { count: paidCount }, { count: pendingCount }] = await Promise.all([
    supabase.from("products").select("*").order("sort_order").order("name"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const products = (data ?? []) as Product[];
  const lowStock = products.filter((p) => p.is_active && p.stock <= 3).length;

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Merch &"
        script="orders"
        actions={
          <>
            <Link href="/shop/orders" className="btn btn-ice btn-sm">Orders</Link>
            <Link href="/shop/products/new" className="btn btn-orange btn-sm">+ New product</Link>
          </>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Products" value={products.length} sub={`${products.filter((p) => p.is_active).length} on sale`} />
        <StatCard label="To fulfil" value={paidCount ?? 0} sub="paid, awaiting pickup" tone={paidCount ? "orange" : "white"} />
        <StatCard label="Unpaid orders" value={pendingCount ?? 0} sub="checkout started, not paid" />
        <StatCard label="Low stock" value={lowStock} sub="products with 3 or fewer left" />
      </div>
      {products.length === 0 ? (
        <EmptyState title="No products yet." body="Add T-shirts, wristbands, books… anything members can pay for with MoMo and pick up on campus." action={<Link href="/shop/products/new" className="btn btn-orange btn-sm">Add a product</Link>} />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><th>Product</th><th>Price</th><th>Stock</th><th className="hidden xl:table-cell">Options</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="min-w-[16rem]">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="w-12 h-12 rounded-2xl object-cover flex-none" />
                      ) : (
                        <span className="w-12 h-12 rounded-2xl bg-ice flex-none" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold truncate">{p.name}</div>
                        <div className="text-xs text-muted truncate">/{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="amt-in whitespace-nowrap">{money(p.price)}</td>
                  <td>{p.stock <= 3 ? <Badge tone="warn">{p.stock} left</Badge> : p.stock}</td>
                  <td className="hidden xl:table-cell text-xs text-muted max-w-[10rem]">{Array.isArray(p.options) && p.options.length ? p.options.join(", ") : "—"}</td>
                  <td>{p.is_active ? <Badge tone="mint">On sale</Badge> : <Badge tone="warn">Hidden</Badge>}</td>
                  <td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <form action={toggleProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="is_active" value={p.is_active ? "false" : "true"} />
                        <SubmitButton variant="ice" size="sm">{p.is_active ? "Hide" : "Show"}</SubmitButton>
                      </form>
                      <Link href={`/shop/products/${p.id}`} className="btn btn-blue btn-sm">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
