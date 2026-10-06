import { LoginScreen } from "@phanet/ui";
import { magicLinkAction, signInAction, signUpAction } from "@phanet/supabase/actions";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/me";
  return (
    <LoginScreen
      brand={BRAND}
      title="Learn and"
      scriptWord="grow"
      subtitle="PHANET Academy is open to everyone. Create a free account to track your lessons, take quizzes and earn certificates."
      allowSignUp
      next={next}
      signIn={signInAction}
      magicLink={magicLinkAction}
      signUp={signUpAction}
      error={sp.error}
    />
  );
}
