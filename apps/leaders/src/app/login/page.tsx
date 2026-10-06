import { LoginScreen } from "@phanet/ui";
import { magicLinkAction, signInAction } from "@phanet/supabase/actions";
import { BRAND } from "@/lib/brand";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <LoginScreen
      brand={BRAND}
      title="Welcome"
      scriptWord="back"
      subtitle="PHANET Leaders' Portal. Sign in with the account the PHANET admin set up for you."
      next={sp.next ?? "/"}
      signIn={signInAction}
      magicLink={magicLinkAction}
      error={sp.error}
    />
  );
}
