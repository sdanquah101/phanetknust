import Link from "next/link";
import { Avatar, Card, EmptyState, Notice, PageHeader, Table } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { listLeaders, sheepCounts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LeadersPage() {
  const supabase = await createClient();
  const [leaders, counts] = await Promise.all([listLeaders(supabase), sheepCounts(supabase)]);
  const assigned = [...counts.values()].reduce((a, b) => a + b, 0);
  const knownLeaderIds = new Set(leaders.map((l) => l.id));
  const orphaned = [...counts.entries()].filter(([id]) => !knownLeaderIds.has(id)).reduce((a, [, n]) => a + n, 0);

  return (
    <>
      <PageHeader eyebrow={`${leaders.length} leaders · ${assigned} sheep assigned`} title="Leaders" script="shepherds" />
      <Notice tone="ice">A leader is a member whose linked login account holds the <b>leader</b> role (granted by the admin). Link accounts from a member's profile.</Notice>
      {orphaned > 0 && <Notice tone="peach">{orphaned} member{orphaned === 1 ? " is" : "s are"} assigned to someone who no longer holds the leader role. Reassign them from the members list.</Notice>}
      {leaders.length === 0 ? (
        <EmptyState title="No leaders yet" body="Ask the admin to grant the leader role, then link each leader's login account to their member record." />
      ) : (
        <Card className="!p-4 md:!p-6">
          <Table>
            <thead><tr><th>Leader</th><th>Code</th><th>Department</th><th>Sheep</th><th></th></tr></thead>
            <tbody>
              {leaders.map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/leaders/${l.id}`} className="flex items-center gap-3 font-bold"><Avatar name={l.full_name} />{l.full_name}</Link></td>
                  <td className="font-mono text-xs">{l.member_code}</td>
                  <td className="text-muted">{l.department ?? "—"}</td>
                  <td className="font-bold">{counts.get(l.id) ?? 0}</td>
                  <td className="text-right"><Link href={`/leaders/${l.id}`} className="btn btn-ice btn-sm">Manage</Link></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
