import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, Field, Input, Label, Notice, Script, Select, SubmitButton, Textarea, cn } from "@phanet/ui";
import { Shell } from "@/components/Shell";
import { RequestCard } from "@/components/RequestCard";
import { Pager } from "@/components/Pager";
import { CATEGORIES, isCategory, type Category } from "@/lib/categories";
import { getPrayingCount, getVerse, getWall } from "@/lib/queries";
import { submitRequestAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "PHANET Prayer Wall" };

type Search = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function WallPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const rawCategory = first(sp.category);
  const category: Category | undefined = isCategory(rawCategory) ? rawCategory : undefined;
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);
  const error = first(sp.error);

  const [praying, verse, wall] = await Promise.all([getPrayingCount(), getVerse(), getWall({ category, page })]);

  const wallHref = (p: number, c: Category | undefined = category) => {
    const q = new URLSearchParams();
    if (c) q.set("category", c);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/${s ? `?${s}` : ""}#wall`;
  };

  return (
    <Shell>
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.35fr_1fr] items-center">
        <div className="fade-up">
          <Label tone="peach">Prayer wall</Label>
          <h1 className="h3d text-[40px] md:text-[64px] mt-3 max-w-3xl">
            {praying > 0 ? (
              <>
                {praying.toLocaleString("en-GH")} people are praying <Script peach className="text-[1.15em]">with you</Script>
              </>
            ) : (
              <>
                We&apos;re praying <Script peach className="text-[1.15em]">with you</Script>
              </>
            )}
          </h1>
          <p className="mt-5 text-white/85 text-lg md:text-xl max-w-xl">Share a burden. Keep the code. Come back with the testimony.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#add" size="lg">
              + Add a request
            </ButtonLink>
            <ButtonLink href="/share" variant="ghost" size="lg">
              I have a code
            </ButtonLink>
          </div>
        </div>
        <Card className="tilt-3 card-lg p-7 md:p-9 w-full max-w-md lg:ml-auto floaty">
          <Label tone="orange">Verse of the day</Label>
          <p className="font-script text-deep text-[22px] md:text-[26px] leading-snug mt-4">&ldquo;{verse.text}&rdquo;</p>
          <div className="label-caps text-muted mt-5">{verse.reference}</div>
        </Card>
      </section>

      {/* Add a request */}
      <section id="add" className="scroll-mt-24">
        <Card className="card-lg p-6 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
            <div>
              <Label tone="orange">Add a request</Label>
              <h2 className="text-[30px] md:text-[38px] mt-2 text-deep">What should we pray about?</h2>
              <p className="text-muted text-sm mt-4 max-w-sm">
                No names, no login. Your topic shows on the wall anonymously and you receive a code like <span className="font-bold text-deep">PW-XXXXXX</span> to bring your testimony back with.
              </p>
            </div>
            <form action={submitRequestAction} className="flex flex-col gap-4">
              {error && <Notice tone="peach">{error}</Notice>}
              <Field label="Topic" hint="Up to 120 characters">
                <Input name="topic" required minLength={3} maxLength={120} placeholder="e.g. Strength for my final exams" autoComplete="off" />
              </Field>
              <Field label="Details (optional)" hint="Up to 1,500 characters">
                <Textarea name="body" maxLength={1500} placeholder="Say as much or as little as you like." />
              </Field>
              <Field label="Category">
                <Select name="category" defaultValue="General">
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <SubmitButton pendingText="Adding…">Add to the wall</SubmitButton>
                <span className="text-xs text-muted">Shown anonymously. Keep the code we give you.</span>
              </div>
            </form>
          </div>
        </Card>
      </section>

      {/* The wall */}
      <section id="wall" className="scroll-mt-24 flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Label tone="peach">The wall</Label>
            <h2 className="h3d text-[32px] md:text-[44px] mt-2">
              {wall.total.toLocaleString("en-GH")} {wall.total === 1 ? "request" : "requests"}
              {category ? <span className="text-white/70"> · {category}</span> : null}
            </h2>
          </div>
          <p className="text-white/80 text-sm">Tap 🙏 to let someone know you&apos;re praying.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-[22px] px-[22px] lg:mx-0 lg:px-0 lg:flex-wrap" role="list" aria-label="Filter by category">
          <Link href={wallHref(1, undefined)} className={cn("pill", category ? "pill-glass" : "pill-white")} aria-current={category ? undefined : "true"} role="listitem">
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={wallHref(1, c)} className={cn("pill", category === c ? "pill-white" : "pill-glass")} aria-current={category === c ? "true" : undefined} role="listitem">
              {c}
            </Link>
          ))}
        </div>

        {wall.items.length === 0 ? (
          <EmptyState
            title={category ? `Nothing under ${category} yet` : "Be the first to add a request"}
            body={category ? "Try another category or add the first request here." : "Your topic shows here anonymously, and the whole fellowship prays with you."}
            action={
              <ButtonLink href="#add" size="sm">
                + Add a request
              </ButtonLink>
            }
          />
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
            {wall.items.map((r) => (
              <div key={r.id} className="break-inside-avoid mb-5">
                <RequestCard request={r} />
              </div>
            ))}
          </div>
        )}

        <Pager page={page} total={wall.total} href={(p) => wallHref(p)} />
      </section>
    </Shell>
  );
}
