# Building an app in this repo (read fully before coding)

You are implementing ONE app under `apps/<app>`. Work only inside that folder.

## Read first
1. `docs/design-system.md` — the look. Follow it exactly.
2. `docs/architecture.md` — packages, conventions, roles.
3. `packages/ui/src/theme.css`, `packages/ui/src/components/*.tsx` — the real class names and component props.
4. `packages/supabase/src/*.ts` — the helpers you call.
5. The migration files in `supabase/migrations/` for your domain — table/column names, RLS, and the SQL functions (RPC) you must use for business rules.
6. `apps/web/src/app/*` if it exists — reference for page style.

## Hard rules
- Do NOT edit anything in `packages/`, `supabase/`, `docs/`, root config, or other apps. If you truly need a schema change or a shared helper, write it down in your final report; do not do it. (Exception: you may add ONE new file `supabase/migrations/00XX_<app>_extra.sql` using the next free number ≥ 0010 if an app cannot work without a new SQL function. Prefer not to.)
- Do NOT add npm dependencies. Do NOT run `pnpm install`. (Academy already has `pdf-lib`.)
- Do NOT commit or push. The coordinator commits.
- The app must build: run `cd /home/user/phanetknust && pnpm --filter @phanet/<app> build` and fix every error (types, lint, prerender). A failing build means the work is not done. Mark pages that read cookies/DB as dynamic (they already are via `cookies()`; if a public page uses `createClient()` add `export const dynamic = "force-dynamic";` when prerender complains).
- Env vars may be absent at build time. Never throw at module scope; `createClient()` tolerates missing env (it falls back to a localhost URL); network failures should render empty states, not crash. Wrap top-level data loads in try/catch where a page is public and prerendered.
- TypeScript strict. Cast Supabase rows to the types in `@phanet/supabase/types` (e.g. `(data ?? []) as Transaction[]`). Never use `any` except with an eslint-disable line.
- Use **server components + server actions** (`"use server"` files named `actions.ts` next to the route). Forms: `<form action={serverAction}>` with hidden inputs; show feedback via `redirect()` with `?ok=` / `?error=` search params and `<Toast>`/`<Notice>`. Client components only for interactivity (baskets, toggles, pickers, search-as-you-type).
- Validate inputs in actions (trim, required, numeric). Read numbers with `Number(formData.get("amount"))`.
- Mutations go through RLS with `createClient()` from `@phanet/supabase/server`. Only the admin app and webhooks use `createAdminClient()`.
- Every protected app: `layout.tsx` inside a route group `(portal)` calls `requireRoles([...])` and renders `<PortalShell>`; `/login`, `/no-access`, `/auth/callback` stay outside the group. Sign-out button in the sidebar footer: `<form action={signOutAction}><button className="btn btn-ghost btn-sm">Sign out</button></form>`.
- Portal pages: `<PageHeader eyebrow="..." title="..." script="word" actions={...} />` then cards. Stat rows: `grid gap-4 md:grid-cols-3/4` of `<StatCard>` (at most one `tone="orange"`, one `tone="blue"` per row).
- Public pages: `.ground-blue` sections with `<Blobs/>`, `<PublicHeader>`, headline with `.h3d` + one `<Script peach>` word, orange CTA, then `.stage-lip` divider into white/ice content.
- Mobile first: everything must work at 390px (stack grids, `container-page` gutters, `<TabBar>` for portals via `mobileItems`).
- Empty states everywhere (`<EmptyState>`), loading is fine without skeletons.
- Keep copy short and warm, second person. Use `money()`, `fmtDate()`, `fmtDateTime()`.
- Accessibility: labels on inputs (`<Field label>`), `aria-current` is handled by nav components, buttons have text.
- Images: use plain `<img>` for Supabase storage/public URLs (eslint `@next/next/no-img-element` — add `{/* eslint-disable-next-line @next/next/no-img-element */}` or configure). Use `youtubeId()` for embeds: `<iframe src={`https://www.youtube.com/embed/${id}`} ... allowFullScreen />` inside an `aspect-video rounded-card overflow-hidden` box.
- Storage uploads from server actions: `supabase.storage.from(bucket).upload(path, file, { upsert: true })`; public URL via `.getPublicUrl(path).data.publicUrl`; private bucket (`member-photos`) via `.createSignedUrl(path, 3600)`.
- Searching members from staff apps: `supabase.rpc("search_members", { q, lim: 20 })` → `MemberSearchRow[]`.
- File naming: `src/app/(portal)/page.tsx`, `src/app/(portal)/<section>/page.tsx`, `src/app/(portal)/<section>/actions.ts`, shared bits in `src/components/`, data loaders in `src/lib/queries.ts`.

## Finishing
- `pnpm --filter @phanet/<app> build` passes with zero errors.
- Report: routes built, server actions, RPCs used, anything you could not do, any shared change you need.
