import { NextResponse } from "next/server";
import { createClient, getSession } from "@phanet/supabase/server";
import { canAccess, PORTAL_ROLES } from "@phanet/supabase/roles";
import { toCsv } from "@/lib/quiz-import";

const LETTERS = "ABCDEFGH";

/** CSV of a course's lesson-quiz questions, or a fill-in template (5 rows per lesson) when there are none. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !canAccess(session.roles, PORTAL_ROLES.admin)) return new NextResponse("Not allowed", { status: 403 });
  const supabase = await createClient();
  const [{ data: course }, { data: lessons }, { data: quizzes }] = await Promise.all([
    supabase.from("courses").select("slug").eq("id", id).maybeSingle(),
    supabase.from("lessons").select("id, title").eq("course_id", id).order("sort_order").order("created_at"),
    supabase.from("quizzes").select("lesson_id, quiz_questions(prompt, options, correct_index, explanation, sort_order)").eq("course_id", id).not("lesson_id", "is", null),
  ]);
  if (!course) return new NextResponse("Not found", { status: 404 });
  type Q = { prompt: string; options: string[]; correct_index: number; explanation: string | null; sort_order: number };
  const byLesson = new Map<string, Q[]>();
  for (const q of (quizzes ?? []) as { lesson_id: string; quiz_questions: Q[] }[]) byLesson.set(q.lesson_id, [...(q.quiz_questions ?? [])].sort((a, b) => a.sort_order - b.sort_order));
  const list = (lessons ?? []) as { id: string; title: string }[];
  const maxOpts = Math.max(4, ...[...byLesson.values()].flat().map((q) => q.options?.length ?? 0));
  const header = ["Lesson", "Question", ...Array.from({ length: maxOpts }, (_, i) => `Option ${LETTERS[i]}`), "Answer", "Explanation", "(lesson title, ignored)"];
  const rows: (string | number | null)[][] = [header];
  const hasAny = [...byLesson.values()].some((qs) => qs.length);
  list.forEach((l, i) => {
    const qs = byLesson.get(l.id) ?? [];
    if (qs.length) for (const q of qs) rows.push([i + 1, q.prompt, ...Array.from({ length: maxOpts }, (_, k) => q.options?.[k] ?? ""), LETTERS[q.correct_index] ?? "", q.explanation ?? "", l.title]);
    else if (!hasAny) for (let k = 0; k < 5; k++) rows.push([i + 1, "", ...Array.from({ length: maxOpts }, () => ""), "", "", l.title]);
  });
  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${course.slug}-questions.csv"` },
  });
}
