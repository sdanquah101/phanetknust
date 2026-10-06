import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, ConfirmSubmit, EmptyState, Field, Input, Label, PageHeader, Select, StatCard, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { youtubeId, type Course, type Lesson, type Quiz, type QuizQuestion } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { CourseForm } from "../../CourseForm";
import { addLesson, addQuestion, bulkAddLessons, deleteCourse, deleteLesson, deleteQuestion, importQuestions, moveLesson, saveQuiz } from "../../actions";

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
    supabase.from("quizzes").select("*").eq("course_id", id).is("lesson_id", null).maybeSingle(),
    supabase.from("enrollments").select("user_id", { count: "exact", head: true }).eq("course_id", id),
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("course_id", id),
  ]);
  const course = courseRow as Course | null;
  if (!course) notFound();
  const lessons = (lessonRows ?? []) as Lesson[];
  const quiz = (quizRow as Quiz | null) ?? null;
  // per-lesson quizzes and their question counts
  const { data: lqRows } = await supabase.from("quizzes").select("id, lesson_id, quiz_questions(count)").eq("course_id", id).not("lesson_id", "is", null);
  const lessonQ = new Map<string, number>();
  for (const r of (lqRows ?? []) as { lesson_id: string; quiz_questions: { count: number }[] }[]) lessonQ.set(r.lesson_id, r.quiz_questions?.[0]?.count ?? 0);
  const lessonQuestionTotal = [...lessonQ.values()].reduce((a, b) => a + b, 0);
  const lessonsWithQuiz = lessons.filter((l) => (lessonQ.get(l.id) ?? 0) > 0).length;
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
        <StatCard label="Lesson quizzes" value={`${lessonsWithQuiz}/${lessons.length}`} sub={`${lessonQuestionTotal} questions${quiz ? ` · final quiz ${questions.length}` : ""}`} />
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
            <EmptyState title="No lessons yet." body="Add lessons one at a time on the right, or many at once below. Students complete them in order." />
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
                    {(lessonQ.get(l.id) ?? 0) > 0 ? <Badge tone="mint" className="flex-none hidden md:inline-flex">Quiz · {lessonQ.get(l.id)}</Badge> : <Badge tone="warn" className="flex-none hidden md:inline-flex">No quiz</Badge>}
                    <div className="flex items-center gap-1 flex-none">
                      <Link href={`/academy/courses/${course.id}/lessons/${l.id}`} className="btn btn-blue btn-sm !px-3">Edit</Link>
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

      {/* ---------- bulk lessons + question import ---------- */}
      <div id="import" className="grid gap-6 lg:grid-cols-2 items-start scroll-mt-6">
        <Card className="flex flex-col gap-4">
          <div>
            <Label tone="orange">Add many lessons at once</Label>
            <p className="text-sm text-muted mt-1">One lesson per line: <b>Title | YouTube link | minutes</b>. They are added after the existing lessons, in this order. You can also paste two or three columns straight from a spreadsheet.</p>
          </div>
          <form action={bulkAddLessons} className="flex flex-col gap-3">
            <input type="hidden" name="course_id" value={course.id} />
            <Textarea name="lines" rows={8} required placeholder={"Lesson 1 · Who is Jesus? | https://youtu.be/xxxxxxxxxxx | 3\nLesson 2 · Why we pray | https://youtu.be/yyyyyyyyyyy | 3\nLesson 3 · Praying the Word | https://youtu.be/zzzzzzzzzzz | 3"} />
            <div><SubmitButton pendingText="Adding…">Add lessons</SubmitButton></div>
          </form>
        </Card>
        <Card className="flex flex-col gap-4">
          <div>
            <Label tone="orange">Import quiz questions</Label>
            <p className="text-sm text-muted mt-1">Every lesson can have its own quiz. Students must pass it to unlock the next lesson. Upload a spreadsheet saved as CSV, or paste rows, with these columns:</p>
            <p className="text-sm mt-2 font-mono bg-ice rounded-xl px-3 py-2 overflow-x-auto whitespace-nowrap">lesson, question, option A, option B, option C, option D, answer, explanation</p>
            <p className="text-xs text-muted mt-2">Lesson is the lesson number (1, 2, 3…). Answer is the correct letter. Explanation is optional. Two to eight options per question.</p>
          </div>
          <a href={`/academy/courses/${course.id}/questions.csv`} className="btn btn-ice btn-sm self-start">{lessonQuestionTotal ? "Download current questions (CSV)" : "Download a template (CSV)"}</a>
          <form action={importQuestions} className="flex flex-col gap-3">
            <input type="hidden" name="course_id" value={course.id} />
            <Field label="CSV file"><input type="file" name="csv" accept=".csv,text/csv" className="input" /></Field>
            <Field label="…or paste rows"><Textarea name="text" rows={5} placeholder={"1, What does 1 Timothy 4:12 urge us to be?, An example, Silent, Wealthy, Famous, A\n1 | Who wrote 1 Timothy? | Peter | Paul | John | James | B | Paul wrote to Timothy"} /></Field>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="replace" defaultChecked className="check" /> Replace the existing questions of each lesson in the file</label>
            <div><SubmitButton pendingText="Importing…">Import questions</SubmitButton></div>
          </form>
        </Card>
      </div>

      {/* ---------- quiz ---------- */}
      <div id="quiz" className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start scroll-mt-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><Label tone="orange">Final quiz (optional)</Label>{quiz && <Badge tone="good">{questions.length} questions</Badge>}</div>
          <p className="text-sm text-muted -mt-2">A course-wide quiz taken after the last lesson. Leave it out if every lesson already has its own quiz.</p>
          <form action={saveQuiz} className="flex flex-col gap-3">
            <input type="hidden" name="course_id" value={course.id} />
            <input type="hidden" name="quiz_id" value={quiz?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
              <Field label="Quiz title"><Input name="title" defaultValue={quiz?.title ?? "Final quiz"} /></Field>
              <SubmitButton variant="blue" size="sm" pendingText="Saving…">{quiz ? "Save" : "Create final quiz"}</SubmitButton>
            </div>
            <Field label="Instructions"><Textarea name="instructions" defaultValue={quiz?.instructions ?? ""} placeholder="Answer every question. You need the pass mark to earn your certificate." className="!min-h-[70px]" /></Field>
          </form>
          {!quiz ? (
            <EmptyState title="No final quiz." body="Optional. If you create one, students must pass it after finishing every lesson to receive their certificate." />
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
              <Field label="Explanation" hint="Optional. For your own notes (not shown to students)."><Textarea name="explanation" className="!min-h-[70px]" /></Field>
              <div><SubmitButton pendingText="Adding…">Add question</SubmitButton></div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
}
