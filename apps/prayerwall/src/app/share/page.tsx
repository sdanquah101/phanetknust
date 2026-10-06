import type { Metadata } from "next";
import { Badge, Button, ButtonLink, Card, Field, Input, Label, Notice, Script, SubmitButton, Textarea } from "@phanet/ui";
import { fmtDate } from "@phanet/supabase/format";
import { Shell } from "@/components/Shell";
import { lookupByCode, normalizeCode } from "@/lib/queries";
import { relativeTime } from "@/lib/time";
import { submitTestimonyAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Share a testimony" };

type Search = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function SharePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const code = normalizeCode(first(sp.code));
  const error = first(sp.error);
  const request = code ? await lookupByCode(code) : null;

  return (
    <Shell>
      <section className="fade-up">
        <Label tone="peach">Share a testimony</Label>
        <h1 className="h3d t-h2 mt-3">
          Come back <Script peach className="text-[1.15em]">rejoicing</Script>
        </h1>
        <p className="mt-5 text-white text-lg max-w-xl">Enter the code you received when you added your request. Your testimony shows on the wall anonymously.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.6fr] items-start">
        <Card className="card-lg p-6 md:p-8">
          <Label tone="orange">Step 1 · Your code</Label>
          <form method="get" action="/share" className="mt-4 flex flex-col gap-4">
            <Field label="Code" hint="Looks like PW-XXXXXX">
              <Input
                name="code"
                defaultValue={code}
                placeholder="PW-XXXXXX"
                className="uppercase tracking-[.14em] font-bold"
                maxLength={9}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                required
              />
            </Field>
            <Button type="submit" variant="blue">
              Find my request
            </Button>
          </form>
          {error && !request && <Notice tone="peach" className="mt-4">{error}</Notice>}
          {code && !request && !error && <Notice tone="peach" className="mt-4">We couldn&apos;t find that code. Check it and try again.</Notice>}
          {!code && (
            <p className="text-xs text-muted mt-5">
              Lost your code? Add a fresh request on the <a href="/#add" className="font-bold text-royal">wall</a> and we&apos;ll give you a new one.
            </p>
          )}
        </Card>

        {request && (
          <div className="flex flex-col gap-5" id="testify">
            <Card className="p-6 md:p-8 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label tone="orange">Your request</Label>
                <div className="flex gap-2">
                  <Badge tone="good">{request.category}</Badge>
                  {request.status === "answered" && <Badge tone="mint">Answered</Badge>}
                </div>
              </div>
              <h2 className="text-[22px] md:text-[26px] text-deep leading-snug">{request.topic}</h2>
              {request.body && <p className="text-sm text-muted whitespace-pre-line">{request.body}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted pt-3 border-t border-ice">
                <span>Added {relativeTime(request.created_at)}</span>
                <span>🙏 {request.pray_count.toLocaleString("en-GH")} praying</span>
              </div>
            </Card>

            {request.testimonies.length > 0 && (
              <Card className="p-6 md:p-8 flex flex-col gap-4">
                <Label tone="orange">
                  {request.testimonies.length === 1 ? "Your testimony" : `Your testimonies (${request.testimonies.length})`}
                </Label>
                {request.testimonies.map((t) => (
                  <div key={t.id} className="card-ice p-4">
                    <p className="text-sm text-deep whitespace-pre-line">{t.body}</p>
                    <div className="text-xs text-muted mt-2">{fmtDate(t.created_at)}</div>
                  </div>
                ))}
              </Card>
            )}

            <Card className="card-lg p-6 md:p-8">
              <Label tone="orange">Step 2 · What did God do?</Label>
              <form action={submitTestimonyAction} className="mt-4 flex flex-col gap-4">
                <input type="hidden" name="code" value={code} />
                {error && <Notice tone="peach">{error}</Notice>}
                <Field label="Your testimony" hint="10 to 3,000 characters. Shown anonymously.">
                  <Textarea name="body" required minLength={10} maxLength={3000} className="min-h-[160px]" placeholder="Tell us how the prayer was answered." />
                </Field>
                <div className="flex flex-wrap items-center gap-3">
                  <SubmitButton pendingText="Sharing…">Share my testimony</SubmitButton>
                  <ButtonLink href="/" variant="ice" size="sm">
                    Back to the wall
                  </ButtonLink>
                </div>
              </form>
            </Card>
          </div>
        )}
      </section>
    </Shell>
  );
}
