import Link from "next/link";
import { Badge, ProgressRing } from "@phanet/ui";
import { youtubeThumb } from "@phanet/supabase/types";
import { firstLesson, type CourseCard as CourseCardData } from "@/lib/queries";

export const FORMAT_LABEL: Record<string, string> = { video: "Video", audio: "Audio", mixed: "Video + audio" };

export function CourseCover({ course, className = "" }: { course: CourseCardData; className?: string }) {
  const first = firstLesson(course);
  const src = course.cover_url ?? youtubeThumb(first?.youtube_url) ?? null;
  return (
    <div className={`relative aspect-video overflow-hidden rounded-[18px] bg-ice ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="ground-blue h-full w-full grid place-items-center">
          <span className="dot-orange" style={{ width: 44, height: 44 }} />
        </div>
      )}
      <span className="badge badge-white absolute left-3 top-3">{course.level}</span>
    </div>
  );
}

export function CourseCardView({ course, pct }: { course: CourseCardData; pct?: number }) {
  const n = course.lessons.length;
  return (
    <Link href={`/courses/${course.slug}`} className="card p-4 flex flex-col gap-4 no-underline transition-transform hover:-translate-y-1">
      <CourseCover course={course} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-tight">{course.title}</h3>
          {course.summary && <p className="mt-2 text-sm text-muted line-clamp-2">{course.summary}</p>}
        </div>
        {typeof pct === "number" && <ProgressRing pct={pct} size={56} ice className="flex-none" />}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted">
        <Badge tone="good">{FORMAT_LABEL[course.format] ?? course.format}</Badge>
        <span className="font-semibold">{n} {n === 1 ? "lesson" : "lessons"}</span>
        {course.duration_label && <span>· {course.duration_label}</span>}
      </div>
    </Link>
  );
}
