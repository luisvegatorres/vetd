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
- `STRIPE_SECRET_KEY` (`sk_test_...` / `sk_live_...`) — server-only Stripe Node SDK client; used by `lib/stripe/server.ts`, the checkout server action, and the webhook route. **Do not expose to the client.**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_...` / `pk_live_...`) — public; only needed if/when we use Stripe Elements. Hosted Checkout (current flow) does not require it.
- `STRIPE_WEBHOOK_SECRET` (`whsec_...`) — signing secret for `app/api/webhooks/stripe/route.ts`. Get from Stripe Dashboard → Developers → Webhooks for production, or from `stripe listen --forward-to localhost:3000/api/webhooks/stripe` for local dev.
- `STRIPE_PRICE_ID_PRESENCE`, `STRIPE_PRICE_ID_GROWTH` — Stripe Price IDs for the two recurring plans. Test mode and live mode have separate IDs; swap these env vars when deploying. Sourced by `lib/site.ts` `subscriptionPlans` and used by the checkout flow + webhook to map Stripe events back to the right CRM plan.
- `GMAIL_SMTP_HOST` — SMTP host for Google Workspace relay (`smtp-relay.gmail.com`). Used by `lib/email/client.ts` (server-only).
- `GMAIL_SMTP_PORT` — SMTP port (`587`). Optional; defaults to `587`.
- `GMAIL_SMTP_USER` — Google Workspace user that authenticates the SMTP relay (e.g. `no-reply@vetd.agency`). Must have an app password (2FA-enforced account).
- `GMAIL_SMTP_PASSWORD` — Google app password for `GMAIL_SMTP_USER`. **Server-only**, never expose to the client. Generate from Google Account → Security → 2-Step Verification → App passwords.
- `LEADS_NOTIFICATION_EMAIL` — inbox that receives contact-form notifications (defaults to `leads@vetd.agency`). Set to your preferred Workspace alias or group.
- `GEMINI_API_KEY` — server-only Google Gemini API key (from Google AI Studio). Used by `lib/gemini/client.ts` to power AI generation helpers. Never expose to the client; access is gated to admin/editor roles via `requireGeminiAccess()` in `lib/gemini/auth.ts`. Default model is `gemini-3.1-flash-lite-preview`.
- `INSTAGRAM_APP_ID` — server-only. The **Instagram App ID** surfaced under Meta dashboard → Instagram → API setup with Instagram Login. Note: this is NOT the top-level Meta App ID; using the wrong one causes `Invalid platform app` from `instagram.com/oauth/authorize`. Used by `lib/instagram/config.ts` to build the OAuth flow at `/api/instagram/oauth/start`.
- `INSTAGRAM_APP_SECRET` — server-only Instagram App Secret matching `INSTAGRAM_APP_ID`. Used in the code-for-token and token-refresh exchanges in `lib/instagram/oauth.ts`. Never expose to the client.
- `X_CLIENT_ID` — server-only OAuth 2.0 Client ID from the X Developer Console. Used by `lib/x/config.ts` to build the OAuth flow at `/api/x/oauth/start`.
- `X_CLIENT_SECRET` — server-only OAuth 2.0 Client Secret from the X Developer Console. Used for the code-for-token and refresh-token exchanges in `lib/x/oauth.ts`. Never expose to the client.
- `CRON_SECRET` — shared secret for Vercel Cron auth. `/api/cron/sync-google`, `/api/cron/blog`, `/api/cron/refresh-instagram`, and `/api/cron/refresh-x` verify `Authorization: Bearer ${CRON_SECRET}`. Vercel Cron sends this header automatically when the env var is set on the project. Generate any high-entropy string.
- `BLOG_AUTO_PUBLISH` — `"true"` or unset. When `"true"`, the weekday blog cron (`/api/cron/blog`, Mon-Fri 14:00 UTC) inserts generated posts as `status='scheduled'` with `published_at = now() + 24h` (so untouched drafts go live the next morning). Default (unset) inserts as `status='draft'` requiring manual publish. The admin "Generate with AI" button always inserts as a draft regardless of this flag.

**Not in `.env.local`:** Supabase Auth custom SMTP (configured in Supabase dashboard → Auth → Emails → SMTP Settings; point it at the same Gmail SMTP relay). Google OAuth Client ID + Secret for "Sign in with Google" live in Supabase dashboard → Auth → Providers → Google — use a dedicated OAuth client from Google Cloud Console, separate from the one used by `app/api/google/oauth/*` (which handles per-user Calendar/Gmail sync, not login).

### Database

Schema lives in `supabase/migrations/` — number-prefixed, applied in order. Start with `0001_init_crm.sql` for the base, then read later migrations for additive changes. Generated types live in `lib/supabase/types.ts` — regenerate with Supabase's typegen after schema changes; do not hand-edit.

Schema summary (all `public`):

- **profiles** — extends `auth.users`, holds `role` (`admin`/`editor`/`sales_rep`/`viewer`), `default_commission_rate` (default 10 as of 0012), and `employment_status` (`active`/`terminated`, added in 0012). Residual commissions stop the moment a rep flips to `terminated`.
- **clients** — lead/client records with `status`, `source`, `assigned_to` → profiles, plus enrichment fields (`lead_score`, etc. — see migrations 0004/0006).
- **projects** — one-time deal/project records with `stage`, `payment_status`, `commission_*`, `stripe_*`, linked to `clients` and `sold_by` → profiles. Migration 0007 adds `product_type` (enum: `business_website`/`mobile_app`/`web_app`/`ai_integration`), `deposit_rate` (default 30), generated `deposit_amount`, and `deposit_paid_at`. A `projects_deposit_gate` trigger blocks the move to `stage='active'` until the deposit is paid for any priced project.
- **subscriptions** — recurring engagements (added in 0002, `sold_by` in 0003). Migration 0012 adds `signing_bonus_amount`, `monthly_residual_amount`, `first_payment_at`. Migration 0013 adds Stripe identifiers (`stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`, `stripe_status`). Separate from `projects`; not subject to the deposit gate.
- **subscription_invoices** — recurring billing audit log (added in 0013). One row per Stripe invoice; `billing_reason` distinguishes first invoice (signing bonus trigger) from recurring (monthly residual trigger).
- **subscription_commission_ledger** — per-payout ledger for sales rep residuals (added in 0012). One row per `(subscription_id, kind, period_month)`; `kind` is `signing_bonus` or `monthly_residual`. Webhook generates rows; admin marks them `paid`.
- **processed_stripe_events** — webhook idempotency log keyed on Stripe event ID (added in 0013). Insert before processing; `ON CONFLICT DO NOTHING` skips duplicates.
- **payments** — Stripe payment history per project (one-time payments only; subscription invoices live in `subscription_invoices`).
- **interactions** — timeline entries (call/email/meeting/etc.) on a client, optionally tied to a project.
- **showcase_projects** — portfolio content for the marketing site (and any future public `/work` page). (`pitch_slides` was dropped in 0026 when Pitch Mode was removed.)
- **app_integrations** — org-wide third-party OAuth connections (added in 0045). One row per `provider` (e.g., `instagram`, `x`); stores `access_token`, optional `refresh_token`, `token_expires_at`, and `scopes`. Tokens are written by service-role only (OAuth callback, refresh cron, admin disconnect action) and read by the admin integrations UI via column-restricted SELECTs. Distinct from `rep_integrations` (per-rep, e.g. Google Workspace). Instagram refreshes weekly when within 7 days of expiry; X refreshes hourly because OAuth 2.0 access tokens are short-lived.

RLS is enabled; expect policies keyed on role via the `public.auth_role()` SQL function.

### UI conventions

- shadcn/ui components live in `components/ui/`. Prefer editing existing ones over adding new primitives.
- Feature components are grouped by domain: `components/auth`, `components/home`, `components/layout`, `components/dashboard`, `components/actions`, `components/motion`, `components/typography`, `components/providers`.
- Theming: dark mode is the canonical canvas (see `docs/DESIGN.md` — Lamborghini-inspired system: absolute black, zero border-radius, uppercase display type, single accent color for CTAs). `app/layout.tsx` sets `defaultTheme="dark"` on `ThemeProvider`. Tokens live in `app/globals.css` (OKLCH vars, including `--primary`/`--primary-hover` for both light and dark).
- `lib/site.ts` is the single source of truth for site-wide copy, product catalog, nav, and process steps — pull from here instead of hardcoding.
- `lib/status-colors.ts` is the single source of truth for stage/status/payment colors and labels (project stage, derived lead status, payment status). Use `projectStageTone()`, `leadStatusTone()`, `paymentStatusBadgeClass()`, etc. — do not redefine status palettes inline.
- Utility helpers: `cn()` in `lib/utils.ts`; Prettier's Tailwind plugin is configured to treat `cn` and `cva` as class-name functions.

### Styling rules (from `docs/DESIGN.md` and user memory)

- Primary color (`--primary` / `text-primary` / `bg-primary`) is reserved for **actions only** — never apply it to eyebrows, numerals, bullets, or plain text.
- All spacing and sizing lands on a **4px grid**; prefer Tailwind defaults over arbitrary `[Npx]` values.
- For shadcn Button and nav primitives, keep default sizing/spacing/states — only override text styles, and use theme color variants rather than ad-hoc classes.
- `--radius: 0` is intentional — do not add rounded corners to buttons or cards.

Full design reference (palette, typography scale, component specs, responsive behavior): `docs/DESIGN.md`.
