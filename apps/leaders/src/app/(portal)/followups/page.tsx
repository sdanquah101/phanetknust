import Link from "next/link";
import { ButtonLink, Card, EmptyState, PageHeader, Toast } from "@phanet/ui";
import { fmtDate } from "@phanet/supabase/format";
import type { Followup, FollowupShare } from "@phanet/supabase/types";
import { FOLLOWUP_KINDS, KIND_LABELS, fullName, getLeaderContext, leaderNames, listMyFollowups, listMySheep, listSharedWithMe, lookupMemberNames } from "@/lib/queries";
import { KindBadge, NotLinked } from "@/components/bits";

type Row = { f: Followup; mine: boolean; sharedBy?: string; sharedCount?: number };

export default async function FollowupsPage({ searchParams }: { searchParams: Promise<{ kind?: string; sheep?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Shepherding" title="Follow" script="ups" />
        <NotLinked />
      </>
    );
  }
  const kind = FOLLOWUP_KINDS.includes(sp.kind as Followup["kind"]) ? (sp.kind as Followup["kind"]) : undefined;
  const sheepFilter = sp.sheep ?? undefined;

  const [mine, shared, sheep, leaders] = await Promise.all([
    listMyFollowups(supabase, leaderMemberId),
    listSharedWithMe(supabase, leaderMemberId),
    listMySheep(supabase, leaderMemberId),
    leaderNames(supabase),
  ]);

  // Count of shares on my follow-ups (for the "Shared with N" tag)
  const myIds = mine.map((f) => f.id);
  const shareCounts = new Map<string, number>();
  if (myIds.length) {
    const { data } = await supabase.from("followup_shares").select("followup_id").in("followup_id", myIds);
    for (const s of (data ?? []) as Pick<FollowupShare, "followup_id">[]) shareCounts.set(s.followup_id, (shareCounts.get(s.followup_id) ?? 0) + 1);
  }

  const sheepNames = new Map(sheep.map((s) => [s.id, fullName(s)]));
  const otherIds = shared.map((s) => s.followup?.sheep_id).filter((x): x is string => Boolean(x) && !sheepNames.has(x as string));
  const otherNames = await lookupMemberNames(supabase, otherIds);
  const nameOf = (id: string) => sheepNames.get(id) ?? otherNames.get(id) ?? "A member";

  let rows: Row[] = [
    ...mine.map((f) => ({ f, mine: true, sharedCount: shareCounts.get(f.id) ?? 0 })),
    ...shared.filter((s) => s.followup && s.followup.leader_id !== leaderMemberId).map((s) => ({ f: s.followup as Followup, mine: false, sharedBy: leaders.get((s.followup as Followup).leader_id) ?? "another leader" })),
  ];
  const seen = new Set<string>();
  rows = rows.filter((r) => (seen.has(r.f.id) ? false : (seen.add(r.f.id), true)));
  if (kind) rows = rows.filter((r) => r.f.kind === kind);
  if (sheepFilter) rows = rows.filter((r) => r.f.sheep_id === sheepFilter);
  rows.sort((a, b) => b.f.occurred_at.localeCompare(a.f.occurred_at));

  const qs = (over: { kind?: string; sheep?: string }) => {
    const p = new URLSearchParams();
    const k = over.kind !== undefined ? over.kind : kind ?? "";
    const s = over.sheep !== undefined ? over.sheep : sheepFilter ?? "";
    if (k) p.set("kind", k);
    if (s) p.set("sheep", s);
    const str = p.toString();
    return str ? `/followups?${str}` : "/followups";
  };

  return (
    <>
      <PageHeader eyebrow="Shepherding" title="Follow" script="ups" actions={<ButtonLink href="/followups/new" size="sm">Log a follow-up</ButtonLink>} />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="flex flex-wrap gap-2 items-center">
        <Link href={qs({ kind: "" })} className="chip no-underline" data-selected={!kind}>All</Link>
        {FOLLOWUP_KINDS.map((k) => (
          <Link key={k} href={qs({ kind: k })} className="chip no-underline" data-selected={kind === k}>{KIND_LABELS[k]}</Link>
        ))}
      </div>
      <form method="get" className="flex flex-col sm:flex-row gap-2 sm:items-center">
        {kind && <input type="hidden" name="kind" value={kind} />}
        <label className="field sm:flex-1">
          <span className="field-label">Sheep</span>
          <select name="sheep" className="select" defaultValue={sheepFilter ?? ""}>
            <option value="">Everyone</option>
            {sheep.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
          </select>
        </label>
        <button type="submit" className="btn btn-blue btn-sm sm:self-end">Filter</button>
        {sheepFilter && <Link href={qs({ sheep: "" })} className="btn btn-ice btn-sm sm:self-end">Clear</Link>}
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No follow-ups here" body="Log a call, visit or prayer time and it will appear in this list." action={<ButtonLink href="/followups/new" size="sm">Log a follow-up</ButtonLink>} />
      ) : (
        <Card className="!p-2 md:!p-4">
          <ul className="flex flex-col divide-y divide-ice">
            {rows.map(({ f, mine, sharedBy, sharedCount }) => (
              <li key={f.id}>
                <Link href={`/followups/${f.id}`} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-2 no-underline text-deep hover:bg-row rounded-2xl">
                  <span className="text-xs text-muted w-28 flex-none">{fmtDate(f.occurred_at)}</span>
                  <span className="font-bold text-sm sm:w-44 flex-none truncate">{nameOf(f.sheep_id)}</span>
                  <KindBadge kind={f.kind} />
                  <span className="text-sm text-muted flex-1 truncate">{f.summary}</span>
                  {mine ? (
                    sharedCount ? <span className="badge badge-good flex-none">Shared with {sharedCount}</span> : null
                  ) : (
                    <span className="badge badge-warn flex-none">Shared by {sharedBy}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
