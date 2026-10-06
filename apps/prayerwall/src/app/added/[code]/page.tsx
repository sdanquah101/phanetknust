import type { Metadata } from "next";
import { Badge, ButtonLink, Card, EmptyState, Label, Script } from "@phanet/ui";
import { Shell } from "@/components/Shell";
import { CopyButton } from "@/components/CopyButton";
import { CODE_RE, lookupByCode, normalizeCode } from "@/lib/queries";
import { relativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your code", robots: { index: false } };

const SITE = "https://prayerwall.phaneteers.com";

export default async function AddedPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = normalizeCode(decodeURIComponent(raw));
  const request = CODE_RE.test(code) ? await lookupByCode(code) : null;

  if (!request) {
    return (
      <Shell>
        <section className="max-w-xl mx-auto w-full">
          <EmptyState
            title="We couldn't find that code"
            body="Check the code and try again, or add a new request to the wall."
            action={<ButtonLink href="/#add">+ Add a request</ButtonLink>}
          />
        </section>
      </Shell>
    );
  }

  const shareUrl = `${SITE}/share?code=${encodeURIComponent(code)}`;
  const waText = `My PHANET Prayer Wall code is ${code}. Keep it safe — I'll use it to share my testimony here: ${shareUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <Shell>
      <section className="flex flex-col gap-10">
        <div className="fade-up">
          <Label tone="peach">Added to the wall</Label>
          <h1 className="h3d t-h2 mt-3">
            We&apos;re praying <Script peach className="text-[1.15em]">with you</Script>
          </h1>
          <p className="mt-4 text-white text-lg max-w-xl">Your request is on the wall. This code is yours alone — it is how you come back with the testimony.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          <Card tone="blue" className="card-lg p-7 md:p-10 flex flex-col gap-5 tilt-n2">
            <Label tone="peach">Your code</Label>
            <div className="font-extrabold t-h1 leading-none tracking-[.08em] break-all select-all" aria-label={`Your code ${code.split("").join(" ")}`}>
              {code}
            </div>
            <p className="text-white text-sm md:text-base font-medium">Save this code — it is the only way to add your testimony later.</p>
            <div className="flex flex-wrap gap-3">
              <CopyButton text={code} />
              <a href={waHref} target="_blank" rel="noreferrer" className="btn btn-ghost">
                Send to myself on WhatsApp
              </a>
            </div>
          </Card>

          <div className="flex flex-col gap-5">
            <Card className="p-6 md:p-8 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Label tone="orange">Your request</Label>
                <Badge tone="good">{request.category}</Badge>
              </div>
              <h2 className="text-[22px] md:text-[26px] text-deep leading-snug">{request.topic}</h2>
              {request.body && <p className="text-sm text-muted whitespace-pre-line">{request.body}</p>}
              <div className="text-xs text-muted pt-3 border-t border-ice">Added {relativeTime(request.created_at)} · shown anonymously</div>
            </Card>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/">Back to the wall</ButtonLink>
              <ButtonLink href={`/share?code=${encodeURIComponent(code)}`} variant="ghost">
                Share a testimony later
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
