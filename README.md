# PHANET KNUST · phaneteers.com

The main website and seven portals for PHANET KNUST, themed on the 2026/27 word: **Let No Man Despise Thy Youth** (1 Timothy 4:12).

| App | Domain | What it does |
|---|---|---|
| `apps/web` | phaneteers.com | Home, About, Programs, Shop (Paystack), Give (Paystack), link to Academy |
| `apps/academy` | academy.phaneteers.com | Courses on YouTube, quizzes, downloadable certificates, library of books and messages |
| `apps/leaders` | leaders.phaneteers.com | Executives report on their sheep, log and share follow-ups, mark attendance |
| `apps/finance` | finance.phaneteers.com | Budgets per program, inflows, expenses with tiered approval |
| `apps/welfare` | welfare.phaneteers.com | Members "shop" for groceries without login; welfare team manages stock and requests |
| `apps/database` | database.phaneteers.com | All member data with photos, events and attendance (ushers and leaders) |
| `apps/prayerwall` | prayerwall.phaneteers.com | Anonymous prayer topics with a code, testimonies by code |
| `apps/admin` | admin.phaneteers.com | Accounts and portal access, site content, shop, academy content, moderation |

Also in this repo, outside the pnpm workspace: `sites/pastor-eric-birthday` — Pastor Eric's birthday site, a standalone static site on Vercel + Neon. See [its README](sites/pastor-eric-birthday/README.md).

Backend: one Supabase project (Postgres, Auth, Storage) — schema in `supabase/migrations`. Hosting: one Netlify site per app.

- Design system and brand rules: [`docs/design-system.md`](docs/design-system.md)
- Architecture, roles, approval ladder, deployment steps: [`docs/architecture.md`](docs/architecture.md)
- Conventions for building an app in this repo: [`docs/building-an-app.md`](docs/building-an-app.md)

## Quick start
```bash
pnpm install
cp .env.example .env.local        # add your Supabase keys; leave NEXT_PUBLIC_COOKIE_DOMAIN empty locally
for a in apps/*; do ln -sf ../../.env.local "$a/.env.local"; done
pnpm --filter @phanet/web dev     # http://localhost:3000 (other apps on 3001–3007)
```

## First deploy, in order
1. Supabase → SQL editor → run `supabase/migrations/0001…0012` in order, then `supabase/seed.sql` (optional starter content).
2. Supabase → Authentication → add your own user, then run `select public.grant_role_by_email('you@example.com','admin');`.
3. Netlify → one site per app, Base directory `apps/<app>`, env vars from `.env.example`.
4. Paystack → webhook URL `https://phaneteers.com/api/paystack/webhook`.
5. Sign in at admin.phaneteers.com, invite the team and assign portal access.
