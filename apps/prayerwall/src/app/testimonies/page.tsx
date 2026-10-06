import type { Metadata } from "next";
import { Badge, ButtonLink, EmptyState, Label, Script, Toast } from "@phanet/ui";
import { fmtDate } from "@phanet/supabase/format";
import { Shell } from "@/components/Shell";
import { Pager } from "@/components/Pager";
import { getTestimonies } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Testimonies" };

type Search = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TestimoniesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);
  const ok = first(sp.ok) === "1";
  const { items, total } = await getTestimonies({ page });

  return (
    <Shell>
      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr] items-end">
        <div className="fade-up">
          <Label tone="peach">Testimonies</Label>
          <h1 className="h3d text-[40px] md:text-[64px] mt-3">
            God <Script peach className="text-[1.15em]">answers</Script>
          </h1>
          <p className="mt-5 text-white/85 text-lg max-w-xl">
            {total > 0
              ? `${total.toLocaleString("en-GH")} ${total === 1 ? "testimony" : "testimonies"} from the wall so far — each one once a request someone carried here.`
              : "When God answers your request, come back with your code and tell the fellowship."}
          </p>
          <div className="mt-7">
            <ButtonLink href="/share">Share a testimony</ButtonLink>
          </div>
        </div>
        <div className="card-orange p-6 md:p-8 flex flex-col gap-2 w-full max-w-xs lg:ml-auto tilt-2">
          <Label tone="white">Answered so far</Label>
          <div className="num-xl md:text-[56px]">{total.toLocaleString("en-GH")}</div>
          <div className="text-xs text-white/85 font-medium">Testimonies shared anonymously</div>
        </div>
      </section>

      {ok && <Toast tone="mint" message="Thank you for sharing. Your testimony is on the wall." />}

      <section className="flex flex-col gap-6">
        {items.length === 0 ? (
          <EmptyState
            title="No testimonies yet"
            body="When God answers, come back with your code and tell us what He did."
            action={<ButtonLink href="/share" size="sm">Share a testimony</ButtonLink>}
          />
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
            {items.map((t) => (
              <article key={t.id} className="card p-5 flex flex-col gap-3 break-inside-avoid mb-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="mint">Answered</Badge>
                  <Badge tone="good">{t.category}</Badge>
                </div>
                <div>
                  <div className="label-caps text-muted">Prayed for</div>
                  <h3 className="font-bold text-[17px] leading-snug text-deep mt-1">{t.topic}</h3>
                </div>
                <p className="text-sm text-deep/90 whitespace-pre-line">{t.body}</p>
                <div className="text-xs text-muted pt-3 border-t border-ice">{fmtDate(t.created_at)}</div>
              </article>
            ))}
          </div>
        )}
        <Pager page={page} total={total} href={(p) => (p > 1 ? `/testimonies?page=${p}` : "/testimonies")} />
      </section>
    </Shell>
  );
}
