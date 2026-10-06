import Link from "next/link";
import { ButtonLink, Card, EmptyState, Input, PageHeader, Select, Table, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { memberName } from "@phanet/supabase/types";
import { leaderMap, listHalls, listMembers } from "@/lib/queries";
import { photoUrls } from "@/lib/photo";
import { STATUSES, YEARS } from "@/lib/constants";
import { MemberAvatar, Pagination, StatusBadge } from "@/components/bits";

export const dynamic = "force-dynamic";

type SP = { q?: string; status?: string; hall?: string; year?: string; leader?: string; page?: string; ok?: string; error?: string };

export default async function MembersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, leaders, halls] = await Promise.all([
    listMembers(supabase, { q: sp.q, status: sp.status, hall: sp.hall, year: sp.year, leader: sp.leader, page }),
    leaderMap(supabase),
    listHalls(supabase),
  ]);
  const photos = await photoUrls(supabase, result.rows.map((m) => m.photo_path));
  const filtering = Boolean(sp.q || sp.status || sp.hall || sp.year || sp.leader);

  const make = (p: number) => {
    const params = new URLSearchParams();
    for (const k of ["q", "status", "hall", "year", "leader"] as const) if (sp[k]) params.set(k, sp[k]!);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/members${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow={`${result.total} on record`}
        title="Members"
        script="family"
        actions={
          <>
            <a href="/api/members.csv" className="btn btn-ice btn-sm">Export CSV</a>
            <ButtonLink href="/members/new" size="sm">+ Add member</ButtonLink>
          </>
        }
      />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />

      <Card className="!p-4">
        <form method="get" className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-end">
          <label className="field"><span className="field-label">Search</span><Input name="q" defaultValue={sp.q ?? ""} placeholder="Name, code or phone" /></label>
          <label className="field"><span className="field-label">Status</span>
            <Select name="status" defaultValue={sp.status ?? ""}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
          </label>
          <label className="field"><span className="field-label">Hall</span>
            <Select name="hall" defaultValue={sp.hall ?? ""}><option value="">All</option>{halls.map((h) => <option key={h} value={h}>{h}</option>)}</Select>
          </label>
          <label className="field"><span className="field-label">Year</span>
            <Select name="year" defaultValue={sp.year ?? ""}><option value="">All</option>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</Select>
          </label>
          <label className="field"><span className="field-label">Leader</span>
            <Select name="leader" defaultValue={sp.leader ?? ""}>
              <option value="">All</option>
              <option value="none">Unassigned</option>
              {[...leaders.values()].map((l) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
            </Select>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-blue btn-sm">Filter</button>
            {filtering && <Link href="/members" className="btn btn-ice btn-sm">Clear</Link>}
          </div>
        </form>
      </Card>

      {result.error ? (
        <EmptyState title="Couldn't load members" body={result.error} />
      ) : result.rows.length === 0 ? (
        <EmptyState
          title={filtering ? "No one matches those filters" : "No members yet"}
          body={filtering ? "Try a shorter search or clear the filters." : "Add your first member or import a CSV to get started."}
          action={filtering ? <Link href="/members" className="btn btn-ice btn-sm">Clear filters</Link> : <ButtonLink href="/members/new" size="sm">+ Add member</ButtonLink>}
        />
      ) : (
        <Card className="!p-4 md:!p-6 flex flex-col gap-4">
          <Table>
            <thead>
              <tr>
                <th>Member</th><th>Code</th><th>Programme</th><th>Hall</th><th>Phone</th><th>Leader</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((m) => {
                const name = memberName(m);
                const leader = m.leader_id ? leaders.get(m.leader_id) : undefined;
                return (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/members/${m.id}`} className="flex items-center gap-3 font-bold">
                        <MemberAvatar name={name} src={m.photo_path ? photos.get(m.photo_path) : null} />
                        <span className="truncate max-w-[180px]">{name}</span>
                      </Link>
                    </td>
                    <td className="font-mono text-xs">{m.member_code}</td>
                    <td className="text-muted">{m.programme ?? "—"}{m.year_of_study ? ` · ${m.year_of_study}` : ""}</td>
                    <td className="text-muted">{m.hall ?? "—"}{m.room ? ` · ${m.room}` : ""}</td>
                    <td>{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : <span className="text-muted">—</span>}</td>
                    <td>{leader ? <Link href={`/leaders/${leader.id}`} className="text-royal font-semibold">{leader.full_name}</Link> : <span className="text-muted">—</span>}</td>
                    <td><StatusBadge status={m.membership_status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={result.page} pages={result.pages} total={result.total} make={make} />
        </Card>
      )}
    </>
  );
}
