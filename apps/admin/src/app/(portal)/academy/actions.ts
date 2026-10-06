"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@phanet/supabase/server";
import { slugify } from "@phanet/supabase/format";
import type { Lesson } from "@phanet/supabase/types";
import { done, errMsg, fail } from "@/lib/flash";
import { bool, file, isUuid, lines, num, opt, str } from "@/lib/form";
import { extOf, uploadPublic } from "@/lib/storage";

const FORMATS = ["video", "audio", "mixed"] as const;
const LESSON_KINDS = ["video", "audio", "reading"] as const;
const RESOURCE_KINDS = ["book", "message", "audio", "document"] as const;
const coursePath = (id: string) => `/academy/courses/${id}`;

/* ---------------- courses ---------------- */
export async function saveCourse(formData: FormData) {
  const id = str(formData, "id");
  const isNew = !isUuid(id);
  const back = isNew ? "/academy/courses/new" : coursePath(id);
  const title = str(formData, "title");
  if (!title) fail(back, "Give the course a title.");
  const slug = slugify(str(formData, "slug") || title);
  const format = str(formData, "format");
  if (!(FORMATS as readonly string[]).includes(format)) fail(back, "Pick a format.");
  const pass_mark = Math.round(num(formData, "pass_mark", 70));
  if (pass_mark < 1 || pass_mark > 100) fail(back, "Pass mark must be between 1 and 100.");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const row: Record<string, unknown> = {
    slug,
    title,
    summary: opt(formData, "summary"),
    description: opt(formData, "description"),
    format,
    level: str(formData, "level") || "Foundation",
    instructor: opt(formData, "instructor"),
    duration_label: opt(formData, "duration_label"),
    pass_mark,
    is_published: bool(formData, "is_published"),
    sort_order: Math.round(num(formData, "sort_order", 0)),
  };
  const cover = file(formData, "cover");
  if (cover) {
    try {
      row.cover_url = await uploadPublic(supabase, "course-media", `covers/${slug}.${extOf(cover)}`, cover);
    } catch (e) {
      fail(back, errMsg(e));
    }
  }
  const dup = (m: string) => (m.includes("duplicate") ? "That slug is already used by another course." : m);
  if (isNew) {
    const { data, error } = await supabase.from("courses").insert({ ...row, created_by: user?.id ?? null }).select("id").single();
    if (error) fail(back, dup(error.message));
    revalidatePath("/academy");
    done(coursePath((data as { id: string }).id), "Course created. Now add lessons and a quiz.");
  }
  const { error } = await supabase.from("courses").update(row).eq("id", id);
  if (error) fail(back, dup(error.message));
  revalidatePath("/academy");
  revalidatePath(back);
  done(back, "Course saved.");
}

export async function toggleCourse(formData: FormData) {
  const id = str(formData, "id");
  const publish = bool(formData, "is_published");
  const back = str(formData, "back") || "/academy";
  if (!isUuid(id)) fail("/academy", "Unknown course.");
  const supabase = await createClient();
  if (publish) {
    const { count } = await supabase.from("lessons").select("id", { count: "exact", head: true }).eq("course_id", id);
    if (!count) fail(back, "Add at least one lesson before publishing.");
  }
  const { error } = await supabase.from("courses").update({ is_published: publish }).eq("id", id);
  if (error) fail(back, error.message);
  revalidatePath("/academy");
  revalidatePath(coursePath(id));
  done(back, publish ? "Course published." : "Course unpublished.");
}

export async function deleteCourse(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail("/academy", "Unknown course.");
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) fail(coursePath(id), error.message);
  revalidatePath("/academy");
  done("/academy", "Course deleted.");
}

/* ---------------- lessons ---------------- */
async function orderedLessons(courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order").order("created_at");
  return (data ?? []) as Lesson[];
}

