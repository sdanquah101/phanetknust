import { NoAccess } from "@phanet/ui";
import { signOutAction } from "@phanet/supabase/actions";
import { BRAND } from "@/lib/brand";

export default function NoAccessPage() {
  return <NoAccess brand={BRAND} signOut={signOutAction} />;
}
