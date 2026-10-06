"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@phanet/supabase/server";

const msg = (path: string, key: "ok" | "error", text: string) => `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;

/** Mark a lesson without a quiz complete (server checks order and that there is no quiz), then move on. */
export async function completeLessonAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const lessonId = String(formData.get("lesson_id") ?? "").trim();
  const nextId = String(formData.get("next_id") ?? "").trim();
  if (!slug || !lessonId) redirect("/courses");
  const here = `/courses/${slug}/lessons/${lessonId}`;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(here)}`);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_lesson", { p_lesson: lessonId });
  if (error) redirect(msg(here, "error", error.message || "Couldn't save your progress. Please try again."));
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/me");
  const cert = (data as { certificate_code: string | null } | null)?.certificate_code;
  if (cert) redirect(msg(`/courses/${slug}`, "ok", "Course complete. Your certificate is ready!"));
  if (nextId) redirect(msg(`/courses/${slug}/lessons/${nextId}`, "ok", "Lesson complete."));
  redirect(msg(`/courses/${slug}`, "ok", "All lessons done."));
}

/** Grade the quiz under a lesson. Passing completes the lesson and unlocks the next. */
export async function submitLessonQuizAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const lessonId = String(formData.get("lesson_id") ?? "").trim();
  const quizId = String(formData.get("quiz_id") ?? "").trim();
  const questionIds = formData.getAll("question_id").map(String).filter(Boolean);
  if (!slug || !lessonId || !quizId) redirect("/courses");
  const here = `/courses/${slug}/lessons/${lessonId}`;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(here)}`);

  const answers: Record<string, number> = {};
  let missing = 0;
  for (const id of questionIds) {
    const n = Number(formData.get(`q_${id}`));
    if (formData.get(`q_${id}`) !== null && Number.isInteger(n) && n >= 0) answers[id] = n;
    else missing++;
  }
  if (missing) redirect(msg(`${here}`, "error", `Answer every question before submitting (${missing} left).`) + "#quiz");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_quiz_attempt", { p_quiz: quizId, p_answers: answers });
  if (error) redirect(msg(here, "error", error.message || "Couldn't grade your quiz. Please try again.") + "#quiz");
  const r = data as { attempt_id: string; passed: boolean; wrong: string[]; certificate_code: string | null } | null;
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/me");
  if (!r?.attempt_id) redirect(msg(here, "error", "Couldn't grade your quiz. Please try again."));
  // pass the positions of wrong questions (1-based) so the page can highlight them without revealing answers
  const wrong = (r.wrong ?? []).map((id) => questionIds.indexOf(id) + 1).filter((n) => n > 0).join(".");
  redirect(`${here}?attempt=${encodeURIComponent(r.attempt_id)}${wrong ? `&w=${wrong}` : ""}${r.certificate_code ? "&cert=1" : ""}#quiz`);
}
