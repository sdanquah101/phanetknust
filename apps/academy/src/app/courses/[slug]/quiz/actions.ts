"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@phanet/supabase/server";
import type { QuizResult } from "@phanet/supabase/types";

/** Grade a quiz server-side via submit_quiz_attempt; redirects to the result view. */
export async function submitQuizAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const quizId = String(formData.get("quiz_id") ?? "").trim();
  const questionIds = formData.getAll("question_id").map(String).filter(Boolean);
  const quizPath = `/courses/${slug}/quiz`;
  if (!slug || !quizId) redirect("/courses");
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(quizPath)}`);

  const answers: Record<string, number> = {};
  const missing: string[] = [];
  for (const id of questionIds) {
    const raw = formData.get(`q_${id}`);
    const n = raw === null || raw === "" ? NaN : Number(raw);
    if (Number.isInteger(n) && n >= 0) answers[id] = n;
    else missing.push(id);
  }
  if (!questionIds.length) redirect(`${quizPath}?error=${encodeURIComponent("This quiz has no questions yet.")}`);
  if (missing.length) redirect(`${quizPath}?error=${encodeURIComponent(`Answer every question before submitting (${missing.length} left).`)}`);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_quiz_attempt", { p_quiz: quizId, p_answers: answers });
  if (error) redirect(`${quizPath}?error=${encodeURIComponent(error.message || "Couldn't grade your quiz. Please try again.")}`);
  const result = data as QuizResult | null;
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/me");
  if (!result?.attempt_id) redirect(`${quizPath}?error=${encodeURIComponent("Couldn't grade your quiz. Please try again.")}`);
  redirect(`${quizPath}?attempt=${encodeURIComponent(result.attempt_id)}`);
}
