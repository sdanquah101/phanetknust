import type { Metadata } from "next";
import { Blobs, Label, Script } from "@phanet/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GiveForm } from "./GiveForm";
import { getFunds, getSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Give" };
export const revalidate = 60;

export default async function GivePage() {
  const [{ theme, socials }, funds] = await Promise.all([getSettings(), getFunds()]);
  const list = funds.length ? funds : [{ id: "offering", slug: "offering", name: "Offering", description: null, target_amount: null, is_active: true, sort_order: 0 }];
  return (
    <>
      <section className="ground-blue">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative grid gap-10 lg:grid-cols-[1fr_.95fr] items-start pt-12 pb-24">
          <div className="lg:sticky lg:top-8">
            <Label tone="peach" className="mb-3">Give</Label>
            <h1 className="h3d t-h1 leading-[0.95]">Sow where<br />you're <Script peach className="text-[1.2em]">planted</Script></h1>
            <p className="mt-8 text-white max-w-md">Every gift keeps the altar lit: our Saturday gatherings, all-night prayer, retreats and welfare for members in need. MTN MoMo, Telecel Cash or card.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {list.map((f) => <span key={f.id} className="pill pill-glass">{f.name}</span>)}
            </div>
            <div className="mt-10 glass p-5 max-w-md">
              <div className="label-caps-peach mb-2">Prefer to give in person?</div>
              <p className="text-sm text-white">Offering baskets go round at the Gathering of the Adelphos. Cash is counted by two people and recorded the same night.</p>
            </div>
          </div>
          <GiveForm funds={list} />
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
