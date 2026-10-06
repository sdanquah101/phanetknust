import type { Metadata } from "next";
import { Blobs } from "@phanet/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BagClient } from "./BagClient";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = { title: "Your bag" };
export const revalidate = 60;

export default async function BagPage() {
  const { theme, socials } = await getSettings();
  return (
    <>
      <section className="ground-blue min-h-[70dvh]">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-10 pb-20">
          <BagClient />
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
