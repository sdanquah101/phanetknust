import Link from "next/link";
import { Avatar, Blobs, ButtonLink, Footer, PublicHeader, StageDisc, type NavItem } from "@phanet/ui";
import { getSession, type Session } from "@phanet/supabase/server";
import { BRAND } from "@/lib/brand";

export const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/library", label: "Library" },
  { href: "/me", label: "My learning" },
];

export async function safeSession(): Promise<Session | null> {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

export function HeaderCta({ session, next = "/me" }: { session: Session | null; next?: string }) {
  if (!session) return <ButtonLink href={`/login?next=${encodeURIComponent(next)}`} variant="white" size="sm">Sign in</ButtonLink>;
  const name = session.profile?.full_name ?? session.user.email ?? "You";
  return (
    <Link href="/me" className="inline-flex items-center gap-2 no-underline text-white">
      <Avatar name={name} src={session.profile?.avatar_url} peach />
      <span className="hidden sm:inline text-sm font-bold">My learning</span>
    </Link>
  );
}

export function SiteFooter() {
  return (
    <Footer
      brand={BRAND}
      links={[
        { href: "/courses", label: "Courses" },
        { href: "/library", label: "Library" },
        { href: "https://phaneteers.com", label: "phaneteers.com" },
      ]}
      note="PHANET KNUST · Let No Man Despise Thy Youth"
    />
  );
}

/**
 * Public page frame: blue ground with header + hero slot, orange stage-lip, then ice content.
 * `lipChildren` sits on the orange lip (e.g. the 3-step strip on the home page).
 */
export async function SiteShell({
  hero, children, next, lipChildren, heroClassName = "py-10 md:py-14",
}: {
  hero: React.ReactNode; children: React.ReactNode; next?: string; lipChildren?: React.ReactNode; heroClassName?: string;
}) {
  const session = await safeSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <section className="ground-blue">
        <Blobs />
        <PublicHeader brand={BRAND} items={NAV} cta={<HeaderCta session={session} next={next} />} />
        <div className={`container-page relative ${heroClassName}`}>{hero}</div>
      </section>
      <div className="relative">
        <StageDisc className="mt-8" />
        {lipChildren && <div className="container-page relative z-10 -mt-24 md:-mt-28">{lipChildren}</div>}
      </div>
      <main className="ground-ice flex-1 pb-16">
        <div className="container-page">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
