import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, ConfirmSubmit, EmptyState, Field, Input, Label, PageHeader, Select, StatCard, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { youtubeId, type Course, type Lesson, type Quiz, type QuizQuestion } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { CourseForm } from "../../CourseForm";
import { addLesson, addQuestion, deleteCourse, deleteLesson, deleteQuestion, moveLesson, saveQuiz } from "../../actions";

const LETTERS = "ABCDEFGH";

export default async function CoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  if (!isNew && !isUuid(id)) notFound();

  if (isNew) {
    return (
      <>
        <PageHeader eyebrow="Academy" title="New course" actions={<Link href="/academy" className="btn btn-ice btn-sm">← All courses</Link>} />
        <Flash ok={sp.ok} error={sp.error} />
        <Card><CourseForm /></Card>
      </>
    );
  }

  const supabase = await createClient();
  const [{ data: courseRow }, { data: lessonRows }, { data: quizRow }, { count: enrolled }, { count: certs }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", id).maybeSingle(),
    supabase.from("lessons").select("*").eq("course_id", id).order("sort_order").order("created_at"),
    supabase.from("quizzes").select("*").eq("course_id", id).maybeSingle(),
    supabase.from("enrollments").select("user_id", { count: "exact", head: true }).eq("course_id", id),
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("course_id", id),
  ]);
  const course = courseRow as Course | null;
  if (!course) notFound();
  const lessons = (lessonRows ?? []) as Lesson[];
  const quiz = (quizRow as Quiz | null) ?? null;
  let questions: QuizQuestion[] = [];
  if (quiz) {
    const { data } = await supabase.from("quiz_questions").select("*").eq("quiz_id", quiz.id).order("sort_order");
    questions = (data ?? []) as QuizQuestion[];
  }

  return (
    <>
      <PageHeader
        eyebrow="Academy"
        title={course.title}
        actions={
          <>
            {course.is_published ? <Badge tone="mint">Published</Badge> : <Badge tone="warn">Draft</Badge>}
            <Link href="/academy" className="btn btn-ice btn-sm">← All courses</Link>
          </>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Lessons" value={lessons.length} />
        <StatCard label="Questions" value={questions.length} sub={quiz ? quiz.title : "No quiz yet"} />
        <StatCard label="Students" value={enrolled ?? 0} sub="enrolled" tone="blue" />
        <StatCard label="Certificates" value={certs ?? 0} sub={`pass mark ${course.pass_mark}%`} tone="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card>
          <Label tone="orange" className="mb-3">Course details</Label>
          <CourseForm course={course} />
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Cover</Label>
            {course.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={course.cover_url} alt={course.title} className="w-full aspect-[4/3] object-cover rounded-card" />
            ) : (
              <div className="aspect-[4/3] rounded-card bg-ice grid place-items-center text-sm text-muted">No cover yet</div>
            )}
          </Card>
          <Card className="flex flex-col gap-3">
            <Label tone="orange">Danger zone</Label>
            <p className="text-sm text-muted">Deleting removes lessons, the quiz, progress and certificates for this course.</p>
            <form action={deleteCourse}>
              <input type="hidden" name="id" value={course.id} />
              <ConfirmSubmit variant="danger" size="sm" message={`Delete "${course.title}" with all its lessons, quiz and student progress?`}>Delete course</ConfirmSubmit>
            </form>
          </Card>
        </div>
      </div>

      {/* ---------- lessons ---------- */}
      <div id="lessons" className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start scroll-mt-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><Label tone="orange">Lessons</Label><Badge tone="good">{lessons.length}</Badge></div>
          {lessons.length === 0 ? (
            <EmptyState title="No lessons yet." body="Add a YouTube video, an audio message or a reading. Students complete them in order." />
          ) : (
            <ol className="flex flex-col gap-2">
              {lessons.map((l, i) => {
                const yt = youtubeId(l.youtube_url);
                return (
                  <li key={l.id} className="option-row flex items-center gap-3">
                    <span className="num-lg text-[20px] text-royal w-8 text-center flex-none">{i + 1}</span>
                    {yt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://i.ytimg.com/vi/${yt}/default.jpg`} alt="" className="w-16 h-12 rounded-xl object-cover flex-none hidden sm:block" />
                    ) : (
                      <span className="w-16 h-12 rounded-xl bg-ice flex-none hidden sm:grid place-items-center text-[10px] font-bold uppercase text-muted">{l.kind}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{l.title}</div>
                      <div className="text-xs text-muted truncate capitalize">{l.kind}{l.duration_minutes ? ` · ${l.duration_minutes} min` : ""}{l.audio_url ? " · audio file" : ""}</div>
                    </div>
                    <div className="flex items-center gap-1 flex-none">
                      <form action={moveLesson}>
                        <input type="hidden" name="id" value={l.id} /><input type="hidden" name="course_id" value={course.id} /><input type="hidden" name="dir" value="up" />
                        <button className="btn btn-ice btn-sm !px-3" disabled={i === 0} aria-label="Move up">↑</button>
                      </form>
                      <form action={moveLesson}>
                        <input type="hidden" name="id" value={l.id} /><input type="hidden" name="course_id" value={course.id} /><input type="hidden" name="dir" value="down" />
                        <button className="btn btn-ice btn-sm !px-3" disabled={i === lessons.length - 1} aria-label="Move down">↓</button>
                      </form>
                      <form action={deleteLesson}>
                        <input type="hidden" name="id" value={l.id} /><input type="hidden" name="course_id" value={course.id} />
                        <ConfirmSubmit variant="danger" size="sm" className="!px-3" message={`Remove lesson "${l.title}"?`}>✕</ConfirmSubmit>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
        <Card className="flex flex-col gap-4">
          <div>
            <Label tone="orange">Add a lesson</Label>
            <p className="text-sm text-muted mt-1">Paste a YouTube link for video, upload or link audio, or write a reading.</p>
          </div>
          <form action={addLesson} className="flex flex-col gap-4">
            <input type="hidden" name="course_id" value={course.id} />
            <Field label="Title"><Input name="title" placeholder="Lesson 1 · Who is Jesus?" required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select name="kind" defaultValue="video">
                  <option value="video">Video (YouTube)</option><option value="audio">Audio</option><option value="reading">Reading</option>
                </Select>
              </Field>
              <Field label="Duration (min)"><Input name="duration_minutes" type="number" min={0} placeholder="25" /></Field>
            </div>
            <Field label="YouTube link"><Input name="youtube_url" type="url" placeholder="https://youtu.be/…" /></Field>
            <Field label="Audio file" hint="MP3/M4A, uploads to course-media."><input type="file" name="audio_file" accept="audio/*" className="input" /></Field>
            <Field label="…or audio URL"><Input name="audio_url" type="url" placeholder="https://" /></Field>
            <Field label="Reading / notes"><Textarea name="body" placeholder="Lesson text, outline or discussion questions." className="!min-h-[90px]" /></Field>
            <Field label="Position" hint="Leave blank to add at the end."><Input name="sort_order" type="number" min={1} /></Field>
            <div><SubmitButton pendingText="Adding…">Add lesson</SubmitButton></div>
          </form>
        </Card>
      </div>

      {/* ---------- quiz ---------- */}
      <div id="quiz" className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start scroll-mt-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><Label tone="orange">Quiz</Label>{quiz && <Badge tone="good">{questions.length} questions</Badge>}</div>
          <form action={saveQuiz} className="flex flex-col gap-3">
            <input type="hidden" name="course_id" value={course.id} />
            <input type="hidden" name="quiz_id" value={quiz?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
              <Field label="Quiz title"><Input name="title" defaultValue={quiz?.title ?? "Final quiz"} /></Field>
              <SubmitButton variant="blue" size="sm" pendingText="Saving…">{quiz ? "Save" : "Create quiz"}</SubmitButton>
            </div>
            <Field label="Instructions"><Textarea name="instructions" defaultValue={quiz?.instructions ?? ""} placeholder="Answer every question. You need the pass mark to earn your certificate." className="!min-h-[70px]" /></Field>
          </form>
          {!quiz ? (
            <EmptyState title="No quiz yet." body="Create the quiz first, then add questions. Students need to pass it (and finish every lesson) to receive a certificate." />
          ) : questions.length === 0 ? (
            <EmptyState title="No questions yet." body="Add the first question on the right." />
          ) : (
            <ol className="flex flex-col gap-3">
              {questions.map((q, i) => (
                <li key={q.id} className="card-ice p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-royal flex-none">Q{i + 1}</span>
                    <div className="font-bold flex-1">{q.prompt}</div>
                    <form action={deleteQuestion}>
                      <input type="hidden" name="id" value={q.id} /><input type="hidden" name="course_id" value={course.id} />
                      <ConfirmSubmit variant="danger" size="sm" className="!px-3" message="Remove this question?">✕</ConfirmSubmit>
                    </form>
                  </div>
                  <ul className="grid gap-1.5 sm:grid-cols-2 text-sm">
                    {(Array.isArray(q.options) ? q.options : []).map((o, oi) => (
                      <li key={oi} className={`rounded-xl px-3 py-2 ${oi === q.correct_index ? "bg-white font-bold text-royal" : "text-muted"}`}>
                        <span className="mr-2">{LETTERS[oi] ?? oi + 1}.</span>{o}{oi === q.correct_index && <span className="ml-2 text-[10px] uppercase tracking-wider">✓ correct</span>}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && <div className="text-xs text-muted">Why: {q.explanation}</div>}
                </li>
              ))}
            </ol>
          )}
        </Card>
        <Card className="flex flex-col gap-4">
          <div>
            <Label tone="orange">Add a question</Label>
            <p className="text-sm text-muted mt-1">{quiz ? "One option per line. Then pick the correct letter." : "Create the quiz first."}</p>
          </div>
          {quiz && (
            <form action={addQuestion} className="flex flex-col gap-4">
              <input type="hidden" name="course_id" value={course.id} />
              <input type="hidden" name="quiz_id" value={quiz.id} />
              <Field label="Question"><Textarea name="prompt" placeholder="What does 1 Timothy 4:12 urge young believers to be?" className="!min-h-[80px]" required /></Field>
              <Field label="Options" hint="One per line, in order A, B, C…"><Textarea name="options" placeholder={"An example to believers\nSilent in church\nWealthy\nFamous"} rows={5} required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Correct option">
                  <Select name="correct_index" defaultValue="0">
                    {LETTERS.split("").map((L, i) => <option key={L} value={i}>Option {L}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Explanation" hint="Shown after the quiz."><Textarea name="explanation" className="!min-h-[70px]" /></Field>
              <div><SubmitButton pendingText="Adding…">Add question</SubmitButton></div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
