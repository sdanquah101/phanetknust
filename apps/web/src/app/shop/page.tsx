import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Blobs, EmptyState, Label, Script, Ticker } from "@phanet/ui";
import { money } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartBar } from "@/components/CartBar";
import { getProducts, getSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [{ theme, socials }, products] = await Promise.all([getSettings(), getProducts()]);
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-14 pb-6">
          <Label tone="peach" className="mb-3">Shop</Label>
          <h1 className="h3d text-[48px] md:text-[72px]">Wear the <Script peach className="text-[1.2em]">theme</Script></h1>
          <p className="mt-6 text-white/90 max-w-xl">Tees, hoodies and more from the {theme.year} collection. Pay with MTN MoMo, Telecel Cash or card, pick up on campus.</p>
        </div>
        <div className="stage-lip" />
      </section>
      <div className="stage"><Ticker items={[`${theme.title} · ${theme.reference}`, `${theme.title} · ${theme.reference}`]} /></div>
      <section className="ground-ice -mt-px">
        <div className="container-page py-16">
          {products.length === 0 ? (
            <EmptyState title="The shop opens soon" body="New merch is being added. Check back shortly." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="card overflow-hidden no-underline flex flex-col hover:-translate-y-1 transition-transform">
                  <div className="aspect-square bg-ice grid place-items-center overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="dot-orange" style={{ width: 72, height: 72 }} />
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-extrabold text-lg text-deep">{p.name}</div>
                      {p.stock <= 0 ? <Badge tone="warn">Sold out</Badge> : p.stock <= 5 ? <Badge tone="warn">{p.stock} left</Badge> : null}
                    </div>
                    {p.description && <p className="text-sm text-muted line-clamp-2">{p.description}</p>}
                    <div className="num-lg text-royal mt-2">{money(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <CartBar />
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
