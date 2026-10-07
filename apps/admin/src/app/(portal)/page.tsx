import Link from "next/link";
import { Badge, ButtonLink, Card, Label, PageHeader, StatCard } from "@phanet/ui";
import { createClient, type Db } from "@phanet/supabase/server";
import { LINKS, PORTAL_LINKS } from "@/lib/links";
import { hasServiceRole } from "@/lib/admin";

type Countable = PromiseLike<{ count: number | null; error: unknown }>;
async function safeCount(p: Countable) {
  try {
    const { count, error } = await p;
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}
const head = { count: "exact" as const, head: true };

async function loadStats(supabase: Db) {
  const [members, users, pendingExpenses, pendingWelfare, openPrayers, courses, ordersToFulfil, admins, programs, funds, anyCourse] = await Promise.all([
    safeCount(supabase.from("members").select("id", head)),
    safeCount(supabase.from("profiles").select("id", head)),
    safeCount(supabase.from("transactions").select("id", head).eq("kind", "expense").eq("status", "pending")),
    safeCount(supabase.from("welfare_requests").select("id", head).eq("status", "pending")),
    safeCount(supabase.from("prayer_requests").select("id", head).eq("status", "open").eq("is_hidden", false)),
    safeCount(supabase.from("courses").select("id", head).eq("is_published", true)),
    safeCount(supabase.from("orders").select("id", head).eq("status", "paid")),
    safeCount(supabase.from("user_roles").select("user_id", head).eq("role", "admin")),
    safeCount(supabase.from("programs").select("id", head)),
    safeCount(supabase.from("giving_funds").select("id", head)),
    safeCount(supabase.from("courses").select("id", head)),
  ]);
  return { members, users, pendingExpenses, pendingWelfare, openPrayers, courses, ordersToFulfil, admins, programs, funds, anyCourse };
}

export default async function OverviewPage() {
  const supabase = await createClient();
  const s = await loadStats(supabase);
  const checklist = [
    { label: "An administrator account exists", ok: s.admins > 0, href: "/users" },
    { label: "Programs are set up for the main site", ok: s.programs > 0, href: "/programs" },
    { label: "Giving funds are defined", ok: s.funds > 0, href: "/funds" },
    { label: "At least one Academy course", ok: s.anyCourse > 0, href: "/academy" },
    { label: "Service role key configured (invite users)", ok: hasServiceRole(), href: "/users" },
  ];
  const doneCount = checklist.filter((c) => c.ok).length;

  return (
    <>
      <PageHeader eyebrow="Control room" title="Everything in one" script="place" />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Members" value={s.members} sub="in the database" />
        <StatCard label="Accounts" value={s.users} sub="people who can sign in" tone="blue" />
        <StatCard label="Pending expenses" value={s.pendingExpenses} sub="awaiting approval" tone={s.pendingExpenses ? "orange" : "white"} />
        <StatCard label="Welfare requests" value={s.pendingWelfare} sub="pending decision" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open prayers" value={s.openPrayers} sub="on the wall" />
        <StatCard label="Published courses" value={s.courses} sub="in the Academy" />
        <StatCard label="Orders to fulfil" value={s.ordersToFulfil} sub="paid, awaiting pickup" tone={s.ordersToFulfil ? "orange" : "white"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Label tone="orange">Portals</Label>
            <Badge tone="good">{PORTAL_LINKS.length} apps</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PORTAL_LINKS.map((p) => (
              <a key={p.key} href={LINKS[p.key]} target="_blank" rel="noreferrer" className="option-row no-underline flex items-center gap-3">
                <div className="min-w-0">
                  <div className="font-bold">{p.label}</div>
                  <div className="text-xs text-muted truncate">{p.blurb}</div>
                  <div className="text-[11px] text-royal truncate">{LINKS[p.key].replace(/^https?:\/\//, "")}</div>
                </div>
                <span className="ml-auto text-royal">↗</span>
              </a>
            ))}
          </div>
        </Card>

        <Card tone="blue" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label tone="peach">Getting started</Label>
            <Badge tone="glass">{doneCount}/{checklist.length}</Badge>
          </div>
          <ul className="flex flex-col gap-2.5">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 inline-grid place-items-center w-5 h-5 rounded-full text-[11px] font-bold ${c.ok ? "bg-white text-royal" : "bg-white/20 text-white"}`}>{c.ok ? "✓" : "·"}</span>
                <Link href={c.href} className="text-white/90 hover:text-white">{c.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-2">
            <ButtonLink href="/users?invite=1#invite" variant="white" size="sm">Invite someone</ButtonLink>
            <ButtonLink href="/site" variant="ghost" size="sm">Edit site text</ButtonLink>
          </div>
        </Card>
      </div>
    </>
  );
}
