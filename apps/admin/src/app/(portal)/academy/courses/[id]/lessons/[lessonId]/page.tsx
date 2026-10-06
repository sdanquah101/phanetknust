import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, ConfirmSubmit, EmptyState, Field, Input, Label, PageHeader, Select, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { youtubeId, type Course, type Lesson, type QuizQuestion } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { addLessonQuestion, deleteQuestion, removeLessonQuiz, updateLesson } from "../../../../actions";

const LETTERS = "ABCDEFGH";

export default async function LessonEditPage({ params, searchParams }: { params: Promise<{ id: string; lessonId: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id, lessonId }, sp] = await Promise.all([params, searchParams]);
  if (!isUuid(id) || !isUuid(lessonId)) notFound();
  const supabase = await createClient();
  const [{ data: courseRow }, { data: lessonRows }, { data: quizRow }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle(),
    supabase.from("lessons").select("*").eq("course_id", id).order("sort_order").order("created_at"),
    supabase.from("quizzes").select("id").eq("lesson_id", lessonId).maybeSingle(),
  ]);
  const course = courseRow as Course | null;
  const lessons = (lessonRows ?? []) as Lesson[];
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (!course || index < 0) notFound();
  const lesson = lessons[index];
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  const quizId = (quizRow as { id: string } | null)?.id ?? null;
  let questions: QuizQuestion[] = [];
  if (quizId) {
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quizId).order("sort_order");
    questions = (data ?? []) as QuizQuestion[];
  }
  const here = `/academy/courses/${course.id}/lessons/${lesson.id}`;
  const yt = youtubeId(lesson.youtube_url);

  return (
    <>
      <PageHeader
        eyebrow={`${course.title} · Lesson ${index + 1} of ${lessons.length}`}
        title={lesson.title}
        actions={
          <>
            {prev && <Link href={`/academy/courses/${course.id}/lessons/${prev.id}`} className="btn btn-ice btn-sm">← Lesson {index}</Link>}
            {next && <Link href={`/academy/courses/${course.id}/lessons/${next.id}`} className="btn btn-ice btn-sm">Lesson {index + 2} →</Link>}
            <Link href={`/academy/courses/${course.id}#lessons`} className="btn btn-white btn-sm">All lessons</Link>
          </>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] items-start">
        <Card className="flex flex-col gap-4">
          <Label tone="orange">Lesson</Label>
          {yt && (
            <div className="aspect-video rounded-[18px] overflow-hidden bg-deep">
              <iframe src={`https://www.youtube.com/embed/${yt}`} title={lesson.title} className="w-full h-full" allowFullScreen />
            </div>
          )}
          <form action={updateLesson} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={lesson.id} />
            <input type="hidden" name="course_id" value={course.id} />
            <Field label="Title"><Input name="title" defaultValue={lesson.title} required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select name="kind" defaultValue={lesson.kind}>
                  <option value="video">Video (YouTube)</option><option value="audio">Audio</option><option value="reading">Reading</option>
                </Select>
              </Field>
              <Field label="Duration (min)"><Input name="duration_minutes" type="number" min={0} defaultValue={lesson.duration_minutes ?? ""} /></Field>
            </div>
            <Field label="YouTube link"><Input name="youtube_url" type="url" defaultValue={lesson.youtube_url ?? ""} placeholder="https://youtu.be/…" /></Field>
            <Field label="Audio URL"><Input name="audio_url" type="url" defaultValue={lesson.audio_url ?? ""} placeholder="https://" /></Field>
            <Field label="Notes / reading"><Textarea name="body" defaultValue={lesson.body ?? ""} className="!min-h-[90px]" /></Field>
            <div><SubmitButton variant="blue" pendingText="Saving…">Save lesson</SubmitButton></div>
          </form>
        </Card>

        <div id="quiz" className="flex flex-col gap-6 scroll-mt-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <Label tone="orange">Quiz after this lesson</Label>
              {questions.length ? <Badge tone="mint">{questions.length} questions</Badge> : <Badge tone="warn">No quiz</Badge>}
            </div>
            <p className="text-sm text-muted -mt-2">
              {questions.length
                ? `Students must score ${course.pass_mark}% to complete this lesson and unlock the next one.`
                : "Without a quiz, students mark this lesson complete themselves. Add questions here, or import them for every lesson at once from the course page."}
            </p>
            {questions.length === 0 ? (
              <EmptyState title="No questions yet." body="Add the first question below." />
            ) : (
              <ol className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <li key={q.id} className="card-ice p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-royal flex-none">Q{i + 1}</span>
                      <div className="font-bold flex-1">{q.prompt}</div>
                      <form action={deleteQuestion}>
                        <input type="hidden" name="id" value={q.id} /><input type="hidden" name="course_id" value={course.id} /><input type="hidden" name="back" value={`${here}#quiz`} />
                        <ConfirmSubmit variant="danger" size="sm" className="!px-3" message="Remove this question?">✕</ConfirmSubmit>
                      </form>
                    </div>
                    <ul className="grid gap-1.5 sm:grid-cols-2 text-sm">
                      {(Array.isArray(q.options) ? q.options : []).map((o, oi) => (
                        <li key={oi} className={`rounded-xl px-3 py-2 ${oi === q.correct_index ? "bg-white font-bold text-royal" : "text-muted"}`}>
                          <span className="mr-2">{LETTERS[oi] ?? oi + 1}.</span>{o}{oi === q.correct_index && <span className="ml-2 text-[11px] uppercase tracking-wider">✓ correct</span>}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && <div className="text-xs text-muted">Why: {q.explanation}</div>}
                  </li>
                ))}
              </ol>
            )}
            {quizId && (
              <form action={removeLessonQuiz}>
                <input type="hidden" name="course_id" value={course.id} /><input type="hidden" name="lesson_id" value={lesson.id} />
                <ConfirmSubmit variant="ice" size="sm" message="Remove this lesson's quiz and all its questions?">Remove this quiz</ConfirmSubmit>
              </form>
            )}
          </Card>

          <Card className="flex flex-col gap-4">
            <Label tone="orange">Add a question</Label>
            <form action={addLessonQuestion} className="flex flex-col gap-4">
              <input type="hidden" name="course_id" value={course.id} />
              <input type="hidden" name="lesson_id" value={lesson.id} />
              <Field label="Question"><Textarea name="prompt" className="!min-h-[70px]" required /></Field>
              <Field label="Options" hint="One per line, in order A, B, C…"><Textarea name="options" rows={4} placeholder={"Option A\nOption B\nOption C\nOption D"} required /></Field>
              <Field label="Correct option">
                <Select name="correct_index" defaultValue="0">
                  {LETTERS.split("").map((L, i) => <option key={L} value={i}>Option {L}</option>)}
                </Select>
              </Field>
              <Field label="Explanation" hint="Optional. For your own notes (not shown to students)."><Textarea name="explanation" className="!min-h-[60px]" /></Field>
              <div><SubmitButton pendingText="Adding…">Add question</SubmitButton></div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
