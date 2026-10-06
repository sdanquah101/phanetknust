import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, EmptyState, Label, Notice, Script, SubmitButton, Toast } from "@phanet/ui";
import { fmtDateTime } from "@phanet/supabase/format";
import { requireUser } from "@phanet/supabase/server";
import { SiteShell } from "@/components/site-shell";
import { getAttempt, getCertificate, getCourseBySlug, getCompletedLessonIds, getQuiz, listAttempts, listLessons, listQuizQuestions } from "@/lib/queries";
import { submitQuizAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quiz" };

export default async function QuizPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ attempt?: string; error?: string; retry?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const quizPath = `/courses/${slug}/quiz`;
  const session = await requireUser({ next: quizPath });
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const [quiz, lessons] = await Promise.all([getQuiz(course.id), listLessons(course.id)]);
  const done = await getCompletedLessonIds(session.user.id, lessons.map((l) => l.id));
  const remaining = lessons.filter((l) => !done.has(l.id)).length;
  const unlocked = lessons.length > 0 && remaining === 0;

  const [questions, attempts, certificate, attempt] = quiz
    ? await Promise.all([
        listQuizQuestions(quiz.id),
        listAttempts(session.user.id, quiz.id),
        getCertificate(session.user.id, course.id),
        sp.attempt ? getAttempt(session.user.id, sp.attempt) : Promise.resolve(null),
      ])
    : [[], [], null, null];
  const showResult = Boolean(attempt) && !sp.retry;

  return (
    <SiteShell
      next={quizPath}
      heroClassName="py-8 md:py-12"
      hero={
        <div className="max-w-2xl">
          <Link href={`/courses/${course.slug}`} className="label-caps-peach no-underline hover:text-white">← {course.title}</Link>
          <h1 className="h3d mt-4 t-h2 leading-[1] ">{quiz?.title ?? "Final"} <Script peach className="text-[1.15em]">quiz</Script></h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge tone="white">Pass mark {course.pass_mark}%</Badge>
            <Badge tone="glass">{questions.length} {questions.length === 1 ? "question" : "questions"}</Badge>
            {attempts.length > 0 && <Badge tone="glass">{attempts.length} {attempts.length === 1 ? "attempt" : "attempts"}</Badge>}
          </div>
        </div>
      }
    >
      <div className="pt-10 flex flex-col gap-3"><Toast message={sp.error} tone="peach" /></div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          {!quiz ? (
            <EmptyState title="No quiz yet" body="This course doesn't have a quiz yet. Check back soon." action={<ButtonLink href={`/courses/${course.slug}`} variant="blue" size="sm">Back to course</ButtonLink>} />
          ) : showResult && attempt ? (
            <Card tone={attempt.passed ? "blue" : "white"} className="flex flex-col gap-4 p-8">
              <Label tone={attempt.passed ? "peach" : "orange"}>{attempt.passed ? "Passed" : "Not yet"}</Label>
              <div className="flex items-end gap-4">
                <div className="num-xl ">{attempt.score}%</div>
                <div className={`pb-1 text-sm ${attempt.passed ? "text-white" : "text-muted"}`}>pass mark {course.pass_mark}%</div>
              </div>
              <p className={`text-base ${attempt.passed ? "text-white" : "text-deep"}`}>
                {attempt.passed
                  ? certificate
                    ? "Excellent. Your certificate is ready to download and share."
                    : "You passed! Finish every lesson and your certificate will be issued on your next pass."
                  : "Close one. Revisit the lessons, then try again, there's no limit on attempts."}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {attempt.passed && certificate && (
                  <>
                    <ButtonLink href={`/certificates/${certificate.code}/pdf`} variant="white">Download certificate</ButtonLink>
                    <ButtonLink href={`/certificates/${certificate.code}`} variant="ghost">View &amp; verify</ButtonLink>
                  </>
                )}
                {!attempt.passed && <ButtonLink href={`${quizPath}?retry=1`}>Try again</ButtonLink>}
                <ButtonLink href={`/courses/${course.slug}`} variant={attempt.passed ? "ghost" : "ice"}>Back to course</ButtonLink>
              </div>
            </Card>
          ) : !unlocked ? (
            <Card className="flex flex-col gap-4 p-8">
              <Label tone="orange">Locked</Label>
              <div className="text-2xl font-extrabold">Finish the lessons first.</div>
              <p className="text-sm text-muted">{lessons.length ? `${remaining} ${remaining === 1 ? "lesson" : "lessons"} to go before the quiz opens.` : "This course has no lessons yet."}</p>
              <ButtonLink href={`/courses/${course.slug}`} variant="blue" className="self-start">Back to lessons</ButtonLink>
            </Card>
          ) : !questions.length ? (
            <EmptyState title="Questions are being written" body="The quiz for this course has no questions yet. Check back soon." />
          ) : (
            <form action={submitQuizAction} className="flex flex-col gap-5">
              <input type="hidden" name="slug" value={course.slug} />
              <input type="hidden" name="quiz_id" value={quiz.id} />
              {quiz.instructions && <Notice tone="ice">{quiz.instructions}</Notice>}
              {questions.map((q, i) => (
                <fieldset key={q.id} className="card p-6 flex flex-col gap-3">
                  <input type="hidden" name="question_id" value={q.id} />
                  <legend className="sr-only">Question {i + 1}</legend>
                  <Label tone="orange">Question {i + 1} of {questions.length}</Label>
                  <div className="text-lg font-extrabold leading-snug">{q.prompt}</div>
                  <div className="mt-1 flex flex-col gap-2">
                    {q.options.map((opt, idx) => (
                      <label key={idx} className="option-row has-[:checked]:border-royal has-[:checked]:bg-white">
                        <input type="radio" name={`q_${q.id}`} value={idx} required className="check !rounded-full" />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton size="lg" pendingText="Grading…">Submit answers</SubmitButton>
                <span className="text-xs text-muted">You need {course.pass_mark}% to pass. Answers are graded instantly.</span>
              </div>
            </form>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          {certificate && (
            <Card className="flex flex-col gap-2">
              <Label tone="orange">Certificate</Label>
              <div className="font-extrabold">Already earned · {certificate.code}</div>
              <ButtonLink href={`/certificates/${certificate.code}/pdf`} variant="blue" size="sm" className="self-start">Download PDF</ButtonLink>
            </Card>
          )}
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Previous attempts</Label>
            {attempts.length ? (
              <ul className="flex flex-col divide-y divide-ice">
                {attempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="text-muted">{fmtDateTime(a.created_at)}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-extrabold">{a.score}%</span>
                      <Badge tone={a.passed ? "mint" : "warn"}>{a.passed ? "Passed" : "Failed"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No attempts yet. Take your time.</p>
            )}
          </Card>
        </aside>
      </div>
    </SiteShell>
  );
}
