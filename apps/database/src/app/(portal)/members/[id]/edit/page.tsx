import { notFound } from "next/navigation";
import { ButtonLink, PageHeader, Toast } from "@phanet/ui";
import { createClient } from "@phanet/supabase/server";
import { memberName } from "@phanet/supabase/types";
import { getMember, listLeaders } from "@/lib/queries";
import { photoUrl } from "@/lib/photo";
import { MemberForm } from "@/components/MemberForm";
import { updateMemberAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditMemberPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [member, leaders] = await Promise.all([getMember(supabase, id), listLeaders(supabase)]);
  if (!member) notFound();
  const photo = await photoUrl(supabase, member.photo_path);
  return (
    <>
      <PageHeader eyebrow={member.member_code} title={memberName(member)} script="edit" actions={<ButtonLink href={`/members/${id}`} variant="ice" size="sm">← Back to profile</ButtonLink>} />
      <Toast message={sp.error} tone="peach" />
      <MemberForm action={updateMemberAction} leaders={leaders} member={member} photoSrc={photo} />
    </>
  );
}
