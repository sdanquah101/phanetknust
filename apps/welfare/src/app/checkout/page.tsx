import { Blobs, HeroCurve, Script } from "@phanet/ui";
import { WelfareHeader } from "@/components/public-header";
import { WelfareFooter } from "@/components/public-footer";
import { listActiveItems } from "@/lib/queries";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const items = await listActiveItems();
  return (
    <main className="min-h-dvh bg-white">
      <section className="ground-blue">
        <Blobs />
        <WelfareHeader />
        <div className="container-page relative pt-12 pb-6 md:pt-16">
          <h1 className="h3d t-h2 leading-[0.98]">Almost <Script peach className="text-[1.2em]">there</Script></h1>
          <p className="mt-4 text-white max-w-md">Tell us who to pack for. You&apos;ll get a code to track your request.</p>
        </div>
        <div className="mt-8"><HeroCurve /></div>
      </section>
      <section className="container-page py-10 md:py-14">
        <CheckoutForm items={items} />
      </section>
      <WelfareFooter />
    </main>
  );
}