export async function addLesson(formData: FormData) {
  const courseId = str(formData, "course_id");
  if (!isUuid(courseId)) fail("/academy", "Unknown course.");
  const back = `${coursePath(courseId)}#lessons`;
  const title = str(formData, "title");
  if (!title) fail(back, "Give the lesson a title.");
  const kind = str(formData, "kind");
  if (!(LESSON_KINDS as readonly string[]).includes(kind)) fail(back, "Pick a lesson type.");
  const youtube_url = opt(formData, "youtube_url");
  let audio_url = opt(formData, "audio_url");
  const body = opt(formData, "body");
  const supabase = await createClient();
  const audio = file(formData, "audio_file");
  if (audio) {
    try {
      audio_url = await uploadPublic(supabase, "course-media", `courses/${courseId}/lessons/${Date.now()}-${slugify(title)}.${extOf(audio)}`, audio);
    } catch (e) {
      fail(back, errMsg(e));
    }
  }
  if (kind === "video" && !youtube_url) fail(back, "Video lessons need a YouTube link.");
  if (kind === "audio" && !audio_url && !youtube_url) fail(back, "Audio lessons need an audio file, audio URL or YouTube link.");
  if (kind === "reading" && !body) fail(back, "Reading lessons need some text.");
  const existing = await orderedLessons(courseId);
  const sortRaw = str(formData, "sort_order");
  const sort_order = sortRaw ? Math.round(num(formData, "sort_order", 0)) : (existing.at(-1)?.sort_order ?? 0) + 1;
  const durationRaw = str(formData, "duration_minutes");
  const { error } = await supabase.from("lessons").insert({
    course_id: courseId,
    title,
    kind,
    youtube_url,
    audio_url,
    body,
    duration_minutes: durationRaw ? Math.round(num(formData, "duration_minutes", 0)) : null,
    sort_order,
  });
  if (error) fail(back, error.message);
  revalidatePath(coursePath(courseId));
  revalidatePath("/academy");
  done(back, "Lesson added.");
}

export async function deleteLesson(formData: FormData) {
  const id = str(formData, "id");
  const courseId = str(formData, "course_id");
  const back = `${coursePath(courseId)}#lessons`;
  if (!isUuid(id) || !isUuid(courseId)) fail("/academy", "Unknown lesson.");
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) fail(back, error.message);
  revalidatePath(coursePath(courseId));
  revalidatePath("/academy");
  done(back, "Lesson removed.");
}

