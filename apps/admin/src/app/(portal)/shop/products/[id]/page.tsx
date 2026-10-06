import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ConfirmSubmit, Field, Input, Label, PageHeader, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import type { Product } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { deleteProduct, saveProduct } from "../../actions";

export default async function ProductEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !isUuid(id)) notFound();
  let product: Product | null = null;
  if (!isNew) {
    const supabase = await createClient();
    const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    product = data as Product | null;
    if (!product) notFound();
  }
  const options = Array.isArray(product?.options) ? product!.options.join(", ") : "";

  return (
    <>
      <PageHeader eyebrow="Shop" title={isNew ? "New product" : product!.name} actions={<Link href="/shop" className="btn btn-ice btn-sm">← All products</Link>} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card>
          <form action={saveProduct} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={product?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><Input name="name" defaultValue={product?.name ?? ""} placeholder="PHANET T-shirt" required /></Field>
              <Field label="Slug" hint="Leave blank to generate."><Input name="slug" defaultValue={product?.slug ?? ""} placeholder="phanet-tshirt" /></Field>
            </div>
            <Field label="Description"><Textarea name="description" defaultValue={product?.description ?? ""} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Price (GH₵)"><Input name="price" type="number" step="0.01" min="0" defaultValue={product?.price ?? ""} required /></Field>
              <Field label="Stock"><Input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} /></Field>
              <Field label="Sort order"><Input name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} /></Field>
            </div>
            <Field label="Options" hint="Comma separated, e.g. S, M, L, XL. Leave blank for none."><Input name="options" defaultValue={options} placeholder="S, M, L, XL" /></Field>
            <label className="option-row flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="is_active" className="check" defaultChecked={product?.is_active ?? true} />
              <span className="font-bold text-sm">On sale in the shop</span>
            </label>
            <Field label="Product image" hint="Square works best. Uploads to the products bucket."><input type="file" name="image" accept="image/*" className="input" /></Field>
            <div><SubmitButton pendingText="Saving…">{isNew ? "Create product" : "Save changes"}</SubmitButton></div>
          </form>
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Image</Label>
            {product?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover rounded-card" />
            ) : (
              <div className="aspect-square rounded-card bg-ice grid place-items-center text-sm text-muted">No image yet</div>
            )}
          </Card>
          {product && (
            <Card className="flex flex-col gap-3">
              <Label tone="orange">Danger zone</Label>
              <p className="text-sm text-muted">Products with orders can't be deleted; hide them instead.</p>
              <form action={deleteProduct}>
                <input type="hidden" name="id" value={product.id} />
                <ConfirmSubmit variant="danger" size="sm" message={`Delete "${product.name}"?`}>Delete product</ConfirmSubmit>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
