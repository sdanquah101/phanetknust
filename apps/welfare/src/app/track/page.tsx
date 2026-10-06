import { Blobs, Field, Input, Notice, Script, StageDisc, SubmitButton } from "@phanet/ui";
import { WelfareHeader } from "@/components/public-header";
import { WelfareFooter } from "@/components/public-footer";
import { trackAction } from "./actions";

export const metadata = { title: "Track a request" };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="min-h-dvh bg-white">
      <section className="ground-blue">
        <Blobs />
        <WelfareHeader />
        <div className="container-page relative pt-12 pb-6 md:pt-16">
          <h1 className="h3d text-[40px] md:text-[60px] leading-[0.98]">Where&apos;s my <Script peach className="text-[1.2em]">pack?</Script></h1>
          <p className="mt-4 text-white/85 max-w-md">Enter the code you got when you sent your request.</p>
        </div>
        <StageDisc className="mt-8" />
      </section>
      <section className="container-page py-10 md:py-14">
        <form action={trackAction} className="card p-6 md:p-8 max-w-md flex flex-col gap-4">
          {sp.error && <Notice tone="peach">{sp.error}</Notice>}
          <Field label="Request code" hint="Looks like WF-0012-A3F">
            <Input name="code" placeholder="WF-0000-XXX" autoComplete="off" autoCapitalize="characters" required className="font-mono uppercase" />
          </Field>
          <SubmitButton size="lg" pendingText="Looking…">Check status →</SubmitButton>
        </form>
      </section>
      <WelfareFooter />
    </main>
  );
}
