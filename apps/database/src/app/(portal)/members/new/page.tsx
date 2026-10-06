import { PageHeader, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { listLeaders } from "@/lib/queries";
import { MemberForm } from "@/components/MemberForm";
import { createMemberAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewMemberPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const leaders = await listLeaders(supabase);
  return (
    <>
      <PageHeader eyebrow="Members" title="Add a" script="member" />
      <Toast message={sp.error} tone="peach" />
      <MemberForm action={createMemberAction} leaders={leaders} />
    </>
  );
}
