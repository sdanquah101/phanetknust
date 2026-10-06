import { Card, EmptyState, PageHeader, Toast } from "@phanet/ui";
import { getLeaderContext, listMySheep } from "@/lib/queries";
import { NotLinked } from "@/components/bits";
import { FollowupForm } from "@/components/followup-form";
import { createFollowupAction } from "../actions";

export default async function NewFollowupPage({ searchParams }: { searchParams: Promise<{ sheep?: string; ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const { leaderMemberId, supabase } = await getLeaderContext();
  if (!leaderMemberId) {
    return (
      <>
        <PageHeader eyebrow="Follow-ups" title="Log a" script="follow-up" />
        <NotLinked />
      </>
    );
  }
  const sheep = await listMySheep(supabase, leaderMemberId);
  const preselected = sheep.some((s) => s.id === sp.sheep) ? sp.sheep : undefined;
  const back = preselected ? `/followups/new?sheep=${preselected}` : "/followups/new";

  return (
    <>
      <PageHeader eyebrow="Follow-ups" title="Log a" script="follow-up" />
      <Toast message={sp.ok} tone="mint" />
      <Toast message={sp.error} tone="peach" />
      {sheep.length === 0 ? (
        <EmptyState title="No sheep assigned yet" body="Ask the admin to assign members to you before logging follow-ups." />
      ) : (
        <Card>
          <FollowupForm action={createFollowupAction} sheep={sheep} sheepId={preselected} back={back} submitLabel="Log follow-up" />
        </Card>
      )}
    </>
  );
}
