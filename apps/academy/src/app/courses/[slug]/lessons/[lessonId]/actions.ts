"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@phanet/supabase/server";

/** Mark a lesson complete (upsert lesson_progress) and move to the next one. */
export async function completeLessonAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const courseId = String(formData.get("course_id") ?? "").trim();
  const lessonId = String(formData.get("lesson_id") ?? "").trim();
  const nextId = String(formData.get("next_id") ?? "").trim();
  if (!slug || !lessonId) redirect("/courses");
  const here = `/courses/${slug}/lessons/${lessonId}`;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(here)}`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_progress")
    .upsert({ user_id: session.user.id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  if (error) redirect(`${here}?error=${encodeURIComponent("Couldn't save your progress. Please try again.")}`);
  if (courseId) {
    await supabase.from("enrollments").upsert({ user_id: session.user.id, course_id: courseId }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
  }
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/me");
  if (nextId) redirect(`/courses/${slug}/lessons/${nextId}?ok=${encodeURIComponent("Lesson marked complete.")}`);
  redirect(`/courses/${slug}?ok=${encodeURIComponent("All lessons done. The quiz is open!")}`);
}