export async function moveLesson(formData: FormData) {
  const id = str(formData, "id");
  const courseId = str(formData, "course_id");
  const dir = str(formData, "dir") === "up" ? -1 : 1;
  const back = `${coursePath(courseId)}#lessons`;
  if (!isUuid(id) || !isUuid(courseId)) fail("/academy", "Unknown lesson.");
  const list = await orderedLessons(courseId);
  const idx = list.findIndex((l) => l.id === id);
  const target = idx + dir;
  if (idx < 0 || target < 0 || target >= list.length) done(back, "Already at the edge.");
  const reordered = [...list];
  [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
  const supabase = await createClient();
  for (let i = 0; i < reordered.length; i++) {
    const want = i + 1;
    if (reordered[i].sort_order !== want) {
      const { error } = await supabase.from("lessons").update({ sort_order: want }).eq("id", reordered[i].id);
      if (error) fail(back, error.message);
    }
  }
  revalidatePath(coursePath(courseId));
  done(back, "Lesson order updated.");
}

/* ---------------- quiz ---------------- */
export async function saveQuiz(formData: FormData) {
  const courseId = str(formData, "course_id");
  const quizId = str(formData, "quiz_id");
  const back = `${coursePath(courseId)}#quiz`;
  if (!isUuid(courseId)) fail("/academy", "Unknown course.");
  const title = str(formData, "title") || "Final quiz";
  const instructions = opt(formData, "instructions");
  const supabase = await createClient();
  if (isUuid(quizId)) {
    const { error } = await supabase.from("quizzes").update({ title, instructions }).eq("id", quizId);
    if (error) fail(back, error.message);
    revalidatePath(coursePath(courseId));
    done(back, "Quiz saved.");
  }
  const { error } = await supabase.from("quizzes").insert({ course_id: courseId, title, instructions });
  if (error) fail(back, error.message);
  revalidatePath(coursePath(courseId));
  done(back, "Quiz created. Add some questions.");
}

export async function addQuestion(formData: FormData) {
  const courseId = str(formData, "course_id");
  const quizId = str(formData, "quiz_id");
  const back = `${coursePath(courseId)}#quiz`;
  if (!isUuid(courseId) || !isUuid(quizId)) fail("/academy", "Unknown quiz.");
  const prompt = str(formData, "prompt");
  if (!prompt) fail(back, "Write the question.");
  const options = lines(str(formData, "options"));
  if (options.length < 2) fail(back, "Give at least two options, one per line.");
  if (options.length > 8) fail(back, "At most eight options.");
  const correct_index = Math.round(num(formData, "correct_index", -1));
  if (correct_index < 0 || correct_index >= options.length) fail(back, "Pick which option is correct (it must exist in the list).");
  const supabase = await createClient();
  const { data: last } = await supabase.from("quiz_questions").select("sort_order").eq("quiz_id", quizId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const sort_order = ((last as { sort_order: number } | null)?.sort_order ?? 0) + 1;
  const { error } = await supabase.from("quiz_questions").insert({ quiz_id: quizId, prompt, options, correct_index, explanation: opt(formData, "explanation"), sort_order });
  if (error) fail(back, error.message);
  revalidatePath(coursePath(courseId));
  done(back, "Question added.");
}

export async function deleteQuestion(formData: FormData) {
  const id = str(formData, "id");
  const courseId = str(formData, "course_id");
  const back = `${coursePath(courseId)}#quiz`;
  if (!isUuid(id) || !isUuid(courseId)) fail("/academy", "Unknown question.");
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
  if (error) fail(back, error.message);
  revalidatePath(coursePath(courseId));
  done(back, "Question removed.");
}

/* ---------------- resources ---------------- */
export async function saveResource(formData: FormData) {
  const id = str(formData, "id");
  const isNew = !isUuid(id);
  const back = isNew ? "/academy/resources/new" : `/academy/resources/${id}`;
  const title = str(formData, "title");
  if (!title) fail(back, "Give the resource a title.");
  const kind = str(formData, "kind");
  if (!(RESOURCE_KINDS as readonly string[]).includes(kind)) fail(back, "Pick a resource type.");
  const supabase = await createClient();
  const row: Record<string, unknown> = {
    title,
    kind,
    description: opt(formData, "description"),
    author: opt(formData, "author"),
    youtube_url: opt(formData, "youtube_url"),
    is_published: bool(formData, "is_published"),
    sort_order: Math.round(num(formData, "sort_order", 0)),
  };
  const base = `${Date.now()}-${slugify(title)}`;
  try {
    const cover = file(formData, "cover");
    if (cover) row.cover_url = await uploadPublic(supabase, "resources", `covers/${base}.${extOf(cover)}`, cover);
    const doc = file(formData, "file");
    if (doc) row.file_url = await uploadPublic(supabase, "resources", `files/${base}.${extOf(doc)}`, doc);
  } catch (e) {
    fail(back, errMsg(e));
  }
  if (isNew && !row.file_url && !row.youtube_url) fail(back, "Upload a file or add a YouTube link.");
  if (isNew) {
    const { data, error } = await supabase.from("resources").insert(row).select("id").single();
    if (error) fail(back, error.message);
    revalidatePath("/academy/resources");
    done(`/academy/resources/${(data as { id: string }).id}`, "Resource added.");
  }
  const { error } = await supabase.from("resources").update(row).eq("id", id);
  if (error) fail(back, error.message);
  revalidatePath("/academy/resources");
  revalidatePath(back);
  done(back, "Resource saved.");
}

export async function deleteResource(formData: FormData) {
  const id = str(formData, "id");
  if (!isUuid(id)) fail("/academy/resources", "Unknown resource.");
  const supabase = await createClient();
  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (error) fail(`/academy/resources/${id}`, error.message);
  revalidatePath("/academy/resources");
  done("/academy/resources", "Resource deleted.");
}

export async function toggleResource(formData: FormData) {
  const id = str(formData, "id");
  const publish = bool(formData, "is_published");
  if (!isUuid(id)) fail("/academy/resources", "Unknown resource.");
  const supabase = await createClient();
  const { error } = await supabase.from("resources").update({ is_published: publish }).eq("id", id);
  if (error) fail("/academy/resources", error.message);
  revalidatePath("/academy/resources");
  done("/academy/resources", publish ? "Resource published." : "Resource hidden.");
}
