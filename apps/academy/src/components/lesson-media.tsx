import { youtubeId } from "@phanet/supabase/types";
import type { Lesson } from "@phanet/supabase/types";

export function YouTubeEmbed({ url, title }: { url: string | null | undefined; title?: string }) {
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <div className="aspect-video rounded-card overflow-hidden bg-deep shadow-card">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title ?? "Video"}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export function AudioPlayer({ src, title }: { src: string; title?: string }) {
  return (
    <div className="card-blue p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="dot-orange" aria-hidden />
        <div className="font-bold">{title ?? "Audio"}</div>
      </div>
      <audio controls preload="none" src={src} className="w-full">
        Your browser can&apos;t play this audio. <a href={src} className="underline">Download it instead</a>.
      </audio>
    </div>
  );
}

export function ReadingBody({ body }: { body: string }) {
  return (
    <div className="card p-6 md:p-8 text-[15px] leading-relaxed text-deep whitespace-pre-wrap">{body}</div>
  );
}

/** Picks the right player for a lesson; falls back to whatever media exists. */
export function LessonMedia({ lesson }: { lesson: Lesson }) {
  if (lesson.kind === "video" && youtubeId(lesson.youtube_url)) return <YouTubeEmbed url={lesson.youtube_url} title={lesson.title} />;
  if (lesson.kind === "audio" && lesson.audio_url) return <AudioPlayer src={lesson.audio_url} title={lesson.title} />;
  if (lesson.kind === "reading" && lesson.body) return <ReadingBody body={lesson.body} />;
  if (youtubeId(lesson.youtube_url)) return <YouTubeEmbed url={lesson.youtube_url} title={lesson.title} />;
  if (lesson.audio_url) return <AudioPlayer src={lesson.audio_url} title={lesson.title} />;
  if (lesson.body) return <ReadingBody body={lesson.body} />;
  return <div className="card-ice p-8 text-center text-sm text-muted">This lesson has no media yet. Check back soon.</div>;
}
