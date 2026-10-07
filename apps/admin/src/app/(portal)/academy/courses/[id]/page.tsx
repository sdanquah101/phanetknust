import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, ConfirmSubmit, Disclosure, EmptyState, Field, Input, Label, PageHeader, Select, StatCard, SubmitButton, Textarea } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { youtubeId, type Course, type Lesson, type Quiz, type QuizQuestion } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { isUuid } from "@/lib/form";
import { CourseForm } from "../../CourseForm";
import { addLesson, addQuestion, bulkAddLessons, deleteCourse, deleteLesson, deleteQuestion, importQuestions, moveLesson, saveQuiz } from "../../actions";

const LETTERS = "ABCDEFGH";

export default async function CoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<FlashParams & { open?: string }> }) {
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

  const steps = [
    { title: "Add lessons", body: lessons.length ? `${lessons.length} added` : "Paste all your videos at once.", ok: lessons.length > 0, href: "?open=add#add-lessons" },
    { title: "Add quiz questions", body: lessons.length ? `${lessonsWithQuiz} of ${lessons.length} lessons have a quiz` : "After the lessons, upload one spreadsheet.", ok: lessons.length > 0 && lessonsWithQuiz === lessons.length, href: "?open=import#import" },
    { title: "Summary and cover", body: "What students see on the course card.", ok: Boolean(course.summary && course.cover_url), href: "#details" },
    { title: "Publish", body: course.is_published ? "Live in the Academy" : "Tick “Published” in Course details.", ok: course.is_published, href: "#details" },
  ];

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lessons" value={lessons.length} />
        <StatCard label="Lesson quizzes" value={`${lessonsWithQuiz}/${lessons.length}`} sub={`${lessonQuestionTotal} questions${quiz ? ` · final quiz ${questions.length}` : ""}`} />
        <StatCard label="Students" value={enrolled ?? 0} sub="enrolled" tone="blue" />
        <StatCard label="Certificates" value={certs ?? 0} sub={`pass mark ${course.pass_mark}%`} tone="orange" />
      </div>

      {steps.some((st) => !st.ok) && (
        <Card className="flex flex-col gap-4">
          <div>
            <Label tone="orange">Set up this course</Label>
            <p className="text-sm text-muted mt-1">Work through these in order. Each step opens the right section below.</p>
          </div>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((st, i) => (
              <li key={st.title}>
                <Link href={st.href} className={`option-row no-underline flex items-start gap-3 h-full ${st.ok ? "opacity-70" : ""}`}>
                  <span className={`mt-0.5 inline-grid place-items-center w-7 h-7 rounded-full text-sm font-extrabold flex-none ${st.ok ? "bg-[#d9f5e6] text-[#0f7a45]" : "bg-royal text-white"}`}>{st.ok ? "✓" : i + 1}</span>
                  <span className="min-w-0">
                    <span className="block font-bold text-deep">{st.title}</span>
                    <span className="block text-xs text-muted mt-0.5">{st.body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <nav aria-label="Sections" className="flex flex-wrap gap-2">
        <Link href="#lessons" className="pill pill-ice no-underline">Lessons · {lessons.length}</Link>
        <Link href="?open=add#add-lessons" className="pill pill-ice no-underline">Add lessons</Link>
        <Link href="?open=import#import" className="pill pill-ice no-underline">Quiz questions</Link>
        <Link href="#details" className="pill pill-ice no-underline">Course details</Link>
        <Link href="?open=quiz#quiz" className="pill pill-ice no-underline">Final quiz</Link>
      </nav>

      {/* ---------- lessons ---------- */}
      <Card id="lessons" className="flex flex-col gap-4 scroll-mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Label tone="orange">Lessons</Label>
            <p className="text-sm text-muted mt-1">Students take these in order. A lesson with a quiz is complete once its quiz is passed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="?open=add#add-lessons" className="btn btn-blue btn-sm">+ Add lessons</Link>
            <Link href="?open=import#import" className="btn btn-ice btn-sm">Import quiz questions</Link>
          </div>
        </div>
        {lessons.length === 0 ? (
          <EmptyState title="No lessons yet." body="Use “Add lessons” to paste all of them at once, or add them one at a time." />
        ) : (
          <ol className={`flex flex-col gap-2 ${lessons.length > 12 ? "max-h-[680px] overflow-y-auto pr-1 -mr-1" : ""}`}>
            {lessons.map((l, i) => {
              const yt = youtubeId(l.youtube_url);
              const qn = lessonQ.get(l.id) ?? 0;
              return (
                <li key={l.id} className="option-row flex items-center gap-3">
                  <span className="num-lg text-[20px] text-royal w-8 text-center flex-none">{i + 1}</span>
                  {yt ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://i.ytimg.com/vi/${yt}/default.jpg`} alt="" className="w-16 h-12 rounded-xl object-cover flex-none hidden md:block bg-ice" />
                  ) : (
                    <span className="w-16 h-12 rounded-xl bg-ice flex-none hidden md:grid place-items-center text-[10px] font-bold uppercase text-muted">{l.kind}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold truncate">{l.title}</div>
                    <div className="text-xs text-muted truncate">
                      <span className="capitalize">{l.kind}</span>{l.duration_minutes ? ` · ${l.duration_minutes} min` : ""}{l.audio_url ? " · audio file" : ""}
                      <span className="sm:hidden"> · {qn ? `quiz ${qn}` : "no quiz"}</span>
                    </div>
                  </div>
                  {qn > 0 ? <Badge tone="mint" className="flex-none hidden sm:inline-flex">Quiz · {qn}</Badge> : <Badge tone="warn" className="flex-none hidden sm:inline-flex">No quiz</Badge>}
                  <div className="flex items-center gap-1 flex-none">
                    <Link href={`/academy/courses/${course.id}/lessons/${l.id}`} className="btn btn-blue btn-sm !px-3">Edit</Link>
                    <form action={moveLesson} className="hidden md:block">
                      <input type="hidden" name="id" value={l.id} /><input type="hidden" name="course_id" value={course.id} /><input type="hidden" name="dir" value="up" />
                      <button className="btn btn-ice btn-sm !px-3" disabled={i === 0} aria-label="Move up">↑</button>
                    </form>
                    <form action={moveLesson} className="hidden md:block">
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

      {/* ---------- add lessons ---------- */}
      <Disclosure
        id="add-lessons"
        label="Step 1"
        title="Add lessons"
        description="Paste many lessons at once from a list or spreadsheet, or add a single lesson with audio or reading text."
        defaultOpen={sp.open === "add" || lessons.length === 0}
      >
        <div className="grid gap-8 xl:grid-cols-2 items-start">
          <div className="flex flex-col gap-3">
            <div>
              <div className="font-bold text-deep">Many at once</div>
              <p className="text-sm text-muted mt-1">One lesson per line: <b>Title | YouTube link | minutes</b>. They go after the existing lessons, in this order.</p>
            </div>
            <form action={bulkAddLessons} className="flex flex-col gap-3">
              <input type="hidden" name="course_id" value={course.id} />
              <Textarea name="lines" rows={9} required placeholder={"Who is Jesus? | https://youtu.be/xxxxxxxxxxx | 3\nWhy we pray | https://youtu.be/yyyyyyyyyyy | 3\nPraying the Word | https://youtu.be/zzzzzzzzzzz | 3"} />
              <div><SubmitButton pendingText="Adding…">Add these lessons</SubmitButton></div>
            </form>
          </div>
          <div className="flex flex-col gap-3 xl:border-l xl:border-ice xl:pl-8">
            <div>
              <div className="font-bold text-deep">One lesson</div>
              <p className="text-sm text-muted mt-1">For audio lessons, readings, or to insert a lesson at a set position.</p>
            </div>
            <form action={addLesson} className="flex flex-col gap-4">
              <input type="hidden" name="course_id" value={course.id} />
              <Field label="Title"><Input name="title" placeholder="Who is Jesus?" required /></Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Type">
                  <Select name="kind" defaultValue="video">
                    <option value="video">Video (YouTube)</option><option value="audio">Audio</option><option value="reading">Reading</option>
                  </Select>
                </Field>
                <Field label="Minutes"><Input name="duration_minutes" type="number" min={0} placeholder="3" /></Field>
                <Field label="Position" hint="Blank = at the end."><Input name="sort_order" type="number" min={1} /></Field>
              </div>
              <Field label="YouTube link"><Input name="youtube_url" type="url" placeholder="https://youtu.be/…" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Audio file" hint="MP3/M4A."><input type="file" name="audio_file" accept="audio/*" className="input" /></Field>
                <Field label="…or audio URL"><Input name="audio_url" type="url" placeholder="https://" /></Field>
              </div>
              <Field label="Reading / notes"><Textarea name="body" placeholder="Lesson text, outline or discussion questions." className="!min-h-[80px]" /></Field>
              <div><SubmitButton variant="blue" pendingText="Adding…">Add lesson</SubmitButton></div>
            </form>
          </div>
        </div>
      </Disclosure>

      {/* ---------- import questions ---------- */}
      <Disclosure
        id="import"
        label="Step 2"
        title="Quiz questions for each lesson"
        description="Fill in the spreadsheet template and upload it. Students must pass a lesson's quiz to unlock the next lesson."
        defaultOpen={sp.open === "import" || (lessons.length > 0 && lessonsWithQuiz < lessons.length)}
      >
        <div className="grid gap-8 xl:grid-cols-2 items-start">
          <ol className="flex flex-col gap-4 text-sm">
            <li className="flex gap-3">
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-royal text-white text-xs font-bold flex-none">1</span>
              <div className="min-w-0">
                <div className="font-bold text-deep">Download the spreadsheet</div>
                <p className="text-muted mt-0.5">{lessonQuestionTotal ? "It has every question already in the course, so you can edit and re-upload it." : `It has 5 empty rows for each of the ${lessons.length} lessons.`}</p>
                <a href={`/academy/courses/${course.id}/questions.csv`} className="btn btn-ice btn-sm mt-2">{lessonQuestionTotal ? "Download current questions (CSV)" : "Download the template (CSV)"}</a>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-royal text-white text-xs font-bold flex-none">2</span>
              <div className="min-w-0">
                <div className="font-bold text-deep">Fill it in (Excel or Google Sheets)</div>
                <p className="text-muted mt-0.5"><b>Lesson</b> is the lesson number, <b>Answer</b> the correct letter (A, B, C…). Leave unused options empty. Explanation is optional.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-royal text-white text-xs font-bold flex-none">3</span>
              <div className="min-w-0">
                <div className="font-bold text-deep">Save as CSV and upload it here</div>
                <p className="text-muted mt-0.5">Uploading again replaces the questions of the lessons in the file, so you can fix mistakes the same way.</p>
              </div>
            </li>
          </ol>
          <form action={importQuestions} className="flex flex-col gap-4 xl:border-l xl:border-ice xl:pl-8">
            <input type="hidden" name="course_id" value={course.id} />
            <Field label="CSV file"><input type="file" name="csv" accept=".csv,text/csv" className="input" /></Field>
            <Field label="…or paste rows" hint="lesson, question, option A, option B, …, answer, explanation">
              <Textarea name="text" rows={5} placeholder={"1, What does 1 Timothy 4:12 urge us to be?, An example, Silent, Wealthy, Famous, A\n1 | Who wrote 1 Timothy? | Peter | Paul | John | James | B"} />
            </Field>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" name="replace" defaultChecked className="check" /> Replace the existing questions of each lesson in the file</label>
            <div><SubmitButton pendingText="Importing…">Import questions</SubmitButton></div>
          </form>
        </div>
      </Disclosure>

      {/* ---------- details ---------- */}
      <div id="details" className="grid gap-6 lg:grid-cols-[1.6fr_1fr] items-start scroll-mt-6">
        <Card>
          <Label tone="orange" className="mb-3">Course details</Label>
          <CourseForm course={course} />
        </Card>
        <Card className="flex flex-col gap-3">
          <Label tone="orange">Cover</Label>
          {course.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.cover_url} alt={course.title} className="w-full aspect-[4/3] object-cover rounded-card" />
          ) : (
            <div className="aspect-[4/3] rounded-card bg-ice grid place-items-center text-sm text-muted p-4 text-center">No cover yet. Upload one in Course details.</div>
          )}
        </Card>
      </div>

      {/* ---------- final quiz ---------- */}
      <Disclosure
        id="quiz"
        label="Optional"
        title={quiz ? `Final quiz · ${questions.length} ${questions.length === 1 ? "question" : "questions"}` : "Final quiz"}
        description="A course-wide quiz after the last lesson. Skip it if every lesson already has its own quiz."
        defaultOpen={sp.open === "quiz" || Boolean(quiz)}
      >
        <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr] items-start">
          <div className="flex flex-col gap-4">
            <form action={saveQuiz} className="flex flex-col gap-3">
              <input type="hidden" name="course_id" value={course.id} />
              <input type="hidden" name="quiz_id" value={quiz?.id ?? ""} />
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
                <Field label="Quiz title"><Input name="title" defaultValue={quiz?.title ?? "Final quiz"} /></Field>
                <SubmitButton variant="blue" size="sm" pendingText="Saving…">{quiz ? "Save" : "Create final quiz"}</SubmitButton>
              </div>
              <Field label="Instructions"><Textarea name="instructions" defaultValue={quiz?.instructions ?? ""} placeholder="Answer every question. You need the pass mark to earn your certificate." className="!min-h-[70px]" /></Field>
            </form>
            {quiz && (questions.length === 0 ? (
              <EmptyState title="No questions yet." body="Add the first question with the form." />
            ) : (
              <ol className="flex flex-col gap-3">
                {questions.map((q, i) => (
                  <li key={q.id} className="card-ice p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-royal flex-none">Q{i + 1}</span>
                      <div className="font-bold flex-1 min-w-0 break-words">{q.prompt}</div>
                      <form action={deleteQuestion}>
                        <input type="hidden" name="id" value={q.id} /><input type="hidden" name="course_id" value={course.id} />
                        <ConfirmSubmit variant="danger" size="sm" className="!px-3" message="Remove this question?">✕</ConfirmSubmit>
                      </form>
                    </div>
                    <ul className="grid gap-1.5 sm:grid-cols-2 text-sm">
                      {(Array.isArray(q.options) ? q.options : []).map((o, oi) => (
                        <li key={oi} className={`rounded-xl px-3 py-2 break-words ${oi === q.correct_index ? "bg-white font-bold text-royal" : "text-muted"}`}>
                          <span className="mr-2">{LETTERS[oi] ?? oi + 1}.</span>{o}{oi === q.correct_index && <span className="ml-2 text-[10px] uppercase tracking-wider">✓ correct</span>}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && <div className="text-xs text-muted">Note: {q.explanation}</div>}
                  </li>
                ))}
              </ol>
            ))}
          </div>
          <div className="flex flex-col gap-4 xl:border-l xl:border-ice xl:pl-8">
            <div>
              <div className="font-bold text-deep">Add a question</div>
              <p className="text-sm text-muted mt-1">{quiz ? "One option per line, then pick the correct one." : "Create the final quiz first."}</p>
            </div>
            {quiz && (
              <form action={addQuestion} className="flex flex-col gap-4">
                <input type="hidden" name="course_id" value={course.id} />
                <input type="hidden" name="quiz_id" value={quiz.id} />
                <Field label="Question"><Textarea name="prompt" placeholder="What does 1 Timothy 4:12 urge young believers to be?" className="!min-h-[80px]" required /></Field>
                <Field label="Options" hint="One per line, in order A, B, C…"><Textarea name="options" placeholder={"An example to believers\nSilent in church\nWealthy\nFamous"} rows={5} required /></Field>
                <Field label="Correct option">
                  <Select name="correct_index" defaultValue="0">
                    {LETTERS.split("").map((L, i) => <option key={L} value={i}>Option {L}</option>)}
                  </Select>
                </Field>
                <Field label="Explanation" hint="Optional. For your own notes (not shown to students)."><Textarea name="explanation" className="!min-h-[70px]" /></Field>
                <div><SubmitButton pendingText="Adding…">Add question</SubmitButton></div>
              </form>
            )}
          </div>
        </div>
      </Disclosure>

      {/* ---------- danger zone ---------- */}
      <Card className="flex flex-wrap items-center justify-between gap-4 border border-[#f6d2c4]">
        <div className="min-w-0">
          <Label tone="orange">Danger zone</Label>
          <p className="text-sm text-muted mt-1">Deleting removes the lessons, quizzes, student progress and certificates for this course.</p>
        </div>
        <form action={deleteCourse}>
          <input type="hidden" name="id" value={course.id} />
          <ConfirmSubmit variant="danger" size="sm" message={`Delete "${course.title}" with all its lessons, quiz and student progress?`}>Delete course</ConfirmSubmit>
        </form>
      </Card>
    </>
  );
}
