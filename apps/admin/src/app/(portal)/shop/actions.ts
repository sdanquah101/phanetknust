"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { slugify } from "@phanet/supabase/format";
import type { Order, OrderItem } from "@phanet/supabase/types";
import { done, errMsg, fail } from "@/lib/flash";
import { bool, csv, file, isUuid, num, opt, str } from "@/lib/form";
import { extOf, uploadPublic } from "@/lib/storage";

export async function saveProduct(formData: FormData) {
  const id = str(formData, "id");
  const isNew = !isUuid(id);
  const back = isNew ? "/shop/products/new" : `/shop/products/${id}`;
  const name = str(formData, "name");
  if (!name) fail(back, "Give the product a name.");
  const slug = slugify(str(formData, "slug") || name);
  const price = num(formData, "price", -1);
  if (price < 0) fail(back, "Enter a valid price.");
  const stock = Math.round(num(formData, "stock", 0));
  if (stock < 0) fail(back, "Stock can't be negative.");
  const supabase = await createClient();
  const row: Record<string, unknown> = {
    slug,
    name,
    description: opt(formData, "description"),
    price,
    stock,
    options: csv(str(formData, "options")),
    is_active: bool(formData, "is_active"),
    sort_order: Math.round(num(formData, "sort_order", 0)),
  };
  const image = file(formData, "image");
  if (image) {
    try {
      row.image_url = await uploadPublic(supabase, "products", `${slug}.${extOf(image)}`, image);
    } catch (e) {
      fail(back, errMsg(e));
    }
  }
  const dup = (m: string) => (m.includes("duplicate") ? "That slug is already used by another product." : m);
  if (isNew) {
    const { data, error } = await supabase.from("products").insert(row).select("id").single();
    if (error) fail(back, dup(error.message));
    revalidatePath("/shop");
    done(`/shop/products/${(data as { id: string }).id}`, "Product created.");
  }
  const { error } = await supabase.from("products").update(row).eq("id", id);
  if (error) fail(back, dup(error.message));
  revalidatePath("/shop");
  revalidatePath(back);
  done(back, "Product saved.");
}

export async function deleteProduct(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail("/shop", "Unknown product.");
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) fail(`/shop/products/${id}`, error.message.includes("foreign key") ? "This product has orders, so it can't be deleted. Hide it instead." : error.message);
  revalidatePath("/shop");
  done("/shop", "Product deleted.");
}

export async function toggleProduct(formData: FormData) {
  const id = str(formData, "id");
  const active = bool(formData, "is_active");
  if (!isUuid(id)) fail("/shop", "Unknown product.");
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_active: active }).eq("id", id);
  if (error) fail("/shop", error.message);
  revalidatePath("/shop");
  done("/shop", active ? "Product is now on sale." : "Product hidden from the shop.");
}

const ordersBack = (status: string) => (status ? `/shop/orders?status=${encodeURIComponent(status)}` : "/shop/orders");

export async function fulfilOrder(formData: FormData) {
  const id = str(formData, "id");
  const back = ordersBack(str(formData, "back_status"));
  if (!isUuid(id)) fail(back, "Unknown order.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").update({ status: "fulfilled", fulfilled_at: new Date().toISOString() }).eq("id", id).eq("status", "paid").select("order_no");
  if (error) fail(back, error.message);
  if (!data || data.length === 0) fail(back, "Only paid orders can be marked fulfilled.");
  revalidatePath("/shop/orders");
  done(back, `Order ${(data[0] as { order_no: string }).order_no} marked fulfilled.`);
}

/** Cancel a pending (unpaid) order and put its stock back. */
export async function cancelOrder(formData: FormData) {
  const id = str(formData, "id");
  const back = ordersBack(str(formData, "back_status"));
  if (!isUuid(id)) fail(back, "Unknown order.");
  const supabase = await createClient();
  const { data: orderRow } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  const order = orderRow as Order | null;
  if (!order) fail(back, "Order not found.");
  if (order.status !== "pending") fail(back, "Only pending orders can be cancelled.");
  const { data: itemRows } = await supabase.from("order_items").select("*").eq("order_id", id);
  const items = (itemRows ?? []) as OrderItem[];
  const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", id).eq("status", "pending");
  if (error) fail(back, error.message);
  for (const it of items) {
    const { data: p } = await supabase.from("products").select("stock").eq("id", it.product_id).maybeSingle();
    if (p) await supabase.from("products").update({ stock: Number((p as { stock: number }).stock) + it.qty }).eq("id", it.product_id);
  }
  revalidatePath("/shop/orders");
  revalidatePath("/shop");
  done(back, `Order ${order.order_no} cancelled and stock restored.`);
}
