import { ButtonLink, Card, Crest, EmptyState, Label, Script } from "@phanet/ui";
import { youtubeId, type Resource } from "@phanet/supabase/types";
import { SiteShell } from "@/components/site-shell";
import { YouTubeEmbed } from "@/components/lesson-media";
import { listResources } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Library" };

function Cover({ r }: { r: Resource }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-ice">
      {r.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.cover_url} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-full w-full grid place-items-center bg-row"><Crest size={39} className="opacity-90" /></div>
      )}
    </div>
  );
}

function BookCard({ r }: { r: Resource }) {
  return (
    <Card className="p-4 flex flex-col gap-4">
      <Cover r={r} />
      <div className="flex-1">
        <h3 className="text-lg leading-tight">{r.title}</h3>
        {r.author && <div className="mt-1 text-xs font-semibold text-muted">by {r.author}</div>}
        {r.description && <p className="mt-2 text-sm text-muted line-clamp-3">{r.description}</p>}
      </div>
      {r.file_url ? (
        <a href={r.file_url} download className="btn btn-blue btn-sm self-start">Download</a>
      ) : (
        <span className="text-xs text-muted">Coming soon</span>
      )}
    </Card>
  );
}

function MessageCard({ r }: { r: Resource }) {
  const hasVideo = Boolean(youtubeId(r.youtube_url));
  return (
    <Card className="p-4 flex flex-col gap-4">
      {hasVideo ? (
        <YouTubeEmbed url={r.youtube_url} title={r.title} />
      ) : r.file_url ? (
        <div className="card-ice p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3"><span className="text-sm font-bold">Listen</span></div>
          <audio controls preload="none" src={r.file_url} className="w-full">
            <a href={r.file_url}>Download audio</a>
          </audio>
        </div>
      ) : (
        <Cover r={r} />
      )}
      <div>
        <h3 className="text-lg leading-tight">{r.title}</h3>
        {r.author && <div className="mt-1 text-xs font-semibold text-muted">{r.author}</div>}
        {r.description && <p className="mt-2 text-sm text-muted line-clamp-3">{r.description}</p>}
      </div>
      {r.file_url && hasVideo && <a href={r.file_url} download className="btn btn-ice btn-sm self-start">Download audio</a>}
    </Card>
  );
}

function Section({ id, label, title, script, items, render, empty }: { id: string; label: string; title: string; script: string; items: Resource[]; render: (r: Resource) => React.ReactNode; empty: string }) {
  return (
    <section id={id} className="pt-12">
      <Label tone="orange">{label}</Label>
      <h2 className="mt-2 t-h2">{title} <span className="script text-royal text-[1.15em]">{script}</span></h2>
      {items.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(render)}</div>
      ) : (
        <EmptyState className="mt-6" title={empty} body="New material is added through the season." />
      )}
    </section>
  );
}

export default async function LibraryPage() {
  const resources = await listResources();
  const books = resources.filter((r) => r.kind === "book");
  const messages = resources.filter((r) => r.kind === "message" || r.kind === "audio");
  const documents = resources.filter((r) => r.kind === "document");

  return (
    <SiteShell
      next="/library"
      hero={
        <div className="max-w-2xl">
          <Label tone="peach">Library</Label>
          <h1 className="h3d mt-3 t-h2 leading-[0.98] ">Take the Word <Script peach className="text-[1.15em]">with you</Script></h1>
          <p className="mt-5 max-w-lg text-white">Books to download, messages to listen to, and study documents from PHANET KNUST. All free.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href="#books" className="pill pill-glass no-underline">{books.length} books</a>
            <a href="#messages" className="pill pill-glass no-underline">{messages.length} messages</a>
            <a href="#documents" className="pill pill-glass no-underline">{documents.length} documents</a>
          </div>
        </div>
      }
    >
      {!resources.length ? (
        <EmptyState className="mt-10" title="The shelves are being stocked" body="Books, messages and documents arrive here soon." action={<ButtonLink href="/courses" variant="blue" size="sm">Browse courses</ButtonLink>} />
      ) : (
        <>
          <Section id="books" label="Books" title="Read and" script="reflect" items={books} render={(r) => <BookCard key={r.id} r={r} />} empty="No books yet" />
          <Section id="messages" label="Messages" title="Listen" script="again" items={messages} render={(r) => <MessageCard key={r.id} r={r} />} empty="No messages yet" />
          <Section id="documents" label="Documents" title="Study" script="notes" items={documents} render={(r) => <BookCard key={r.id} r={r} />} empty="No documents yet" />
        </>
      )}
    </SiteShell>
  );
}
