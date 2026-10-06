import Link from "next/link";
import { Badge, Card, ConfirmSubmit, EmptyState, Notice, PageHeader, StatCard, SubmitButton, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { fmtDateTime } from "@phanet/supabase/format";
import type { PrayerRequest, Testimony } from "@phanet/supabase/types";
import { Flash, type FlashParams } from "@/components/Flash";
import { deleteRequest, deleteTestimony, setRequestHidden, setTestimonyHidden } from "./actions";

export default async function PrayerWallPage({ searchParams }: { searchParams: Promise<FlashParams & { tab?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "testimonies" ? "testimonies" : "requests";
  const supabase = await createClient();
  const [{ data: reqRows }, { data: testRows }] = await Promise.all([
    supabase.from("prayer_requests").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("testimonies").select("*").order("created_at", { ascending: false }).limit(300),
  ]);
  const requests = (reqRows ?? []) as PrayerRequest[];
  const testimonies = (testRows ?? []) as Testimony[];
  const topicById = new Map(requests.map((r) => [r.id, r.topic]));
  const missing = testimonies.map((t) => t.request_id).filter((id) => !topicById.has(id));
  if (missing.length) {
    const { data } = await supabase.from("prayer_requests").select("id, topic").in("id", Array.from(new Set(missing)));
    ((data ?? []) as { id: string; topic: string }[]).forEach((r) => topicById.set(r.id, r.topic));
  }
  const open = requests.filter((r) => r.status === "open" && !r.is_hidden).length;
  const hiddenCount = requests.filter((r) => r.is_hidden).length + testimonies.filter((t) => t.is_hidden).length;

  return (
    <>
      <PageHeader eyebrow="Prayer wall" title="Keep the wall" script="safe" />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open requests" value={open} sub="visible on the wall" />
        <StatCard label="Testimonies" value={testimonies.length} sub="answered prayers shared" tone="orange" />
        <StatCard label="Hidden" value={hiddenCount} sub="moderated items" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Link href="/prayerwall" className="chip no-underline" data-selected={tab === "requests" ? "true" : undefined}>Requests ({requests.length})</Link>
        <Link href="/prayerwall?tab=testimonies" className="chip no-underline" data-selected={tab === "testimonies" ? "true" : undefined}>Testimonies ({testimonies.length})</Link>
      </div>
      <Notice tone="ice">Codes are private. Only share one with the person who asks for help with their own request.</Notice>

      {tab === "requests" ? (
        requests.length === 0 ? (
          <EmptyState title="No prayer requests yet." body="Requests posted anonymously on the prayer wall will appear here." />
        ) : (
          <Card>
            <Table>
              <thead>
                <tr><th>Code</th><th>Request</th><th>Category</th><th>Prayers</th><th>Status</th><th>Posted</th><th /></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className={r.is_hidden ? "opacity-60" : undefined}>
                    <td className="font-mono text-xs whitespace-nowrap">{r.code}</td>
                    <td className="max-w-[320px]">
                      <div className="font-bold">{r.topic}</div>
                      {r.body && <div className="text-xs text-muted line-clamp-2">{r.body}</div>}
                    </td>
                    <td>{r.category}</td>
                    <td>{r.pray_count}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={r.status === "answered" ? "mint" : "good"}>{r.status}</Badge>
                        {r.is_hidden && <Badge tone="warn">Hidden</Badge>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-xs">{fmtDateTime(r.created_at)}</td>
                    <td className="text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <form action={setRequestHidden}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="is_hidden" value={r.is_hidden ? "false" : "true"} />
                          <SubmitButton variant="ice" size="sm">{r.is_hidden ? "Unhide" : "Hide"}</SubmitButton>
                        </form>
                        <form action={deleteRequest}>
                          <input type="hidden" name="id" value={r.id} />
                          <ConfirmSubmit variant="danger" size="sm" message="Delete this request and any testimonies on it?">Delete</ConfirmSubmit>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )
      ) : testimonies.length === 0 ? (
        <EmptyState title="No testimonies yet." body="When someone shares an answered prayer using their code, it shows here." />
      ) : (
        <Card>
          <Table>
            <thead>
              <tr><th>Testimony</th><th>On request</th><th>Status</th><th>Shared</th><th /></tr>
            </thead>
            <tbody>
              {testimonies.map((t) => (
                <tr key={t.id} className={t.is_hidden ? "opacity-60" : undefined}>
                  <td className="max-w-[420px]"><div className="text-sm line-clamp-3">{t.body}</div></td>
                  <td className="text-xs">{topicById.get(t.request_id) ?? "—"}</td>
                  <td>{t.is_hidden ? <Badge tone="warn">Hidden</Badge> : <Badge tone="mint">Visible</Badge>}</td>
                  <td className="whitespace-nowrap text-xs">{fmtDateTime(t.created_at)}</td>
                  <td className="text-right whitespace-nowrap">
                    <div className="inline-flex gap-2">
                      <form action={setTestimonyHidden}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="is_hidden" value={t.is_hidden ? "false" : "true"} />
                        <SubmitButton variant="ice" size="sm">{t.is_hidden ? "Unhide" : "Hide"}</SubmitButton>
                      </form>
                      <form action={deleteTestimony}>
                        <input type="hidden" name="id" value={t.id} />
                        <ConfirmSubmit variant="danger" size="sm" message="Delete this testimony?">Delete</ConfirmSubmit>
                      </form>
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
