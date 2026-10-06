import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, Label, ProgressRing, SubmitButton, Toast } from "@phanet/ui";
import { requireUser } from "@phanet/supabase/server";
import { SiteShell } from "@/components/site-shell";
import { LessonMedia } from "@/components/lesson-media";
import { LessonList } from "@/components/lesson-list";
import { getCourseBySlug, getCompletedLessonIds, listLessons, progressPct } from "@/lib/queries";
import { completeLessonAction } from "./actions";

export const dynamic = "force-dynamic";

const KIND_LABEL = { video: "Video lesson", audio: "Audio lesson", reading: "Reading" } as const;

export default async function LessonPage({ params, searchParams }: { params: Promise<{ slug: string; lessonId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ slug, lessonId }, sp] = await Promise.all([params, searchParams]);
  const here = `/courses/${slug}/lessons/${lessonId}`;
  const session = await requireUser({ next: here });
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const lessons = await listLessons(course.id);
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) notFound();
  const lesson = lessons[index];
  const next = lessons[index + 1];
  const prev = lessons[index - 1];
  const done = await getCompletedLessonIds(session.user.id, lessons.map((l) => l.id));
  const doneCount = lessons.filter((l) => done.has(l.id)).length;
  const isDone = done.has(lesson.id);
  const allDone = doneCount === lessons.length;

  return (
    <SiteShell
      next={here}
      heroClassName="py-8 md:py-10"
      hero={
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <Link href={`/courses/${course.slug}`} className="label-caps-peach no-underline hover:text-white">← {course.title}</Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="glass">Lesson {index + 1} of {lessons.length}</Badge>
              <Badge tone="white">{KIND_LABEL[lesson.kind]}</Badge>
              {lesson.duration_minutes ? <Badge tone="glass">{lesson.duration_minutes} min</Badge> : null}
            </div>
            <h1 className="h3d mt-4 text-[30px] leading-[1.02] md:text-[44px]">{lesson.title}</h1>
          </div>
          <div className="glass p-4 flex items-center gap-3">
            <ProgressRing pct={progressPct(doneCount, lessons.length)} size={64} />
            <div className="text-sm text-white/90"><Label tone="peach">Progress</Label>{doneCount}/{lessons.length} done</div>
          </div>
        </div>
      }
    >
      <div className="pt-10 flex flex-col gap-3">
        <Toast message={sp.ok} tone="mint" />
        <Toast message={sp.error} tone="peach" />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <LessonMedia lesson={lesson} />
          {lesson.kind !== "reading" && lesson.body && (
            <Card className="p-6 md:p-8">
              <Label tone="orange">Notes</Label>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{lesson.body}</p>
            </Card>
          )}
          <Card className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {prev && <ButtonLink href={`/courses/${course.slug}/lessons/${prev.id}`} variant="ice" size="sm">← Previous</ButtonLink>}
              {next && <ButtonLink href={`/courses/${course.slug}/lessons/${next.id}`} variant="ice" size="sm">Next →</ButtonLink>}
            </div>
            {isDone && next ? (
              <ButtonLink href={`/courses/${course.slug}/lessons/${next.id}`}>Completed · next lesson →</ButtonLink>
            ) : isDone && allDone ? (
              <ButtonLink href={`/courses/${course.slug}/quiz`} variant="blue">Take the quiz →</ButtonLink>
            ) : (
              <form action={completeLessonAction}>
                <input type="hidden" name="slug" value={course.slug} />
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="lesson_id" value={lesson.id} />
                <input type="hidden" name="next_id" value={next?.id ?? ""} />
                <SubmitButton pendingText="Saving…">{next ? "Mark complete & next →" : "Mark complete & finish"}</SubmitButton>
              </form>
            )}
          </Card>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <h2 className="text-[22px]">All lessons</h2>
            <span className="text-xs font-semibold text-muted">{doneCount} of {lessons.length} done</span>
          </div>
          <LessonList slug={course.slug} lessons={lessons} done={done} currentId={lesson.id} />
          {allDone && (
            <Card tone="blue" className="flex flex-col gap-2">
              <Label tone="peach">Ready</Label>
              <div className="font-extrabold text-lg">You've finished every lesson.</div>
              <ButtonLink href={`/courses/${course.slug}/quiz`} variant="white" size="sm" className="self-start">Open the quiz</ButtonLink>
            </Card>
          )}
        </aside>
      </div>
    </SiteShell>
  );
}
