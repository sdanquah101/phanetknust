import Link from "next/link";
import { Card, EmptyState, Label, PageHeader, ProgressRing, SubmitButton, Toast } from "@phanet/ui";
import { fmtDate, isoDate, pct, startOfWeek } from "@phanet/supabase/format";
import type { SheepReport } from "@phanet/supabase/types";
import { addDays, fullName, getLeaderContext, listMySheep, listReportsForWeek, weekStartIso } from "@/lib/queries";
import { NotLinked } from "@/components/bits";
import { saveWeeklyReportAction } from "./actions";

const WELLBEING = ["", "1 · Struggling", "2 · Low", "3 · Okay", "4 · Good", "5 · Thriving"];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ week?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Every week" title="Weekly" script="report" />
        <NotLinked />
      </>
    );
  }

  const requested = sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? new Date(`${sp.week}T00:00:00`) : new Date();
  const weekDate = Number.isNaN(requested.getTime()) ? startOfWeek() : startOfWeek(requested);
  const week = isoDate(weekDate);
  const thisWeek = weekStartIso();
  const prevWeek = isoDate(addDays(weekDate, -7));
  const nextWeek = isoDate(addDays(weekDate, 7));
  const isFuture = week > thisWeek;

  const [sheep, reports, historyRes] = await Promise.all([
    listMySheep(supabase, leaderMemberId),
    listReportsForWeek(supabase, leaderMemberId, week),
    supabase.from("sheep_reports").select("*").eq("leader_id", leaderMemberId).gte("week_start", isoDate(addDays(weekDate, -28))).lt("week_start", week),
  ]);
  const byId = new Map(reports.map((r) => [r.sheep_id, r]));
  const done = sheep.filter((s) => byId.has(s.id)).length;
  const history = (historyRes.data ?? []) as SheepReport[];

  const weeks = [1, 2, 3, 4].map((n) => {
    const ws = isoDate(addDays(weekDate, -7 * n));
    const rows = history.filter((r) => r.week_start === ws);
    const total = sheep.length || rows.length;
    return {
      ws,
      reported: rows.length,
      attended: pct(rows.filter((r) => r.attended).length, total),
      contacted: pct(rows.filter((r) => r.contacted).length, total),
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Every week"
        title="Weekly"
        script="report"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/reports?week=${prevWeek}`} className="btn btn-ice btn-sm">← Prev</Link>
            <span className="pill pill-white text-xs">{fmtDate(week)} – {fmtDate(addDays(weekDate, 6))}</span>
            <Link href={`/reports?week=${nextWeek}`} className="btn btn-ice btn-sm">Next →</Link>
            {week !== thisWeek && <Link href="/reports" className="btn btn-outline-blue btn-sm">This week</Link>}
          </div>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card tone="blue" className="flex items-center gap-5">
          <ProgressRing pct={pct(done, sheep.length)} size={92} />
          <div>
            <Label tone="peach">Completion</Label>
            <div className="num-lg mt-1">{done} of {sheep.length}</div>
            <div className="text-xs text-white/85 mt-1">sheep reported for the week of {fmtDate(week)}</div>
          </div>
        </Card>
        <Card className="lg:col-span-2 flex flex-col gap-3">
          <Label tone="orange">Previous 4 weeks</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {weeks.map((w) => (
              <Link key={w.ws} href={`/reports?week=${w.ws}`} className="card-ice p-3 no-underline text-deep flex flex-col gap-1">
                <div className="text-[11px] text-muted font-semibold">{fmtDate(w.ws, { day: "numeric", month: "short" })}</div>
                <div className="text-sm"><span className="font-extrabold">{w.attended}%</span> <span className="text-muted text-xs">attended</span></div>
                <div className="text-sm"><span className="font-extrabold">{w.contacted}%</span> <span className="text-muted text-xs">contacted</span></div>
                <div className="text-[11px] text-muted">{w.reported} reported</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {sheep.length === 0 ? (
        <EmptyState title="No sheep assigned yet" body="Once members are assigned to you, you can report on them here each week." />
      ) : (
        <form action={saveWeeklyReportAction} className="flex flex-col gap-4">
          <input type="hidden" name="week_start" value={week} />
          {isFuture && <div className="notice notice-peach">This week hasn't started yet, but you can still prepare it.</div>}
          <Card className="!p-2 md:!p-4">
            <div className="hidden md:grid grid-cols-[1.4fr_90px_90px_150px_1.6fr] gap-3 px-3 pb-2 label-caps text-muted !text-[10px]">
              <span>Sheep</span><span>Attended</span><span>Contacted</span><span>Wellbeing</span><span>Notes</span>
            </div>
            <ul className="flex flex-col divide-y divide-ice">
              {sheep.map((s) => {
                const r = byId.get(s.id);
                return (
                  <li key={s.id} className="grid grid-cols-2 md:grid-cols-[1.4fr_90px_90px_150px_1.6fr] gap-3 items-center px-3 py-3">
                    <input type="hidden" name="sheep_id" value={s.id} />
                    <div className="col-span-2 md:col-span-1 min-w-0">
                      <div className="font-bold text-sm truncate">{fullName(s)}</div>
                      <div className="text-[11px] text-muted">{r ? `Updated ${fmtDate(r.updated_at)}` : "Not reported"}</div>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" className="check" name={`attended_${s.id}`} defaultChecked={r?.attended ?? false} />
                      <span className="md:hidden">Attended</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" className="check" name={`contacted_${s.id}`} defaultChecked={r?.contacted ?? false} />
                      <span className="md:hidden">Contacted</span>
                    </label>
                    <select name={`wellbeing_${s.id}`} className="select !py-2.5" defaultValue={r?.wellbeing ?? ""} aria-label={`Wellbeing for ${fullName(s)}`}>
                      <option value="">Wellbeing…</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{WELLBEING[n]}</option>)}
                    </select>
                    <input name={`notes_${s.id}`} className="input !py-2.5" defaultValue={r?.notes ?? ""} placeholder="Notes" aria-label={`Notes for ${fullName(s)}`} />
                  </li>
                );
              })}
            </ul>
          </Card>
          <div className="flex justify-end">
            <SubmitButton pendingText="Saving…">Save weekly report</SubmitButton>
          </div>
        </form>
      )}
    </>
  );
}
