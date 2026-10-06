import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, Label, Notice, ProgressRing, SubmitButton, Toast } from "@phanet/ui";
import { fmtDate } from "@phanet/supabase/format";
import { SiteShell, safeSession } from "@/components/site-shell";
import { FORMAT_LABEL } from "@/components/course-card";
import { LessonList } from "@/components/lesson-list";
import { firstOpenIndex, getCertificate, getCourseBySlug, getEnrollment, getCompletedLessonIds, getLessonQuizCounts, getQuiz, listAttempts, listLessons, progressPct } from "@/lib/queries";
import { enrollAction } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  return { title: course?.title ?? "Course" };
}

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const [lessons, quiz, session, quizCounts] = await Promise.all([listLessons(course.id), getQuiz(course.id), safeSession(), getLessonQuizCounts(course.id)]);
  const lessonIds = lessons.map((l) => l.id);
  const userId = session?.user.id;
  const [done, enrollment, certificate, attempts] = userId
    ? await Promise.all([getCompletedLessonIds(userId, lessonIds), getEnrollment(userId, course.id), getCertificate(userId, course.id), quiz ? listAttempts(userId, quiz.id) : Promise.resolve([])])
    : [new Set<string>(), null, null, []];

  const total = lessons.length;
  const doneCount = lessons.filter((l) => done.has(l.id)).length;
  const pct = progressPct(doneCount, total);
  const allDone = total > 0 && doneCount === total;
  const nextLesson = lessons.find((l) => !done.has(l.id)) ?? lessons[0];
  const open = firstOpenIndex(lessons, done);
  const openUpTo = open === -1 ? lessons.length - 1 : open;
  const quizLessons = quizCounts.size;
  const bestScore = attempts.reduce((m, a) => Math.max(m, a.score), 0);
  const coursePath = `/courses/${course.slug}`;

  return (
    <SiteShell
      next={coursePath}
      hero={
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <Badge tone="white">{course.level}</Badge>
              <Badge tone="glass">{FORMAT_LABEL[course.format] ?? course.format}</Badge>
              {course.duration_label && <Badge tone="glass">{course.duration_label}</Badge>}
            </div>
            <h1 className="h3d mt-5 t-h2 leading-[1] ">{course.title}</h1>
            {course.summary && <p className="mt-5 max-w-xl text-white md:text-lg">{course.summary}</p>}
            {course.instructor && <p className="mt-4 text-sm text-white">Taught by <span className="font-bold text-white">{course.instructor}</span></p>}
          </div>
          {session && (
            <div className="glass p-5 flex items-center gap-4 lg:justify-self-end">
              <ProgressRing pct={pct} size={76} />
              <div>
                <Label tone="peach">Your progress</Label>
                <div className="text-sm text-white mt-1">{doneCount} of {total} lessons</div>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="pt-10 flex flex-col gap-3">
        <Toast message={sp.ok} tone="mint" />
        <Toast message={sp.error} tone="peach" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-6 md:p-8">
            <Label tone="orange">About this course</Label>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-deep">{course.description ?? course.summary ?? "Details are coming soon."}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!session ? (
                <ButtonLink href={`/login?next=${encodeURIComponent(coursePath)}`} size="lg">Sign in to enrol</ButtonLink>
              ) : enrollment ? (
                nextLesson ? (
                  <ButtonLink href={`${coursePath}/lessons/${nextLesson.id}`} size="lg">{allDone ? "Review lessons" : doneCount ? "Continue" : "Start learning"}</ButtonLink>
                ) : null
              ) : (
                <form action={enrollAction}>
                  <input type="hidden" name="slug" value={course.slug} />
                  <input type="hidden" name="course_id" value={course.id} />
                  <SubmitButton size="lg" pendingText="Enrolling…">Enrol for free</SubmitButton>
                </form>
              )}
              {enrollment && <span className="self-center text-xs text-muted">Enrolled {fmtDate(enrollment.enrolled_at)}</span>}
            </div>
          </Card>

          <section>
            <div className="flex items-end justify-between gap-4 mb-4">
              <h2 className="t-h2">Lessons · {total}</h2>
              {session && <span className="text-xs font-semibold text-muted">{doneCount} done</span>}
            </div>
            <LessonList slug={course.slug} lessons={lessons} done={done} locked={!session} openUpTo={openUpTo} quizCounts={quizCounts} />
            {!session && total > 0 && <p className="mt-3 text-xs text-muted">Sign in to open lessons and track your progress.</p>}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          {certificate ? (
            <Card tone="blue" className="flex flex-col gap-3">
              <Label tone="peach">Certificate earned</Label>
              <div className="text-2xl font-extrabold">Well done, {certificate.recipient_name.split(/\s+/)[0]}.</div>
              <div className="text-sm text-white">Issued {fmtDate(certificate.issued_at)} · Code {certificate.code}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <ButtonLink href={`/certificates/${certificate.code}/pdf`} variant="white" size="sm">Download PDF</ButtonLink>
                <ButtonLink href={`/certificates/${certificate.code}`} variant="ghost" size="sm">Verify</ButtonLink>
              </div>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-3">
            <Label tone="orange">How this course works</Label>
            <ul className="flex flex-col gap-2 t-small text-deep">
              <li>1. Watch each lesson in order.</li>
              {quizLessons > 0 && <li>2. Answer the short quiz after it. Score {course.pass_mark}% to unlock the next lesson. Retry as often as you like.</li>}
              <li>{quizLessons > 0 ? "3." : "2."} Finish every lesson{quiz ? " and pass the final quiz" : ""} to receive your certificate.</li>
            </ul>
          </Card>
          {quiz && (
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Final quiz</Label>
            <div className="text-xl font-extrabold">{quiz.title}</div>
            <p className="text-sm text-muted">{quiz.instructions ?? "Finish every lesson to unlock the final quiz."} Pass mark <span className="font-bold text-deep">{course.pass_mark}%</span>.</p>
            {attempts.length > 0 && (
              <div className="text-xs text-muted">{attempts.length} {attempts.length === 1 ? "attempt" : "attempts"} · best score <span className="font-bold text-deep">{bestScore}%</span></div>
            )}
            {!session ? (
              <ButtonLink href={`/login?next=${encodeURIComponent(`${coursePath}/quiz`)}`} variant="outline-blue" size="sm" className="self-start">Sign in to take the quiz</ButtonLink>
            ) : allDone ? (
              <ButtonLink href={`${coursePath}/quiz`} variant="blue" size="sm" className="self-start">{certificate ? "Retake quiz" : attempts.length ? "Try again" : "Take the quiz"}</ButtonLink>
            ) : (
              <Notice tone="peach">Locked · {total - doneCount} {total - doneCount === 1 ? "lesson" : "lessons"} to go.</Notice>
            )}
          </Card>
          )}
        </aside>
      </div>
    </SiteShell>
  );
}
