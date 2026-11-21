# Ksheera storefront

Next.js storefront for an A2 dairy brand. Customers browse products and send an
order request (no online payment in v1); the owner confirms each order on
WhatsApp and tracks it in a private orders dashboard. The full requirements are
in the PRD.

**Status:** phases 1 (foundation) and 2 (storefront) of 5. The order details
form and order request action arrive in phase 3; `/order` shows the cart until
then.

## Stack

- Next.js 16 (App Router, Cache Components), React 19, TypeScript (strict)
- Tailwind CSS 4 with palette tokens
- Supabase: Postgres with row-level security, Auth, Storage (Mumbai region)
- Zod, Vitest, ESLint, Prettier; GitHub Actions CI; Vercel hosting

## Getting started

Requires Node 22+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The site runs without Supabase. Set `DEMO_CONTENT=true` in `.env.local` to see
sample products, banners and reviews (the same as `supabase/seed.sql`). To load real
data, create a Supabase project, apply the migration and seed, and fill in the
Supabase values in `.env.local`:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Or run Supabase locally with Docker: `npx supabase start` (applies migrations
and seed automatically).

## Scripts

| Command           | What it does                                                       |
| ----------------- | ------------------------------------------------------------------ |
| `npm run dev`     | Start the dev server                                               |
| `npm run build`   | Production build                                                   |
| `npm run check`   | Lint, type-check, unit tests and format check (what CI runs)       |
| `npm test`        | Unit tests (Vitest), including WCAG contrast checks for palettes   |
| `npm run test:db` | Apply migrations and seed to a scratch database, test access rules |
| `npm run format`  | Format with Prettier                                               |

`npm run test:db` needs `DATABASE_URL` pointing at any Postgres 15+ server you
can create databases on. It drops and recreates `ksheera_test`.

## Colour palettes

All colours live in `src/theme/palettes.ts`; components use semantic Tailwind
classes (`bg-primary`, `text-on-primary`, `text-muted`, `border-line`…). A lint
rule rejects hex colours anywhere else, so every palette applies site-wide.

- **Live palette:** the `palette` row in the `settings` table, falling back to
  `DEFAULT_PALETTE`, then `peacock-brass`. Changing the row takes effect within
  5 minutes, or immediately after `POST /api/revalidate` with `{"tag":"settings"}`.
- **Preview:** with `NEXT_PUBLIC_ALLOW_PALETTE_PREVIEW=true`, add
  `?palette=indigo-saffron` to any URL or use the picker in the corner. Keep it
  off in production.
- **Add a palette:** add an entry to `palettes.ts`. The unit tests fail if any
  text colour pairing is below WCAG AA (4.5:1).

## Data and access

Schema: `supabase/migrations/`. Money is stored in paise (integers).

| Who                   | Can                                                                    |
| --------------------- | ---------------------------------------------------------------------- |
| Visitors (`anon`)     | Read active products, live banners, published reviews, public settings |
| Server (service role) | Insert orders (the order request action is the only path)              |
| Owner                 | Read orders; change status, payment, cancel reason and owner note      |
| Dev team              | Everything else, through Supabase Studio with the service role         |

Order statuses can only move forward: new → confirmed → out for delivery →
delivered, and new or confirmed → cancelled (a reason is required). Every
change is written to `order_events` automatically.

**Create an owner login:** add the user in Supabase Studio (Authentication →
Users), then in the SQL editor:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"owner"}'
where email = 'owner@example.com';
```

## Refreshing cached content

Public pages are cached and refresh every 5 minutes. To refresh at once after
editing data:

```bash
curl -X POST "$SITE_URL/api/revalidate" \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tag":"catalog"}'   # or settings, banners, reviews
```

## Deploying

Connect the repository to Vercel. Set the environment variables from
`.env.example` for Production and Preview (enable the palette preview on
Preview only). `main` deploys to production; every pull request gets a preview
URL.
