import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, StatCard, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import type { Course } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { toggleCourse } from "./actions";

export default async function AcademyPage({ searchParams }: { searchParams: Promise<FlashParams> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: courseRows }, { data: lessonRows }, { count: students }, { count: certs }, { count: resources }] = await Promise.all([
    supabase.from("courses").select("*").order("sort_order").order("title"),
    supabase.from("lessons").select("course_id"),
    supabase.from("enrollments").select("user_id", { count: "exact", head: true }),
    supabase.from("certificates").select("id", { count: "exact", head: true }),
    supabase.from("resources").select("id", { count: "exact", head: true }),
  ]);
  const courses = (courseRows ?? []) as Course[];
  const lessonCount = new Map<string, number>();
  ((lessonRows ?? []) as { course_id: string }[]).forEach((l) => lessonCount.set(l.course_id, (lessonCount.get(l.course_id) ?? 0) + 1));

  return (
    <>
      <PageHeader
        eyebrow="Academy"
        title="Courses that"
        script="build"
        actions={
          <>
            <Link href="/academy/resources" className="btn btn-ice btn-sm">Resources</Link>
            <Link href="/academy/courses/new" className="btn btn-orange btn-sm">+ New course</Link>
          </>
        }
      />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Courses" value={courses.length} sub={`${courses.filter((c) => c.is_published).length} published`} />
        <StatCard label="Enrolments" value={students ?? 0} sub="students on courses" tone="blue" />
        <StatCard label="Certificates" value={certs ?? 0} sub="issued so far" tone="orange" />
        <StatCard label="Resources" value={resources ?? 0} sub="books, messages, audio" />
      </div>
      {courses.length === 0 ? (
        <EmptyState title="No courses yet." body="Create your first course, add YouTube lessons and a quiz, then publish it to the Academy." action={<Link href="/academy/courses/new" className="btn btn-orange btn-sm">Create a course</Link>} />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><th>Course</th><th>Level</th><th>Format</th><th>Lessons</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {c.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.cover_url} alt="" className="w-12 h-12 rounded-2xl object-cover flex-none" />
                      ) : (
                        <span className="w-12 h-12 rounded-2xl bg-ice flex-none" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold truncate">{c.title}</div>
                        <div className="text-xs text-muted truncate">{c.instructor ?? "—"}{c.duration_label ? ` · ${c.duration_label}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.level}</td>
                  <td className="capitalize">{c.format}</td>
                  <td>{lessonCount.get(c.id) ?? 0}</td>
                  <td>{c.is_published ? <Badge tone="mint">Published</Badge> : <Badge tone="warn">Draft</Badge>}</td>
                  <td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <form action={toggleCourse}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="is_published" value={c.is_published ? "false" : "true"} />
                        <SubmitButton variant="ice" size="sm">{c.is_published ? "Unpublish" : "Publish"}</SubmitButton>
                      </form>
                      <Link href={`/academy/courses/${c.id}`} className="btn btn-blue btn-sm">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
