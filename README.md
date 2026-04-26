# Vetd

Digital products that grow businesses.

Vetd is the marketing site and internal CRM for the studio — lead capture, deal pipeline, recurring subscriptions, and sales-rep commissions, all in one Next.js app.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind v4** + **shadcn/ui** (`base-vega` style, neutral palette)
- **Supabase** — auth (email OTP) + Postgres + RLS
- **Stripe** — hosted Checkout + webhook-driven subscription billing
- **TypeScript** strict, `pnpm` workspace
- i18n via `next-intl` (English + Spanish)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

Open http://localhost:3000.

### Environment variables

Required for local dev:

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser/SSR key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin client |
| `STRIPE_SECRET_KEY` | Stripe Node SDK (`sk_test_…` locally) |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` or Stripe dashboard |
| `STRIPE_PRICE_ID_PRESENCE` | Price ID for the Presence plan |
| `STRIPE_PRICE_ID_GROWTH` | Price ID for the Growth plan |

See `CLAUDE.md` for the full list including live-mode swaps.

## Commands

```bash
pnpm dev         # Next dev server (Turbopack)
pnpm build       # Production build
pnpm start       # Serve the production build
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit (strict)
pnpm format      # Prettier (no semis, double quotes, Tailwind plugin)
```

There is no test runner — verify changes with `pnpm typecheck` and `pnpm dev`.

## Architecture

Two route groups share the root layout:

- `app/(marketing)/` — public site
- `app/(protected)/` — authenticated CRM dashboard

Auth spans three files that must stay in sync: `proxy.ts` (middleware entry), `lib/supabase/proxy.ts` (session refresh + redirects), and `app/(protected)/layout.tsx` (server-side defence in depth). Protected path prefixes live in `PROTECTED_PREFIXES` inside `lib/supabase/proxy.ts`.

Supabase clients are not interchangeable — pick the right one for the surface:

| Client | Use in |
| --- | --- |
| `lib/supabase/client.ts` | Browser / client components |
| `lib/supabase/server.ts` | RSC + server actions |
| `lib/supabase/proxy.ts` | Middleware only |
| `lib/supabase/admin.ts` | Privileged server code (service role) |

## Database

Migrations live in `supabase/migrations/`, numbered and applied in order. Generated types in `lib/supabase/types.ts` — regenerate with Supabase typegen after schema changes, don't hand-edit.

Core tables: `profiles`, `clients`, `projects`, `subscriptions`, `subscription_invoices`, `subscription_commission_ledger`, `processed_stripe_events`, `payments`, `interactions`, `showcase_projects`. RLS is enabled on all of them, keyed on role via the `public.auth_role()` SQL function.

## Design system

Dark mode is the canonical canvas: absolute black, zero border-radius, uppercase display type, single accent color reserved for CTAs. All spacing lands on a 4px grid. Full reference in [`docs/DESIGN.md`](docs/DESIGN.md).

Site-wide copy, nav, and product catalog: `lib/site.ts` (single source of truth — pull from here instead of hardcoding).

Status and stage palettes: `lib/status-colors.ts` — use the tone helpers, don't redefine inline.

## Adding shadcn components

```bash
npx shadcn@latest add <name>
```

Config is in `components.json`. A custom registry `@shadcn-space` is also wired up.
