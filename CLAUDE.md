# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (lockfile is `pnpm-lock.yaml`).

- `pnpm dev` — run the app locally with Turbopack (Next.js 16)
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint (Next + TypeScript config)
- `pnpm typecheck` — `tsc --noEmit` (strict mode, no test runner in this repo)
- `pnpm format` — Prettier over all `.ts`/`.tsx` (config in `.prettierrc`: no semis, double quotes, 2-space, tailwind plugin)

There are no unit/integration tests configured. Verify changes by running `pnpm typecheck` and `pnpm dev` and exercising the UI.

Adding shadcn components: `npx shadcn@latest add <name>`. Registry config is in `components.json` — the style is `base-vega` with `baseColor: neutral`, RSC enabled, icons from `lucide`. A custom registry `@shadcn-space` is also configured.

## Architecture

Next.js 16 App Router + React 19, Tailwind v4, Supabase (auth + Postgres), TypeScript strict. Path alias `@/*` → repo root.

### Route groups

`app/` uses two route groups that share the root layout (`app/layout.tsx` — theme provider, Sonner toaster, fonts):

- `app/(marketing)/` — public site (`/`, `/contact`). Has its own `layout.tsx`.
- `app/(protected)/` — the internal CRM/dashboard. Every page here assumes an authenticated Supabase user.
- `app/auth/login/` — passwordless email OTP login (uses `input-otp`).

### Auth & session handling

Auth is split across three files that must stay in sync:

1. **`proxy.ts`** (repo root) — Next.js middleware entry point. Note: this project uses `proxy.ts`/`proxy` (not `middleware.ts`/`middleware`) — delegates to `lib/supabase/proxy.ts`. The matcher excludes static assets.
2. **`lib/supabase/proxy.ts`** — runs on every matched request. Refreshes the Supabase session cookies via `@supabase/ssr`, then:
   - redirects unauthenticated users away from paths starting with `PROTECTED_PREFIXES` (currently `["/dashboard"]`) to `/auth/login?next=…`
   - redirects authenticated users away from `/auth/login` to `/dashboard`
   - **Important:** do not add code between `createServerClient(...)` and `supabase.auth.getClaims()` — that pattern is required for cookie refresh to work correctly.
   - When adding new protected route prefixes, update `PROTECTED_PREFIXES` here.
3. **`app/(protected)/layout.tsx`** — defence in depth: re-checks `supabase.auth.getUser()` server-side and redirects if missing, then loads the current user's `profiles.role` to pass `isAdmin` into the sidebar.

Supabase clients are not interchangeable — pick the right one:

- `lib/supabase/client.ts` — browser client (`createBrowserClient`), for client components.
- `lib/supabase/server.ts` — RSC/server-action client (`createServerClient` bound to `next/headers` cookies). Always call `await createClient()` fresh per request (no globals — required for Fluid Compute).
- `lib/supabase/proxy.ts` — middleware-only client with request-scoped cookie plumbing.
- `lib/supabase/admin.ts` — service-role client; marked `"server-only"`. Use for privileged operations (e.g. the admin users page). Never import from client code.

### Environment variables

Expected in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public browser/SSR client
- `SUPABASE_SERVICE_ROLE_KEY` — admin client only
- `NEXT_PUBLIC_CALENDLY_URL`, `NEXT_PUBLIC_CAL_LINK`, `NEXT_PUBLIC_WHATSAPP_DISPLAY`/`NEXT_PUBLIC_WHATSAPP_NUMBER` — marketing-site CTAs; `lib/site.ts` falls back to defaults when missing.

### Database

Schema lives in `supabase/migrations/` — number-prefixed, applied in order. Start with `0001_init_crm.sql` for the base, then read later migrations for additive changes. Generated types live in `lib/supabase/types.ts` — regenerate with Supabase's typegen after schema changes; do not hand-edit.

Schema summary (all `public`):
- **profiles** — extends `auth.users`, holds `role` (`admin`/`editor`/`sales_rep`/`viewer`) and `default_commission_rate`.
- **clients** — lead/client records with `status`, `source`, `assigned_to` → profiles, plus enrichment fields (`lead_score`, etc. — see migrations 0004/0006).
- **projects** — one-time deal/project records with `stage`, `payment_status`, `commission_*`, `stripe_*`, linked to `clients` and `sold_by` → profiles. Migration 0007 adds `product_type` (enum: `business_website`/`mobile_app`/`web_app`/`ai_integration`), `deposit_rate` (default 30), generated `deposit_amount`, and `deposit_paid_at`. A `projects_deposit_gate` trigger blocks the move to `stage='active'` until the deposit is paid for any priced project.
- **subscriptions** — recurring engagements (added in 0002, `sold_by` in 0003). Separate from `projects`; not subject to the deposit gate.
- **payments** — Stripe payment history per project.
- **interactions** — timeline entries (call/email/meeting/etc.) on a client, optionally tied to a project.
- **showcase_projects**, **pitch_slides** — content for the marketing site and the in-app `pitch-mode` presenter.

RLS is enabled; expect policies keyed on role via the `public.auth_role()` SQL function.

### UI conventions

- shadcn/ui components live in `components/ui/`. Prefer editing existing ones over adding new primitives.
- Feature components are grouped by domain: `components/auth`, `components/home`, `components/layout`, `components/dashboard`, `components/actions`, `components/motion`, `components/typography`, `components/providers`.
- Theming: dark mode is the canonical canvas (see `DESIGN.md` — Lamborghini-inspired system: absolute black, zero border-radius, uppercase display type, single accent color for CTAs). `app/layout.tsx` sets `defaultTheme="dark"` on `ThemeProvider`. Tokens live in `app/globals.css` (OKLCH vars, including `--primary`/`--primary-hover` for both light and dark).
- `lib/site.ts` is the single source of truth for site-wide copy, product catalog, nav, and process steps — pull from here instead of hardcoding.
- `lib/status-colors.ts` is the single source of truth for stage/status/payment colors and labels (project stage, derived lead status, payment status). Use `projectStageTone()`, `leadStatusTone()`, `paymentStatusBadgeClass()`, etc. — do not redefine status palettes inline.
- Utility helpers: `cn()` in `lib/utils.ts`; Prettier's Tailwind plugin is configured to treat `cn` and `cva` as class-name functions.

### Styling rules (from `DESIGN.md` and user memory)

- Primary color (`--primary` / `text-primary` / `bg-primary`) is reserved for **actions only** — never apply it to eyebrows, numerals, bullets, or plain text.
- All spacing and sizing lands on a **4px grid**; prefer Tailwind defaults over arbitrary `[Npx]` values.
- For shadcn Button and nav primitives, keep default sizing/spacing/states — only override text styles, and use theme color variants rather than ad-hoc classes.
- `--radius: 0` is intentional — do not add rounded corners to buttons or cards.

Full design reference (palette, typography scale, component specs, responsive behavior): `DESIGN.md`.
