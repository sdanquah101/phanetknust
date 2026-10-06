import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, ConfirmSubmit, EmptyState, Field, Input, Label, Notice, PageHeader, Select, SubmitButton, Toast } from "@phanet/ui";
import { fmtDate, fmtDateTime } from "@phanet/supabase/format";
import type { Followup, FollowupShare } from "@phanet/supabase/types";
import { fullName, getLeaderContext, getMySheep, listLeaders, lookupMemberNames } from "@/lib/queries";
import { KindBadge, NotLinked } from "@/components/bits";
import { FollowupForm } from "@/components/followup-form";
import { deleteFollowupAction, shareFollowupAction, unshareFollowupAction, updateFollowupAction } from "../actions";

export default async function FollowupDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Follow-ups" title="Follow-up" />
        <NotLinked />
      </>
    );
  }
  const { data } = await supabase.from("followups").select("*").eq("id", id).maybeSingle();
  const f = data as Followup | null;
  if (!f) notFound();
  const mine = f.leader_id === leaderMemberId;

  const [sheep, leaders, sharesRes] = await Promise.all([
    getMySheep(supabase, leaderMemberId, f.sheep_id),
    listLeaders(supabase),
    supabase.from("followup_shares").select("*").eq("followup_id", f.id).order("created_at"),
  ]);
  const shares = (sharesRes.data ?? []) as FollowupShare[];
  const leaderName = new Map(leaders.map((l) => [l.id, l.full_name]));
  const sheepName = sheep ? fullName(sheep) : (await lookupMemberNames(supabase, [f.sheep_id])).get(f.sheep_id) ?? "A member";
  const owner = leaderName.get(f.leader_id) ?? "another leader";
  const sharedIds = new Set(shares.map((s) => s.shared_with));
  const shareOptions = leaders.filter((l) => l.id !== leaderMemberId && !sharedIds.has(l.id));

  return (
    <>
      <PageHeader
        eyebrow="Follow-up"
        title={sheepName}
        actions={
          <>
            {sheep && <Link href={`/sheep/${sheep.id}`} className="btn btn-ice btn-sm">View profile</Link>}
            <Link href="/followups" className="btn btn-outline-blue btn-sm">All follow-ups</Link>
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={f.kind} />
              <span className="text-xs text-muted">{fmtDateTime(f.occurred_at)}</span>
              {!mine && <span className="badge badge-warn">Shared by {owner}</span>}
            </div>
            <p className="text-base font-medium whitespace-pre-line">{f.summary}</p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Needs</Label>
                <p className="mt-1 text-muted whitespace-pre-line">{f.needs || "—"}</p>
              </div>
              <div>
                <Label>Prayer points</Label>
                <p className="mt-1 text-muted whitespace-pre-line">{f.prayer_points || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <Label>Next action</Label>
                <p className="mt-1 text-muted">{f.next_action || "—"}{f.next_action_date ? ` · due ${fmtDate(f.next_action_date)}` : ""}</p>
              </div>
            </div>
          </Card>

          {mine && (
            <Card className="flex flex-col gap-4">
              <Label tone="orange">Edit follow-up</Label>
              <FollowupForm action={updateFollowupAction} existing={f} back={`/followups/${f.id}`} submitLabel="Save changes" hidden={{ id: f.id }} />
              <div className="divider" />
              <form action={deleteFollowupAction} className="flex justify-end">
                <input type="hidden" name="id" value={f.id} />
                <ConfirmSubmit message="Delete this follow-up? This can't be undone." variant="danger" size="sm">Delete follow-up</ConfirmSubmit>
              </form>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <Label tone="orange">{mine ? "Shared with" : "Also shared with"}</Label>
            {shares.length === 0 ? (
              <EmptyState title="Not shared yet" body={mine ? "Share it with another leader who should know." : undefined} className="!p-6" />
            ) : (
              <ul className="flex flex-col divide-y divide-ice">
                {shares.map((s) => (
                  <li key={s.shared_with} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{leaderName.get(s.shared_with) ?? "A leader"}</div>
                      {s.note && <div className="text-xs text-muted">{s.note}</div>}
                      <div className="text-[11px] text-muted">{fmtDate(s.created_at)}</div>
                    </div>
                    {mine && (
                      <form action={unshareFollowupAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="shared_with" value={s.shared_with} />
                        <ConfirmSubmit message="Remove this share?" variant="ice" size="sm">Remove</ConfirmSubmit>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {mine && (
            <Card className="flex flex-col gap-4">
              <Label tone="orange">Share with another leader</Label>
              {shareOptions.length === 0 ? (
                <Notice tone="ice">No other leaders to share with.</Notice>
              ) : (
                <form action={shareFollowupAction} className="flex flex-col gap-3">
                  <input type="hidden" name="id" value={f.id} />
                  <Field label="Leader">
                    <Select name="shared_with" defaultValue="" required>
                      <option value="" disabled>Choose a leader…</option>
                      {shareOptions.map((l) => <option key={l.id} value={l.id}>{l.full_name}{l.department ? ` · ${l.department}` : ""}</option>)}
                    </Select>
                  </Field>
                  <Field label="Note" hint="Optional. Why are you sharing this?">
                    <Input name="note" placeholder="Please check on them this week" />
                  </Field>
                  <SubmitButton variant="blue" size="sm" pendingText="Sharing…">Share</SubmitButton>
                </form>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
