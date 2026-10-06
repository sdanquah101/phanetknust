import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Blobs, Crest } from "@phanet/ui";
import { money } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartBar } from "@/components/CartBar";
import { AddToBag } from "@/components/AddToBag";
import { getProduct, getSettings } from "@/lib/queries";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ theme, socials }, product] = await Promise.all([getSettings(), getProduct(slug)]);
  if (!product || !product.is_active) notFound();
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-10 pb-20">
          <Link href="/shop" className="pill pill-glass no-underline mb-8 inline-flex">← Back to shop</Link>
          <div className="grid gap-8 lg:grid-cols-2 items-start">
            <div className="card overflow-hidden aspect-square bg-ice grid place-items-center">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Crest size={108} className="opacity-90" />
              )}
            </div>
            <div className="card card-lg p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <Badge tone="good">{theme.year} collection</Badge>
                {product.stock > 0 && product.stock <= 5 && <Badge tone="warn">Only {product.stock} left</Badge>}
              </div>
              <h1 className="t-h2 text-deep">{product.name}</h1>
              <div className="num-xl text-royal">{money(product.price)}</div>
              {product.description && <p className="text-muted">{product.description}</p>}
              <AddToBag product={product} />
              <p className="text-xs text-muted">Pay with MTN MoMo, Telecel Cash or card. Collect at the Gathering of the Adelphos on Saturday.</p>
            </div>
          </div>
        </div>
      </section>
      <CartBar />
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
