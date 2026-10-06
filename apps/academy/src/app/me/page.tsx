import Link from "next/link";
import { Avatar, Badge, ButtonLink, Card, EmptyState, Label, ProgressRing, Script } from "@phanet/ui";
import { signOutAction } from "@phanet/supabase/actions";
import { fmtDate, fmtDateTime } from "@phanet/supabase/format";
import { requireUser } from "@phanet/supabase/server";
import { SiteShell } from "@/components/site-shell";
import { CourseCardView } from "@/components/course-card";
import { listMyCertificates, listMyEnrollments, listMyRecentAttempts } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "My learning" };

export default async function MePage() {
  const session = await requireUser({ next: "/me" });
  const name = session.profile?.full_name ?? session.user.email ?? "friend";
  const first = name.trim().split(/\s+/)[0] ?? name;
  const [enrolled, certificates, attempts] = await Promise.all([
    listMyEnrollments(session.user.id),
    listMyCertificates(session.user.id),
    listMyRecentAttempts(session.user.id),
  ]);
  const inProgress = enrolled.filter((e) => e.pct < 100);
  const completed = enrolled.filter((e) => e.pct >= 100);

  return (
    <SiteShell
      next="/me"
      hero={
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={name} src={session.profile?.avatar_url} peach className="!h-16 !w-16 !text-xl" />
            <div>
              <Label tone="peach">My learning</Label>
              <h1 className="h3d mt-2 t-h2 leading-[1] ">Akwaaba, <Script peach className="text-[1.15em]">{first}</Script></h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="glass p-4 min-w-[120px]"><Label tone="peach">Courses</Label><div className="num-lg mt-1">{enrolled.length}</div></div>
            <div className="glass p-4 min-w-[120px]"><Label tone="peach">Certificates</Label><div className="num-lg mt-1">{certificates.length}</div></div>
            <form action={signOutAction} className="self-center"><button className="btn btn-ghost btn-sm">Sign out</button></form>
          </div>
        </div>
      }
    >
      <section className="pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="t-h2">Continue <span className="script text-royal text-[1.15em]">learning</span></h2>
          <Link href="/courses" className="btn btn-ice btn-sm">Find a course</Link>
        </div>
        {inProgress.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((e) => <CourseCardView key={e.course.id} course={e.course} pct={e.pct} />)}
          </div>
        ) : (
          <EmptyState className="mt-6" title={enrolled.length ? "Everything's complete" : "You haven't enrolled yet"} body={enrolled.length ? "Pick a new course to keep growing." : "Browse the courses and enrol in one. It's free."} action={<ButtonLink href="/courses" variant="blue" size="sm">Browse courses</ButtonLink>} />
        )}
      </section>

      {completed.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[24px] md:text-[28px]">Completed</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((e) => <CourseCardView key={e.course.id} course={e.course} pct={e.pct} />)}
          </div>
        </section>
      )}

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between"><Label tone="orange">Certificates</Label><Badge tone="good">{certificates.length}</Badge></div>
          {certificates.length ? (
            <ul className="flex flex-col divide-y divide-ice">
              {certificates.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-extrabold truncate">{c.courses?.title ?? "Course"}</div>
                    <div className="text-xs text-muted">Issued {fmtDate(c.issued_at)} · {c.code}</div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`/certificates/${c.code}/pdf`} className="btn btn-blue btn-sm">Download</a>
                    <Link href={`/certificates/${c.code}`} className="btn btn-ice btn-sm">Verify</Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Pass a course quiz after finishing its lessons and your certificate appears here.</p>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <Label tone="orange">Recent quiz attempts</Label>
          {attempts.length ? (
            <ul className="flex flex-col divide-y divide-ice">
              {attempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={a.quizzes?.courses?.slug ? `/courses/${a.quizzes.courses.slug}/quiz` : "/courses"} className="font-bold truncate block no-underline text-deep">{a.quizzes?.courses?.title ?? "Quiz"}</Link>
                    <div className="text-xs text-muted">{fmtDateTime(a.created_at)}</div>
                  </div>
                  <span className="flex items-center gap-2">
                    <ProgressRing pct={a.score} size={44} ice><span className="text-[11px]">{a.score}</span></ProgressRing>
                    <Badge tone={a.passed ? "mint" : "warn"}>{a.passed ? "Passed" : "Failed"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No quiz attempts yet.</p>
          )}
        </Card>
      </div>
    </SiteShell>
  );
}
