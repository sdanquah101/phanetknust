import Link from "next/link";
import { ButtonLink, Card, EmptyState, Label, PageHeader, StatCard, Toast } from "@phanet/ui";
import { fmtDate, greeting, isoDate, todayLabel } from "@phanet/supabase/format";
import type { Followup, Member } from "@phanet/supabase/types";
import { addDays, fullName, getLeaderContext, leaderNames, listMyFollowups, listMySheep, listReportsForWeek, listSharedWithMe, lookupMemberNames, weekStartIso } from "@/lib/queries";
import { KindBadge, NotLinked, SheepChip } from "@/components/bits";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { session, leaderMemberId, leader, supabase } = await getLeaderContext();
  const first = leader?.first_name ?? session.profile?.full_name ?? null;

  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow={todayLabel()} title={greeting(first)} />
        <NotLinked />
      </>
    );
  }

  const today = new Date();
  const weekStart = weekStartIso(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const todayIso = isoDate(today);
  const in7 = isoDate(addDays(today, 7));
  const past30 = isoDate(addDays(today, -30));
  const cutoff21 = addDays(today, -21).getTime();

  const [sheep, reports, followups, shared, leaders, monthCount] = await Promise.all([
    listMySheep(supabase, leaderMemberId),
    listReportsForWeek(supabase, leaderMemberId, weekStart),
    listMyFollowups(supabase, leaderMemberId),
    listSharedWithMe(supabase, leaderMemberId),
    leaderNames(supabase),
    supabase.from("followups").select("id", { count: "exact", head: true }).eq("leader_id", leaderMemberId).gte("occurred_at", monthStart).then((r) => r.count ?? 0),
  ]);

  const sheepById = new Map(sheep.map((s) => [s.id, s]));
  const reportedIds = new Set(reports.map((r) => r.sheep_id));
  const lastFollowup = new Map<string, Followup>();
  for (const f of followups) if (!lastFollowup.has(f.sheep_id)) lastFollowup.set(f.sheep_id, f);

  const upcoming = followups
    .filter((f) => f.next_action_date && f.next_action_date <= in7 && f.next_action_date >= past30)
    .sort((a, b) => (a.next_action_date ?? "").localeCompare(b.next_action_date ?? ""));

  const needsAttention: Member[] = sheep.filter((s) => {
    if (reportedIds.has(s.id)) return false;
    const last = lastFollowup.get(s.id);
    return !last || new Date(last.occurred_at).getTime() < cutoff21;
  });

  // Sheep on shared follow-ups usually belong to another leader, so RLS hides them; use the staff search RPC.
  const sharedSheepIds = shared.map((s) => s.followup?.sheep_id).filter((x): x is string => Boolean(x));
  const sharedNames = await lookupMemberNames(supabase, sharedSheepIds);

  return (
    <>
      <PageHeader
        eyebrow={todayLabel()}
        title={greeting(first)}
        actions={
          <>
            <ButtonLink href="/followups/new" size="sm">Log a follow-up</ButtonLink>
            <ButtonLink href="/reports" size="sm" variant="blue">Fill weekly report</ButtonLink>
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label="My sheep" value={sheep.length} sub="assigned to you" />
        <StatCard label="Reported this week" value={`${reportedIds.size}/${sheep.length}`} sub={`week of ${fmtDate(weekStart)}`} tone="orange" />
        <StatCard label="Follow-ups this month" value={monthCount} sub="logged by you" />
        <StatCard label="Next actions due" value={upcoming.length} sub="in the next 7 days" tone="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label tone="orange">Needs attention</Label>
            <span className="text-xs text-muted">{needsAttention.length} sheep</span>
          </div>
          {needsAttention.length === 0 ? (
            <EmptyState title="Everyone's covered" body="Every sheep has a recent follow-up or a report this week." />
          ) : (
            <ul className="flex flex-col divide-y divide-ice">
              {needsAttention.slice(0, 8).map((s) => {
                const last = lastFollowup.get(s.id);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <SheepChip m={s} />
                    <span className="text-xs text-muted text-right">{last ? `Last: ${fmtDate(last.occurred_at)}` : "No follow-up yet"}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {needsAttention.length > 8 && <Link href="/sheep" className="text-sm font-bold text-royal">See all sheep →</Link>}
        </Card>

        <Card className="flex flex-col gap-4">
          <Label tone="orange">Upcoming next actions</Label>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing due" body="Set a next action on a follow-up and it will show up here." />
          ) : (
            <ul className="flex flex-col divide-y divide-ice">
              {upcoming.slice(0, 8).map((f) => {
                const s = sheepById.get(f.sheep_id);
                const overdue = (f.next_action_date ?? "") < todayIso;
                return (
                  <li key={f.id} className="py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/followups/${f.id}`} className="font-semibold text-sm text-deep no-underline hover:text-royal">{s ? fullName(s) : "Sheep"}</Link>
                      <span className={overdue ? "badge badge-warn" : "badge badge-good"}>{fmtDate(f.next_action_date)}</span>
                    </div>
                    <p className="text-sm text-muted">{f.next_action}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <Label tone="orange">Shared with me</Label>
        {shared.length === 0 ? (
          <EmptyState title="Nothing shared yet" body="When another leader shares a follow-up with you, it lands here." />
        ) : (
          <ul className="flex flex-col divide-y divide-ice">
            {shared.slice(0, 8).map(({ share, followup }) => (
              <li key={`${share.followup_id}-${share.shared_with}`} className="py-3 flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  {followup && <KindBadge kind={followup.kind} />}
                  <Link href={`/followups/${share.followup_id}`} className="font-semibold text-sm text-deep no-underline hover:text-royal">
                    {followup ? sharedNames.get(followup.sheep_id) ?? "A member" : "Follow-up"}
                  </Link>
                  <span className="text-xs text-muted">
                    · shared by {followup ? leaders.get(followup.leader_id) ?? "a leader" : "a leader"} · {fmtDate(share.created_at)}
                  </span>
                </div>
                {followup && <p className="text-sm text-muted line-clamp-2">{followup.summary}</p>}
                {share.note && <p className="text-xs text-royal">Note: {share.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
