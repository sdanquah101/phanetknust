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
  slug, lessons, done, currentId, locked = false, openUpTo = Infinity, quizCounts,
}: {
  slug: string; lessons: Lesson[]; done: Set<string>; currentId?: string; locked?: boolean;
  /** lessons after this index are locked until the earlier ones are completed */
  openUpTo?: number; quizCounts?: Map<string, number>;
}) {
  if (!lessons.length) return <div className="card-ice p-6 text-sm text-muted text-center">Lessons are on their way.</div>;
  return (
    <ol className="flex flex-col gap-2">
      {lessons.map((l, i) => {
        const isCurrent = l.id === currentId;
        const isLocked = !locked && i > openUpTo;
        const q = quizCounts?.get(l.id) ?? 0;
        const inner = (
          <>
            {isLocked ? <span aria-hidden className="grid h-7 w-7 flex-none place-items-center rounded-full bg-ice text-muted"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span> : <Tick done={done.has(l.id)} />}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{i + 1}. {l.title}</span>
              <span className="block text-[11px] font-semibold text-muted">
                {KIND_LABEL[l.kind]}{l.duration_minutes ? ` · ${l.duration_minutes} min` : ""}{q ? ` · quiz (${q})` : ""}{isLocked ? " · locked" : ""}
              </span>
            </span>
            {isCurrent && <span className="badge badge-orange">Now</span>}
          </>
        );
        const cls = "option-row no-underline";
        return (
          <li key={l.id}>
            {locked || isLocked ? (
              <div className={`${cls} ${isLocked ? "opacity-60" : ""}`} data-selected={isCurrent} aria-disabled={isLocked || undefined}>{inner}</div>
            ) : (
              <Link href={`/courses/${slug}/lessons/${l.id}`} className={cls} data-selected={isCurrent} aria-current={isCurrent ? "page" : undefined}>{inner}</Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
