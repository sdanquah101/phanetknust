"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getSession } from "@phanet/supabase/server";

/** Enrol the signed-in user in a course; then send them to the first lesson. */
export async function enrollAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const courseId = String(formData.get("course_id") ?? "").trim();
  if (!slug || !courseId) redirect("/courses");
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("enrollments")
    .upsert({ user_id: session.user.id, course_id: courseId }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
  if (error) redirect(`/courses/${slug}?error=${encodeURIComponent("Couldn't enrol you just now. Please try again.")}`);

  const { data: first } = await supabase.from("lessons").select("id").eq("course_id", courseId).order("sort_order").limit(1).maybeSingle();
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/me");
  const firstId = (first as { id: string } | null)?.id;
  redirect(firstId ? `/courses/${slug}/lessons/${firstId}` : `/courses/${slug}?ok=${encodeURIComponent("You're enrolled. Lessons are on their way.")}`);
}
