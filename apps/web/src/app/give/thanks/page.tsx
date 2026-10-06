import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Blobs, Script } from "@phanet/ui";
import { fmtDateTime, money } from "@phanet/supabase/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/queries";
import { verifyAndRecord } from "@/lib/paystack-record";

export const metadata: Metadata = { title: "Thank you" };
export const dynamic = "force-dynamic";

export default async function GiveThanks({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const sp = await searchParams;
  const { theme, socials, verse_of_day: verse } = await getSettings();
  const reference = sp.reference ?? sp.trxref;
  const result = reference ? await verifyAndRecord(reference) : null;
  const ok = Boolean(result?.ok);
  const data = result?.data;
  const meta = (data?.metadata ?? {}) as Record<string, string>;
  return (
    <>
      <section className="ground-blue min-h-[70dvh]">
        <Blobs />
        <SiteHeader />
        <div className="container-page relative pt-12 pb-20 max-w-3xl">
          <h1 className="h3d text-[44px] md:text-[64px]">{ok ? <>Medaase <Script peach className="text-[1.2em]">paa</Script></> : <>Hold <Script peach className="text-[1.2em]">on</Script></>}</h1>
          <p className="mt-4 text-white/90">{ok ? "Your gift went through. A receipt is on its way to your email." : "We couldn't confirm the payment yet. If you approved the prompt, refresh in a moment."}</p>
          {data && (
            <div className="card card-lg p-7 mt-8">
              <div className="flex items-center justify-between">
                <div><div className="label-caps-orange">{meta.fund ?? "Giving"}</div><div className="num-xl text-royal mt-1">{money(data.amount / 100)}</div></div>
                <Badge tone={ok ? "mint" : "warn"}>{data.status}</Badge>
              </div>
              <div className="text-xs text-muted mt-4">Reference {data.reference}{data.paid_at ? ` · ${fmtDateTime(data.paid_at)}` : ""}</div>
            </div>
          )}
          <div className="card card-lg tilt-n2 p-7 mt-10 max-w-md">
            <div className="label-caps-orange mb-2">Verse of the day</div>
            <p className="script text-royal text-[24px] leading-snug">{verse.text}</p>
            <div className="text-xs text-muted mt-3">{verse.reference}</div>
          </div>
          <div className="mt-8 flex gap-3">
            <Link href="/" className="btn btn-white">Back home</Link>
            <Link href="/give" className="btn btn-ghost">Give again</Link>
          </div>
        </div>
      </section>
      <SiteFooter socials={socials} year={theme.year} />
    </>
  );
}
