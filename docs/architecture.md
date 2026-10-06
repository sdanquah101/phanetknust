# Architecture

One pnpm/Turborepo monorepo. One Supabase project. One Netlify site per subdomain.

| app | domain | audience | auth |
|---|---|---|---|
| `apps/web` | phaneteers.com | public | none (Paystack for Give/Shop) |
| `apps/academy` | academy.phaneteers.com | public, self sign‑up | Supabase email/password + magic link |
| `apps/leaders` | leaders.phaneteers.com | executives | role `leader` |
| `apps/finance` | finance.phaneteers.com | finance team | roles `finance`, `finance_head`, `cec_chair`, `pastor` |
| `apps/welfare` | welfare.phaneteers.com | members shop without login; team at `/team` | role `welfare` for `/team` |
| `apps/database` | database.phaneteers.com | admin‑granted | role `database`; `/attendance` also `usher`, `leader` |
| `apps/prayerwall` | prayerwall.phaneteers.com | public, anonymous | none |
| `apps/admin` | admin.phaneteers.com | admin | role `admin` |

`admin` is always allowed everywhere. Sessions share one cookie on `.phaneteers.com` (`NEXT_PUBLIC_COOKIE_DOMAIN`), so a leader who is also on finance signs in once.

## Packages
- `@phanet/ui` — design system (see design-system.md).
- `@phanet/supabase`
  - `server` → `createClient()` (RLS, request cookies), `createAdminClient()` (service role), `getSession()`, `requireRoles(roles)`, `requireUser()`
  - `client` → browser client
  - `middleware` → `updateSession(request, { protect, publicPaths })`
  - `actions` → `signInAction`, `magicLinkAction`, `signUpAction`, `signOutAction`
  - `callback` → `handleAuthCallback` for `/auth/callback`
  - `roles` → `ROLES`, `PORTAL_ROLES`, `requiredApproverRole(amount)`, `canAccess`
  - `format` → `money`, `fmtDate`, `fmtDateTime`, `greeting`, `todayLabel`, `slugify`, `startOfWeek`, `pct`
  - `paystack` → `initializeTransaction`, `verifyTransaction`, `verifyWebhookSignature`, `ledgerChannel`
  - `email` → `sendEmail` (Resend; no‑op without key)
  - `types` → row types for every table + `youtubeId()`

## Conventions
- App Router, server components by default. Mutations are **server actions** in `src/app/**/actions.ts` (`"use server"`), using `createClient()` then `revalidatePath()`.
- Gate a portal in its `layout.tsx`: `const session = await requireRoles(PORTAL_ROLES.finance)`.
- Data access goes through RLS. Only webhooks and admin user management use `createAdminClient()`.
- Money is stored in GH₵ as `numeric(12,2)`; Paystack amounts are pesewas (×100) — the helper converts.
- Tables and functions are documented in `supabase/migrations/*.sql`. Business rules that must not be bypassed live in SQL functions (`decide_expense`, `submit_welfare_request`, `submit_quiz_attempt`, `submit_testimony`, `create_order`).

## Expense approval ladder (finance)
| amount | approver role |
|---|---|
| < GH₵ 2,000 | `finance_head` |
| GH₵ 2,000 – 4,999.99 | `cec_chair` |
| ≥ GH₵ 5,000 | `pastor` (Ps. Stefan) |

Computed in `required_approver_role()` and stored on each expense as `approver_role`; `decide_expense()` refuses anyone else (admin excepted).

## Deploying
1. Create a Supabase project; run `supabase/migrations/*.sql` in order, then optionally `supabase/seed.sql`.
2. Create your own account (Authentication → Users), then run `select public.grant_role_by_email('you@example.com','admin');`.
3. For each app create a Netlify site from this repo with **Base directory** `apps/<app>`; the `netlify.toml` in that folder sets the build. Add the env vars from `.env.example`.
4. Point DNS: `phaneteers.com` → web, `academy.` → academy, etc.
5. Paystack: set the webhook URL to `https://phaneteers.com/api/paystack/webhook`.

## Local development
```
cp .env.example .env.local   # fill in Supabase keys; leave NEXT_PUBLIC_COOKIE_DOMAIN empty
pnpm install
pnpm --filter @phanet/web dev   # 3000; academy 3001, leaders 3002, finance 3003, welfare 3004, database 3005, prayerwall 3006, admin 3007
```
Each app reads `.env.local` from its own folder; symlink the root one: `ln -s ../../.env.local apps/web/.env.local`.
