import { LoginScreen } from "@phanet/ui";
import { magicLinkAction, signInAction } from "@phanet/supabase/actions";
import { BRAND } from "@/lib/brand";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <LoginScreen
      brand={BRAND}
      title="Welfare"
      scriptWord="team"
      subtitle="Sign in to add stock and get requests ready for pickup. Members don't need an account to shop."
      next={sp.next ?? "/team"}
      signIn={signInAction}
      magicLink={magicLinkAction}
      error={sp.error}
    />
  );
}
