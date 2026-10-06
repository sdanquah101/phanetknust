import Link from "next/link";
import type { Lesson } from "@phanet/supabase/types";

const KIND_LABEL: Record<Lesson["kind"], string> = { video: "Video", audio: "Audio", reading: "Reading" };

export function Tick({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-extrabold ${done ? "bg-royal text-white" : "bg-ice text-royal"}`}
    >
      {done ? "✓" : ""}
    </span>
  );
}

export function LessonList({
  slug, lessons, done, currentId, locked = false,
}: {
  slug: string; lessons: Lesson[]; done: Set<string>; currentId?: string; locked?: boolean;
}) {
  if (!lessons.length) return <div className="card-ice p-6 text-sm text-muted text-center">Lessons are on their way.</div>;
  return (
    <ol className="flex flex-col gap-2">
      {lessons.map((l, i) => {
        const isCurrent = l.id === currentId;
        const inner = (
          <>
            <Tick done={done.has(l.id)} />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{i + 1}. {l.title}</span>
              <span className="block text-[11px] font-semibold text-muted">
                {KIND_LABEL[l.kind]}{l.duration_minutes ? ` · ${l.duration_minutes} min` : ""}
              </span>
            </span>
            {isCurrent && <span className="badge badge-orange">Now</span>}
          </>
        );
        const cls = "option-row no-underline";
        return (
          <li key={l.id}>
            {locked ? (
              <div className={cls} data-selected={isCurrent}>{inner}</div>
            ) : (
              <Link href={`/courses/${slug}/lessons/${l.id}`} className={cls} data-selected={isCurrent} aria-current={isCurrent ? "page" : undefined}>{inner}</Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
