import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, Label, Notice, ProgressRing, SubmitButton, Toast } from "@phanet/ui";
import { requireUser } from "@phanet/supabase/server";
import { SiteShell } from "@/components/site-shell";
import { LessonMedia } from "@/components/lesson-media";
import { LessonList } from "@/components/lesson-list";
import { firstOpenIndex, getAttempt, getCertificate, getCourseBySlug, getCompletedLessonIds, getLessonQuiz, getLessonQuizCounts, getQuiz, listLessons, progressPct } from "@/lib/queries";
import { completeLessonAction, submitLessonQuizAction } from "./actions";

export const dynamic = "force-dynamic";

const KIND_LABEL = { video: "Video lesson", audio: "Audio lesson", reading: "Reading" } as const;

export default async function LessonPage({ params, searchParams }: {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams: Promise<{ ok?: string; error?: string; attempt?: string; w?: string; cert?: string; retry?: string }>;
}) {
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

  const [done, lessonQuiz, quizCounts, finalQuiz, certificate, attempt] = await Promise.all([
    getCompletedLessonIds(session.user.id, lessons.map((l) => l.id)),
    getLessonQuiz(lesson.id),
    getLessonQuizCounts(course.id),
    getQuiz(course.id),
    getCertificate(session.user.id, course.id),
    sp.attempt ? getAttempt(session.user.id, sp.attempt) : Promise.resolve(null),
  ]);
  const open = firstOpenIndex(lessons, done);
  const openUpTo = open === -1 ? lessons.length - 1 : open;
  const locked = index > openUpTo;
  const doneCount = lessons.filter((l) => done.has(l.id)).length;
  const isDone = done.has(lesson.id);
  const allDone = doneCount === lessons.length;
  const firstOpen = open >= 0 ? lessons[open] : null;

  const result = attempt && attempt.quiz_id === lessonQuiz?.quiz.id && !sp.retry ? attempt : null;
  const wrongPositions = new Set((sp.w ?? "").split(".").map(Number).filter((n) => n > 0));
  const prevAnswers = (result?.answers ?? {}) as Record<string, number>;
  const nextHref = next ? `/courses/${course.slug}/lessons/${next.id}` : finalQuiz && !certificate ? `/courses/${course.slug}/quiz` : `/courses/${course.slug}`;
  const nextLabel = next ? "Next lesson →" : finalQuiz && !certificate ? "Go to the final quiz →" : "Back to the course";

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
              {lessonQuiz && <Badge tone="glass">Quiz · {lessonQuiz.questions.length} questions</Badge>}
            </div>
            <h1 className="h3d mt-4 t-h2 leading-[1.02]">{lesson.title}</h1>
          </div>
          <div className="glass p-4 flex items-center gap-3">
            <ProgressRing pct={progressPct(doneCount, lessons.length)} size={64} />
            <div className="text-sm text-white"><Label tone="peach">Progress</Label>{doneCount}/{lessons.length} done</div>
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
          {locked ? (
            <Card className="flex flex-col gap-4 p-8">
              <Label tone="orange">Locked</Label>
              <div className="t-h3 text-deep">Finish the earlier lessons first.</div>
              <p className="t-small text-muted">Lessons open one at a time. {firstOpen ? `You're up to lesson ${open + 1}: ${firstOpen.title}.` : ""}</p>
              {firstOpen && <ButtonLink href={`/courses/${course.slug}/lessons/${firstOpen.id}`} variant="blue" className="self-start">Go to lesson {open + 1}</ButtonLink>}
            </Card>
          ) : (
            <>
              <LessonMedia lesson={lesson} />
              {lesson.kind !== "reading" && lesson.body && (
                <Card className="p-6 md:p-8">
                  <Label tone="orange">Notes</Label>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed">{lesson.body}</p>
                </Card>
              )}

              {lessonQuiz ? (
                <section id="quiz" className="flex flex-col gap-4 scroll-mt-6">
                  {result && (
                    <Card tone={result.passed ? "blue" : "white"} className="flex flex-col gap-3 p-7">
                      <Label tone={result.passed ? "peach" : "orange"}>{result.passed ? "Passed" : "Not yet"}</Label>
                      <div className="flex items-end gap-3"><div className="num-xl">{result.score}%</div><div className={`pb-1 text-sm ${result.passed ? "text-white" : "text-muted"}`}>pass mark {course.pass_mark}%</div></div>
                      <p className={result.passed ? "text-white" : "text-deep"}>
                        {result.passed
                          ? sp.cert ? "You've finished the course. Your certificate is ready!" : next ? "Lesson complete. The next lesson is unlocked." : "Lesson complete."
                          : `Not quite. Check question${wrongPositions.size === 1 ? "" : "s"} ${[...wrongPositions].join(", ")}, rewatch the video if you need to, and try again.`}
                      </p>
                      {result.passed && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sp.cert && certificate ? <ButtonLink href={`/certificates/${certificate.code}/pdf`} variant="white">Download certificate</ButtonLink> : <ButtonLink href={nextHref} variant="white">{nextLabel}</ButtonLink>}
                        </div>
                      )}
                    </Card>
                  )}

                  {isDone && !result ? (
                    <Card className="flex flex-wrap items-center justify-between gap-4">
                      <div><Label tone="orange">Quiz passed</Label><div className="font-bold text-deep mt-1">You've completed this lesson.</div></div>
                      <div className="flex gap-2">
                        <ButtonLink href={`${here}?retry=1#quiz`} variant="ice" size="sm">Retake quiz</ButtonLink>
                        <ButtonLink href={nextHref} size="sm">{nextLabel}</ButtonLink>
                      </div>
                    </Card>
                  ) : (!result || !result.passed) && (
                    <form action={submitLessonQuizAction} className="flex flex-col gap-4">
                      <input type="hidden" name="slug" value={course.slug} />
                      <input type="hidden" name="lesson_id" value={lesson.id} />
                      <input type="hidden" name="quiz_id" value={lessonQuiz.quiz.id} />
                      <div>
                        <Label tone="orange">Quiz</Label>
                        <h2 className="t-h3 text-deep mt-1">{lessonQuiz.questions.length} questions on this lesson</h2>
                        <p className="t-small text-muted mt-1">Score {course.pass_mark}% or more to complete the lesson{next ? " and unlock the next one" : ""}. You can retry as many times as you need.</p>
                      </div>
                      {lessonQuiz.quiz.instructions && <Notice tone="ice">{lessonQuiz.quiz.instructions}</Notice>}
                      {lessonQuiz.questions.map((q, i) => {
                        const wrong = wrongPositions.has(i + 1);
                        return (
                          <fieldset key={q.id} className={`card p-5 md:p-6 flex flex-col gap-3 ${wrong ? "ring-2 ring-[#c2410c]" : ""}`}>
                            <input type="hidden" name="question_id" value={q.id} />
                            <legend className="sr-only">Question {i + 1}</legend>
                            <div className="flex items-center gap-2">
                              <Label tone="orange">Question {i + 1} of {lessonQuiz.questions.length}</Label>
                              {wrong && <Badge tone="warn">Try again</Badge>}
                            </div>
                            <div className="font-bold text-lg leading-snug text-deep">{q.prompt}</div>
                            <div className="flex flex-col gap-2">
                              {q.options.map((opt, idx) => (
                                <label key={idx} className="option-row has-[:checked]:border-royal has-[:checked]:bg-white">
                                  <input type="radio" name={`q_${q.id}`} value={idx} required defaultChecked={!wrong && prevAnswers[q.id] === idx} className="check !rounded-full" />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        );
                      })}
                      <div><SubmitButton size="lg" pendingText="Grading…">{result ? "Submit again" : "Submit answers"}</SubmitButton></div>
                    </form>
                  )}
                </section>
              ) : (
                <Card className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {prev && <ButtonLink href={`/courses/${course.slug}/lessons/${prev.id}`} variant="ice" size="sm">← Previous</ButtonLink>}
                  </div>
                  {isDone ? (
                    <ButtonLink href={nextHref}>{next ? "Completed · next lesson →" : nextLabel}</ButtonLink>
                  ) : (
                    <form action={completeLessonAction}>
                      <input type="hidden" name="slug" value={course.slug} />
                      <input type="hidden" name="lesson_id" value={lesson.id} />
                      <input type="hidden" name="next_id" value={next?.id ?? ""} />
                      <SubmitButton pendingText="Saving…">{next ? "Mark complete & next →" : "Mark complete & finish"}</SubmitButton>
                    </form>
                  )}
                </Card>
              )}
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="flex items-end justify-between">
            <h2 className="t-h3">All lessons</h2>
            <span className="text-xs font-semibold text-muted">{doneCount} of {lessons.length} done</span>
          </div>
          <div className="max-h-[70vh] overflow-y-auto pr-1 -mr-1">
            <LessonList slug={course.slug} lessons={lessons} done={done} currentId={lesson.id} openUpTo={openUpTo} quizCounts={quizCounts} />
          </div>
          {allDone && finalQuiz && !certificate && (
            <Card tone="blue" className="flex flex-col gap-2">
              <Label tone="peach">Last step</Label>
              <div className="font-bold text-lg">Every lesson is done. Take the final quiz.</div>
              <ButtonLink href={`/courses/${course.slug}/quiz`} variant="white" size="sm" className="self-start">Open the final quiz</ButtonLink>
            </Card>
          )}
          {certificate && (
            <Card tone="blue" className="flex flex-col gap-2">
              <Label tone="peach">Certificate earned</Label>
              <ButtonLink href={`/certificates/${certificate.code}/pdf`} variant="white" size="sm" className="self-start">Download PDF</ButtonLink>
            </Card>
          )}
        </aside>
      </div>
    </SiteShell>
  );
}
