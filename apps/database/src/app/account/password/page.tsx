import { SetPasswordScreen } from "@phanet/ui";
import { updatePasswordAction } from "@phanet/supabase/actions";
import { requireUser } from "@phanet/supabase/server";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const session = await requireUser({ next: "/account/password" });
  return <SetPasswordScreen brand={BRAND} action={updatePasswordAction} next="/" email={session.user.email} />;
}
