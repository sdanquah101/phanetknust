import Link from "next/link";
import { EmptyState, Label, Script } from "@phanet/ui";
import { SiteShell } from "@/components/site-shell";
import { CourseCardView } from "@/components/course-card";
import { listCourses, listLevels } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Courses" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const sp = await searchParams;
  const level = sp.level?.trim() || undefined;
  const [courses, levels] = await Promise.all([listCourses({ level }), listLevels()]);

  return (
    <SiteShell
      next="/courses"
      hero={
        <div className="max-w-2xl">
          <Label tone="peach">Courses</Label>
          <h1 className="h3d mt-3 text-[40px] leading-[0.98] md:text-[60px]">Pick a course and <Script peach className="text-[1.15em]">begin</Script></h1>
          <p className="mt-5 max-w-lg text-white/85">Every course is free. Watch the lessons, pass the quiz, and your certificate is ready to download.</p>
        </div>
      }
    >
      <div className="pt-10 flex flex-wrap gap-2" role="group" aria-label="Filter by level">
        <Link href="/courses" className="chip no-underline" data-selected={!level}>All levels</Link>
        {levels.map((l) => (
          <Link key={l} href={`/courses?level=${encodeURIComponent(l)}`} className="chip no-underline" data-selected={level === l}>{l}</Link>
        ))}
      </div>
      {courses.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCardView key={c.id} course={c} />)}
        </div>
      ) : (
        <EmptyState className="mt-6" title={level ? `No ${level} courses yet` : "No courses yet"} body="New courses are added through the season. Try another level or check back soon." />
      )}
    </SiteShell>
  );
}
