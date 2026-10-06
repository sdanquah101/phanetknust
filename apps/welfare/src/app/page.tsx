import { Blobs, ButtonLink, Card, EmptyState, Label, Script } from "@phanet/ui";
import { WelfareHeader } from "@/components/public-header";
import { WelfareFooter } from "@/components/public-footer";
import { Shop } from "@/components/shop";
import { listActiveItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STEPS = [
  { title: "Pick", body: "Choose what you need this week. Small limits per item so there's enough for everyone." },
  { title: "We pack", body: "The welfare team checks stock and packs your items. You'll get a code to track it." },
  { title: "You collect", body: "Collect from the welfare desk after Midweek Altar. Just show your code." },
];

export default async function HomePage() {
  const items = await listActiveItems();
  const inStock = items.filter((i) => i.qty_available > 0).length;

  return (
    <main className="min-h-dvh bg-white">
      <section className="ground-blue">
        <Blobs />
        <WelfareHeader />
        <div className="container-page relative pt-14 pb-10 md:pt-20 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-end">
          <div className="max-w-2xl">
            <span className="pill-glass pill">Take what you need — no questions asked</span>
            <h1 className="h3d text-[46px] md:text-[72px] leading-[0.98] mt-5">
              There&apos;s enough for <Script peach className="text-[1.2em]">you</Script>
            </h1>
            <p className="mt-6 text-white/85 text-base md:text-lg max-w-md">Pick what you need this week. The welfare team will get it ready for pickup.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#shop" size="lg">Start shopping →</ButtonLink>
              <ButtonLink href="/track" variant="ghost" size="lg">Track a request</ButtonLink>
            </div>
          </div>
          <div className="glass p-6 lg:justify-self-end w-full max-w-sm">
            <Label tone="peach">On the shelf today</Label>
            <div className="num-xl mt-2">{inStock}</div>
            <div className="text-sm text-white/85 mt-1">{inStock === 1 ? "item" : "items"} ready to be picked</div>
            <div className="divider-glass my-4" />
            <p className="text-xs text-white/80">No account needed. Two requests per phone per week, up to 6 different items each.</p>
          </div>
        </div>
        <div className="stage-lip" />
      </section>

      <section id="shop" className="container-page py-12 md:py-16 scroll-mt-6">
        <div className="mb-8">
          <Label tone="orange">The shelf</Label>
          <h2 className="text-[32px] md:text-[40px] text-deep mt-1">Shop</h2>
        </div>
        {items.length === 0 ? (
          <EmptyState title="The shelf is empty right now" body="The welfare team is restocking. Check back after Midweek Altar, or speak to any executive if it's urgent." />
        ) : (
          <Shop items={items} />
        )}
      </section>

      <section id="how" className="ground-ice scroll-mt-6">
        <div className="container-page py-14 md:py-20">
          <Label tone="orange">How it works</Label>
          <h2 className="text-[32px] md:text-[40px] text-deep mt-1 mb-8">Three easy steps</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Card key={s.title} className="flex flex-col gap-3">
                <span className="dot-orange" />
                <Label tone="orange">Step {i + 1}</Label>
                <h3 className="text-xl">{s.title}</h3>
                <p className="text-sm text-muted">{s.body}</p>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">Pickup point: <span className="font-bold text-deep">the welfare desk after Midweek Altar</span>. Bring your code or your phone.</p>
        </div>
      </section>
      <WelfareFooter />
    </main>
  );
}
