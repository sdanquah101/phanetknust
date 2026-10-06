import Link from "next/link";
import { Blobs, Card, EmptyState, Label, Notice, Script, cn } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { WelfareHeader } from "@/components/public-header";
import { WelfareFooter } from "@/components/public-footer";
import { StatusBadge } from "@/components/status-badge";
import { getRequestStatus } from "@/lib/queries";
import { PIPELINE, STATUS_HELP, STATUS_LABEL } from "@/lib/status";
import { CopyCode } from "./copy-code";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your request" };

export default async function RequestPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = decodeURIComponent(code).trim().toUpperCase();
  const req = await getRequestStatus(clean);

  return (
    <main className="min-h-dvh bg-white">
      <section className="ground-blue">
        <Blobs />
        <WelfareHeader />
        <div className="container-page relative pt-12 pb-6 md:pt-16">
          <h1 className="h3d text-[40px] md:text-[60px] leading-[0.98]">
            {req ? <>We&apos;ve got <Script peach className="text-[1.2em]">you</Script></> : <>Hmm, not <Script peach className="text-[1.2em]">found</Script></>}
          </h1>
          <p className="mt-4 text-white/85 max-w-md">{req ? `Thanks, ${req.requester_name.split(/\s+/)[0]}. Here's where your request is.` : "We couldn't find a request with that code."}</p>
        </div>
        <div className="stage-lip" />
      </section>

      <section className="container-page py-10 md:py-14">
        {!req ? (
          <EmptyState
            title={`No request for “${clean}”`}
            body="Check the code and try again. Codes look like WF-0012-A3F."
            action={<Link href="/track" className="btn btn-orange">Try another code</Link>}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] items-start">
            <Card tone="blue" className="flex flex-col gap-4">
              <Label tone="peach">Save this code</Label>
              <div className="num-xl md:text-[52px] tracking-tight font-mono break-all">{req.code}</div>
              <p className="text-sm text-white/85">Show it at the welfare desk, or use it to check back on your request any time.</p>
              <div className="flex flex-wrap gap-2">
                <CopyCode code={req.code} />
                <Link href={`/request/${encodeURIComponent(req.code)}`} className="btn btn-ghost btn-sm">Check again</Link>
              </div>
            </Card>

            <div className="flex flex-col gap-4">
              <Card className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-xl">Status</h2>
                  <StatusBadge status={req.status} />
                </div>
                <Pipeline status={req.status} />
                <p className="text-sm text-muted">{STATUS_HELP[req.status]}</p>
                {req.decision_note && <Notice tone={req.status === "declined" ? "peach" : "ice"}>Note from the team: {req.decision_note}</Notice>}
                <div className="text-xs text-muted">Requested {fmtDateTime(req.created_at)}</div>
              </Card>

              <Card className="flex flex-col gap-3">
                <h2 className="text-xl">What you picked</h2>
                {req.items.length === 0 ? (
                  <p className="text-sm text-muted">No items on this request.</p>
                ) : (
                  <ul className="divide-y divide-ice">
                    {req.items.map((it, i) => (
                      <li key={i} className="py-3 flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold">{it.name}</span>
                        <span className="text-muted">{it.qty} × {it.unit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <Link href="/" className="text-sm font-bold text-royal">← Back to the shop</Link>
            </div>
          </div>
        )}
      </section>
      <WelfareFooter />
    </main>
  );
}

function Pipeline({ status }: { status: (typeof PIPELINE)[number] | "declined" }) {
  if (status === "declined") {
    return (
      <div className="flex items-center gap-2">
        <span className="chain-dot" style={{ background: "var(--color-ember)" }} />
        <span className="text-sm font-bold text-ember">Declined</span>
      </div>
    );
  }
  const idx = PIPELINE.indexOf(status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {PIPELINE.map((s, i) => (
        <li key={s} className="flex flex-col gap-2">
          <div className={cn("h-2 rounded-pill", i <= idx ? "bg-royal" : "bg-ice")} />
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", i <= idx ? "text-royal" : "text-muted")}>{STATUS_LABEL[s].replace(" for pickup", "")}</span>
        </li>
      ))}
    </ol>
  );
}
