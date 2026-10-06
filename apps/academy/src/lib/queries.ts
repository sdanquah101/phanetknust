import "server-only";
import { createClient, type Db } from "@phanet/supabase/server";
import type { Certificate, Course, Enrollment, Lesson, Quiz, QuizAttempt, QuizQuestionPublic, Resource } from "@phanet/supabase/types";

/* ---------- shapes ---------- */
export type LessonLite = Pick<Lesson, "id" | "sort_order" | "youtube_url" | "kind" | "duration_minutes">;
export type CourseCard = Course & { lessons: LessonLite[] };
export type CertificateWithCourse = Certificate & { courses: Pick<Course, "slug" | "title"> | null };
export type AttemptWithCourse = QuizAttempt & { quizzes: { course_id: string; courses: Pick<Course, "slug" | "title"> | null } | null };
export type EnrolledCourse = { course: CourseCard; enrolled_at: string; completed_at: string | null; done: number; total: number; pct: number };
export type VerifiedCertificate = { code: string; recipient_name: string; course_title: string; issued_at: string };

const COURSE_CARD_SELECT = "*, lessons(id, sort_order, youtube_url, kind, duration_minutes)";

function sortLessons<T extends { sort_order: number }>(rows: T[]) {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}
function withSortedLessons(rows: unknown[]): CourseCard[] {
  return (rows as CourseCard[]).map((c) => ({ ...c, lessons: sortLessons(c.lessons ?? []) }));
}
export function firstLesson(c: CourseCard): LessonLite | undefined {
  return c.lessons[0];
}
export function progressPct(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

/* ---------- public: courses ---------- */
export async function listCourses(opts: { level?: string } = {}): Promise<CourseCard[]> {
  try {
    const supabase = await createClient();
    let q = supabase.from("courses").select(COURSE_CARD_SELECT).eq("is_published", true).order("sort_order").order("title");
    if (opts.level) q = q.eq("level", opts.level);
    const { data, error } = await q;
    if (error) return [];
    return withSortedLessons(data ?? []);
  } catch {
    return [];
  }
}

export async function listLevels(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("courses").select("level").eq("is_published", true);
    if (error) return [];
    const set = new Set<string>();
    for (const r of (data ?? []) as { level: string }[]) if (r.level) set.add(r.level);
    return [...set].sort();
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("courses").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
    if (error) return null;
    return (data as Course | null) ?? null;
  } catch {
    return null;
  }
}

export async function listLessons(courseId: string): Promise<Lesson[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order");
    if (error) return [];
    return (data ?? []) as Lesson[];
  } catch {
    return [];
  }
}

export async function getQuiz(courseId: string): Promise<Quiz | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quizzes").select("*").eq("course_id", courseId).maybeSingle();
    if (error) return null;
    return (data as Quiz | null) ?? null;
  } catch {
    return null;
  }
}

export async function listQuizQuestions(quizId: string): Promise<QuizQuestionPublic[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("quiz_questions_public").select("*").eq("quiz_id", quizId).order("sort_order");
    if (error) return [];
    return ((data ?? []) as QuizQuestionPublic[]).map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options.map(String) : [] }));
  } catch {
    return [];
  }
}

/* ---------- signed-in: progress ---------- */
export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("enrollments").select("*").eq("user_id", userId).eq("course_id", courseId).maybeSingle();
    return (data as Enrollment | null) ?? null;
  } catch {
    return null;
  }
}

/** Set of lesson ids the user has completed (within the given lessons). */
export async function getCompletedLessonIds(userId: string, lessonIds: string[]): Promise<Set<string>> {
  if (!lessonIds.length) return new Set();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId).in("lesson_id", lessonIds);
    return new Set(((data ?? []) as { lesson_id: string }[]).map((r) => r.lesson_id));
  } catch {
    return new Set();
  }
}

export async function getCertificate(userId: string, courseId: string): Promise<Certificate | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("certificates").select("*").eq("user_id", userId).eq("course_id", courseId).maybeSingle();
    return (data as Certificate | null) ?? null;
  } catch {
    return null;
  }
}

export async function listAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("quiz_attempts").select("*").eq("user_id", userId).eq("quiz_id", quizId).order("created_at", { ascending: false });
    return (data ?? []) as QuizAttempt[];
  } catch {
    return [];
  }
}

export async function getAttempt(userId: string, attemptId: string): Promise<QuizAttempt | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("quiz_attempts").select("*").eq("user_id", userId).eq("id", attemptId).maybeSingle();
    return (data as QuizAttempt | null) ?? null;
  } catch {
    return null;
  }
}

/* ---------- my learning ---------- */
export async function listMyEnrollments(userId: string): Promise<EnrolledCourse[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("enrollments")
      .select(`enrolled_at, completed_at, courses(${COURSE_CARD_SELECT})`)
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });
    if (error) return [];
    type Row = { enrolled_at: string; completed_at: string | null; courses: CourseCard | null };
    const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.courses);
    const allLessonIds = rows.flatMap((r) => (r.courses?.lessons ?? []).map((l) => l.id));
    const done = await getCompletedLessonIds(userId, allLessonIds);
    return rows.map((r) => {
      const course = withSortedLessons([r.courses])[0];
      const total = course.lessons.length;
      const d = course.lessons.filter((l) => done.has(l.id)).length;
      return { course, enrolled_at: r.enrolled_at, completed_at: r.completed_at, done: d, total, pct: progressPct(d, total) };
    });
  } catch {
    return [];
  }
}

export async function listMyCertificates(userId: string): Promise<CertificateWithCourse[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("certificates").select("*, courses(slug, title)").eq("user_id", userId).order("issued_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as unknown as CertificateWithCourse[];
  } catch {
    return [];
  }
}

export async function listMyRecentAttempts(userId: string, limit = 8): Promise<AttemptWithCourse[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes(course_id, courses(slug, title))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as unknown as AttemptWithCourse[];
  } catch {
    return [];
  }
}

/* ---------- certificates (public) ---------- */
export async function verifyCertificate(code: string, db?: Db): Promise<VerifiedCertificate | null> {
  if (!code.trim()) return null;
  try {
    const supabase = db ?? (await createClient());
    const { data, error } = await supabase.rpc("verify_certificate", { p_code: code.trim() });
    if (error) return null;
    const rows = (Array.isArray(data) ? data : data ? [data] : []) as VerifiedCertificate[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/* ---------- library ---------- */
export async function listResources(): Promise<Resource[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("resources").select("*").eq("is_published", true).order("sort_order").order("title");
    if (error) return [];
    return (data ?? []) as Resource[];
  } catch {
    return [];
  }
}
