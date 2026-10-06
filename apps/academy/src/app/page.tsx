import Link from "next/link";
import { ButtonLink, EmptyState, Label, Script, VerseBadge } from "@phanet/ui";
import { SiteShell } from "@/components/site-shell";
import { CourseCardView } from "@/components/course-card";
import { listCourses, listResources } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "Watch", body: "Short video and audio lessons you can take on your phone, between lectures or on the trotro." },
  { n: "02", title: "Quiz", body: "A quick quiz at the end checks what stuck. Retake it as many times as you need." },
  { n: "03", title: "Certificate", body: "Pass and download a PHANET Academy certificate with a public verification link." },
];

export default async function HomePage() {
  const [courses, resources] = await Promise.all([listCourses(), listResources()]);
  const featured = courses.slice(0, 6);
  const books = resources.filter((r) => r.kind === "book").length;
  const messages = resources.filter((r) => r.kind === "message" || r.kind === "audio").length;

  return (
    <SiteShell
      heroClassName="pt-10 pb-28 md:pt-16 md:pb-36"
      hero={
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="max-w-2xl">
            <VerseBadge>2026/27 · Let No Man Despise Thy Youth</VerseBadge>
            <h1 className="h3d mt-6 text-[44px] leading-[0.98] md:text-[72px]">
              Grow in the Word, <Script peach className="text-[1.15em]">anywhere</Script>
            </h1>
            <p className="mt-6 max-w-lg text-base text-white/85 md:text-lg">
              Free Bible courses from PHANET KNUST, taught on video and audio. Watch at your pace, take the quiz, earn your certificate.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/courses" size="lg">Browse courses</ButtonLink>
              <ButtonLink href="/library" variant="ghost" size="lg">Visit the library</ButtonLink>
            </div>
          </div>
          <div className="hidden lg:flex justify-end">
            <div className="glass tilt-2 p-6 w-[320px] floaty">
              <Label tone="peach">This season</Label>
              <div className="num-xl mt-2">{courses.length}</div>
              <div className="text-sm text-white/85">{courses.length === 1 ? "course" : "courses"} open for enrolment</div>
              <div className="divider-glass my-4" />
              <div className="text-sm text-white/85">{books} {books === 1 ? "book" : "books"} · {messages} {messages === 1 ? "message" : "messages"} in the library</div>
            </div>
          </div>
        </div>
      }
      lipChildren={
        <div className="card card-lg p-6 md:p-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <div className="num-lg text-tangerine">{s.n}</div>
              <div>
                <div className="font-extrabold text-lg">{s.title}</div>
                <p className="mt-1 text-sm text-muted">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      }
    >
      <section className="pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Label tone="orange">Courses</Label>
            <h2 className="mt-2 text-[30px] md:text-[38px]">Start <span className="script text-royal text-[1.15em]">learning</span></h2>
          </div>
          <Link href="/courses" className="btn btn-ice btn-sm">All courses</Link>
        </div>
        {featured.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => <CourseCardView key={c.id} course={c} />)}
          </div>
        ) : (
          <EmptyState className="mt-6" title="Courses are being prepared" body="The first PHANET Academy courses land soon. Check back shortly or browse the library meanwhile." action={<ButtonLink href="/library" variant="blue" size="sm">Open the library</ButtonLink>} />
        )}
      </section>

      <section className="mt-14 card-blue p-8 md:p-10 relative overflow-hidden">
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Label tone="peach">Library</Label>
            <h2 className="mt-2 text-[28px] md:text-[34px] text-white">Books and messages to <span className="script text-peach text-[1.15em]">keep</span></h2>
            <p className="mt-3 max-w-lg text-sm text-white/85">
              Download books, listen to messages and pick up study documents from PHANET KNUST. Free, always.
            </p>
          </div>
          <ButtonLink href="/library" variant="white">Open the library</ButtonLink>
        </div>
      </section>
    </SiteShell>
  );
}
