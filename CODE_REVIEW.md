# Code Review — Performance, Scalability, Maintainability

Generated 2026-04-22. Scope: full codebase (marketing + protected app + webhooks + migrations). Severity scale:

- **P0** — correctness, security, or will fall over at realistic scale (1k–10k rows / normal event volume). Fix before layering on new features.
- **P1** — notable; fix this quarter.
- **P2** — polish / housekeeping.

Citations use `file:line` so each item can be opened directly. Every load-bearing claim below was spot-verified against source before writing.

---

## Progress log

Last updated 2026-04-22.

### Done

- **Performance P0 #1** — leads `.in()` filter. [app/(protected)/leads/page.tsx:124-134](app/(protected)/leads/page.tsx#L124-L134). Sequential query, scoped by visible client IDs.
- **Performance P0 #2** — Cal.com embed lazy-load. [components/actions/book-call-button.tsx:29-44](components/actions/book-call-button.tsx#L29-L44). Dynamic `await import()` inside the effect.
- **Scalability P0 #2** — payments page server pagination. Rewrite of [app/(protected)/payments/page.tsx](app/(protected)/payments/page.tsx). Count queries for tab totals, bucketed amount queries for header aggregates, server filters on both source tables. Documented trade-off: tab=all uses merge-sort with a ~20-page depth cap; deep pagination there warrants a Postgres view with `UNION ALL` later.
- **Scalability P0 #3** — projects page server pagination. Rewrite of [app/(protected)/projects/page.tsx](app/(protected)/projects/page.tsx). `.range()` windowed query, sibling fetches scoped to `visibleProjectIds`, search pre-resolves matching client IDs.
- **Scalability P0 #1** — admin analytics Postgres views. New migration [supabase/migrations/0022_admin_analytics_views.sql](supabase/migrations/0022_admin_analytics_views.sql) with three `security_invoker=true` views (`admin_analytics_kpis`, `admin_analytics_pipeline_stats`, `admin_analytics_team_performance`). Applied to project `qidqltvvajzupieawdat`; types regenerated; page rewritten at [app/(protected)/admin/analytics/page.tsx](app/(protected)/admin/analytics/page.tsx).
- **Maintainability P1 #3** — `project-board.tsx` split. New [lib/projects/task-utilities.ts](lib/projects/task-utilities.ts) (118 LOC of pure utilities + types). Board file now 913 LOC (from 990). `TaskCard` and `SortableTaskCard` wrapped in `React.memo` ([project-board.tsx:417](components/projects/project-board.tsx#L417), [:456](components/projects/project-board.tsx#L456)); `handleOpen` and `handleDelete` wrapped in `useCallback` ([:297-314](components/projects/project-board.tsx#L297-L314)) — covers **Performance P1 #4** as well. Did NOT extract a `useProjectBoardDrag` hook (the review proposed this on LOC grounds, but the handlers are tightly coupled to state/dispatch/taskIndex/startTransition/projectId and extracting adds ceremony without reducing cognitive load).
- **Maintainability P1 #4** — `project-form-dialog.tsx` split. **Reconsidered and skipped.** On direct reading, the cost is JSX verbosity (every field is a 15–25-line `Label + InputGroup/Select` block), not mixed concerns or performance. Fields interact across state so extraction would force 10+ props + setters down. Verdict documented inline in the finding.

### Cumulative verification

- `pnpm typecheck` — clean after every change.
- `pnpm lint` — clean on every edited file. One pre-existing error remains (`react-hooks/set-state-in-effect` in [components/projects/project-board.tsx](components/projects/project-board.tsx) TaskDialog `useEffect`, plus [hooks/use-mobile.ts:14](hooks/use-mobile.ts#L14)); confirmed via `git stash` that these existed before my edits.
- `pnpm build` — all 18 routes compile after each change.
- Live Supabase views verified via direct SQL queries; no new security advisor warnings.

### Not yet verified empirically (worth a manual pass)

- `pnpm dev` click-through of: dashboard, projects board (memoization), payments (tabs/filters/pagination), admin analytics (view-backed KPIs), leads.
- Stripe webhook retry behavior — requires `stripe trigger` or live replay; see P0 items still open below.
- List-page load test at 5k+ rows (no seed script used this pass).

### Still open — suggested order when we resume

1. **Scalability P0 #4** — Stripe webhook idempotency crash-window gap. [app/api/webhooks/stripe/route.ts:615-653](app/api/webhooks/stripe/route.ts#L615-L653). Invert the pattern (success-row-last) or move to an outbox with `pending` / `completed` states. **This is the biggest outstanding correctness risk.** Requires `stripe trigger` testing.
2. **Scalability P0 #5** — `invoice.paid` before subscription exists. Same file, around line 371. Related to #4 — worth designing both fixes together.
3. **Scalability P0 #6** — sync Stripe API call inside webhook handler. Same file, lines 103-114. Read line items from the event payload; only fall back to the API when `invoice.lines.has_more`.
4. **Maintainability P1 #5** — split the Stripe webhook route (657 LOC) into `lib/stripe/handlers/*.ts` + `lib/stripe/idempotency.ts`. Best done alongside the idempotency fix so smaller handlers land the pattern cleanly.
5. **Performance P0 #3** — protected layout refetches auth + lead count on every nav. Streaming `<Suspense>` or client-side count.
6. **Performance P1 #5** — dashboard's 9 count queries → `unstable_cache`.
7. **Performance P1 #6** — expand `PROTECTED_PREFIXES` in `lib/supabase/proxy.ts` and tighten matcher.
8. **Scalability P1 #7** — clients page pagination.
9. **Scalability P1 #8** — admin users page pagination.
10. **Scalability P1 #9** — index on `subscription_commission_ledger.period_month`.
11. Everything else (P1 item #10, commission ledger edge-case tests, maintainability P1s, P2 polish).

### Migration log (live DB: `qidqltvvajzupieawdat`)

- `0022_admin_analytics_views` — applied 2026-04-22. Three views, `security_invoker=true`. Reversible with `drop view public.admin_analytics_kpis, public.admin_analytics_pipeline_stats, public.admin_analytics_team_performance;`.

### How to pick up next session

Read this file top-to-bottom to re-establish context. The findings below are the authoritative to-do list; the Progress log above tracks what's done. To resume, pick the top item under "Still open" or ask the user which to tackle.

---

## Executive summary

The five highest-leverage fixes, in order:

1. **Leads page pulls the entire `interactions` table into memory on every render** just to build a `Set` of `contactedIds` — [app/(protected)/leads/page.tsx:124-127](app/(protected)/leads/page.tsx#L124-L127). Trivial fix, unbounded growth avoided.
2. **Payments and projects list pages fetch every row with no `.range()` / `.limit()`** and paginate in the browser — [app/(protected)/payments/page.tsx](app/(protected)/payments/page.tsx), [app/(protected)/projects/page.tsx](app/(protected)/projects/page.tsx). Fine at current seed data, OOM at 5k+.
3. **Admin analytics does full-table scans + in-memory aggregation** across projects, payments, subscriptions, profiles — [app/(protected)/admin/analytics/page.tsx](app/(protected)/admin/analytics/page.tsx). Needs a Postgres view or RPC.
4. **Stripe webhook idempotency has a crash-window gap**: if the route dies between the `processed_stripe_events` insert and handler dispatch, the event is "processed" but no work happened. Compensation (delete-on-error) covers handler throws but not server crashes. [app/api/webhooks/stripe/route.ts:615-653](app/api/webhooks/stripe/route.ts#L615-L653).
5. **`project-board.tsx` is 990 LOC of mixed concerns** (drag state + filtering + rendering + editors) with no `React.memo` on card children — [components/projects/project-board.tsx](components/projects/project-board.tsx). Every drag tick re-renders every card.

No hair-on-fire security issues. Stripe webhook signature is verified (`verifyStripeWebhook` at line 608), `createAdminClient()` is server-only-guarded, and RLS predicates on the hot tables (`clients.assigned_to`) are indexed (`0001_init_crm.sql:133`).

---

## Performance

### P0

**1. Leads page loads the entire `interactions` table** — [app/(protected)/leads/page.tsx:124-127](app/(protected)/leads/page.tsx#L124-L127)
- **What.** `supabase.from("interactions").select("client_id")` with no filter is awaited alongside the client query.
- **Why.** The only use is to build `contactedIds` (line 131). This is linear in total interaction rows forever, regardless of how many leads the user can see.
- **Fix.** Run the `clients` query first, then `supabase.from("interactions").select("client_id").in("client_id", visibleClientIds)`. One extra round-trip, constant memory.

**2. `BookCallButton` loads `@calcom/embed-react` eagerly on marketing pages** — [components/actions/book-call-button.tsx:4](components/actions/book-call-button.tsx#L4)
- **What.** Top-level import from `@calcom/embed-react`, used on home hero, contact, financing.
- **Why.** Cal.com's embed script is heavy and loads for every visitor who never clicks the CTA — the exact users we want fast LCPs for.
- **Fix.** `const { getCalApi } = await import("@calcom/embed-react")` inside the click handler, or lazy-init inside a `useEffect` that runs after first paint.

**3. `app/(protected)/layout.tsx` refetches auth + lead count on every protected page nav** — [app/(protected)/layout.tsx:23-38](app/(protected)/layout.tsx#L23-L38)
- **What.** Every page under `(protected)` re-runs profile + clients + interactions queries from the layout to derive sidebar state.
- **Why.** Sidebar is mostly static; middleware has already authed. The lead count query doesn't need to block the page shell.
- **Fix.** Move the count into a streaming `<Suspense>` boundary inside the sidebar (or a client hook behind a `revalidate`), so the page body renders immediately.

### P1

**4. `project-board.tsx` re-renders every card on every drag tick** — [components/projects/project-board.tsx](components/projects/project-board.tsx) (~990 LOC, no memoized children)
- **What.** dnd-kit state lives in the top-level `"use client"` component. Card components are plain functions, not `React.memo`'d; `onOpen`/`onDelete` handlers are re-created each render.
- **Why.** Drag/hover updates cascade to every task card in the board. Janky with 50+ tasks.
- **Fix.** Wrap `SortableTaskCard` / `TaskCard` in `React.memo` with stable prop identity, memoize handlers with `useCallback`, and move the "currently dragging id" into a ref or a selector-aware context.

**5. Dashboard fires 9 parallel count queries on every visit** — [app/(protected)/dashboard/page.tsx:42-99](app/(protected)/dashboard/page.tsx#L42-L99)
- **What.** Nine `Promise.all` count-only selects, uncached.
- **Why.** Dashboard is the most-visited page. At 10k rows per table, each count is a scan.
- **Fix.** Wrap the counts behind `unstable_cache` keyed per-user with a 60–300s TTL, or precompute via a materialized view refreshed on write.

**6. `proxy.ts` middleware runs `getClaims()` on every non-static request including marketing** — [lib/supabase/proxy.ts](lib/supabase/proxy.ts), [proxy.ts](proxy.ts)
- **What.** `PROTECTED_PREFIXES = ["/dashboard"]` (per CLAUDE.md) but the middleware matcher fires on all non-asset paths.
- **Why.** Marketing visits pay an auth round-trip they don't need. Also means `/leads`, `/clients`, `/projects`, etc. fall through the unauth-redirect check — those routes are defended by `app/(protected)/layout.tsx`, but the middleware intent is wider.
- **Fix.** Expand `PROTECTED_PREFIXES` to match the actual `(protected)` route group (`/dashboard`, `/leads`, `/clients`, `/projects`, `/pipeline`, `/commissions`, `/payments`, `/settings`, `/admin`, `/pitch-mode`), and narrow the matcher so marketing paths skip `getClaims()` entirely.

**7. Commissions page has a conditional second await after the main `Promise.all`** — [app/(protected)/commissions/page.tsx:47-77](app/(protected)/commissions/page.tsx#L47-L77)
- **What.** Reps incur an extra serial round-trip for `assignedClientsCount`.
- **Why.** Reps are the majority of users; that's a waterfall on the hot path.
- **Fix.** Merge the count into the initial `Promise.all` with a conditional filter.

### P2

**8. `next.config.mjs` is empty** — [next.config.mjs](next.config.mjs)
- **What.** No image config, no `experimental.optimizePackageImports`, no bundle analyzer.
- **Why.** Free perf wins available on `lucide-react`, `recharts`, `@base-ui/react` with `optimizePackageImports`. Missing image `formats` means no AVIF/WebP.
- **Fix.** Add `images: { formats: ["image/avif", "image/webp"] }` and `experimental: { optimizePackageImports: ["lucide-react", "recharts", "@base-ui/react"] }`.

**9. `recharts` may land in shared chunks via `components/ui/chart.tsx`** — [components/ui/chart.tsx](components/ui/chart.tsx)
- **What.** The shadcn chart wrapper imports recharts at the module top.
- **Why.** If the wrapper is imported from a shared layout, recharts ships everywhere. Verify with `next build` + analyzer.
- **Fix.** Gate recharts behind `next/dynamic({ ssr: false })` in the two places that actually render charts (dashboard sparkline, MRR trend), not in the generic wrapper.

**10. `qrcode.react` is in `package.json` — confirm actual usage** — [package.json:31](package.json#L31)
- **What.** Initial grep suggests no imports. Verify before removing.
- **Fix.** `grep -rn "qrcode.react" app components lib` — if zero hits, remove.

### Not an issue (initial flags cleared on verification)

- **`@base-ui/react`** — powers almost every shadcn primitive (button, dialog, popover, tabs, sheet, tooltip, switch, badge, etc.). Do not remove.
- **`tw-animate-css`** — imported at [app/globals.css:2](app/globals.css#L2), provides `animate-accordion-down`, `animate-caret-blink`, and the `data-open:animate-in` enter/exit utilities used by dialog/popover/tooltip/dropdown. Do not remove.

---

## Scalability

### P0

**1. Unbounded full-table scan on admin analytics** — [app/(protected)/admin/analytics/page.tsx:67-83](app/(protected)/admin/analytics/page.tsx#L67-L83)
- **What.** Fetches all projects, payments, subscriptions, profiles without limits; does stage/team/MRR rollups in JS.
- **Why.** 10k projects ≈ multi-MB wire payload per admin page view, and the in-memory loops (lines ~90–158) make each admin refresh a full scan.
- **Fix.** Move the aggregations into a Postgres view or `rpc()` function that returns pre-rolled results. Admin analytics is the canonical case for DB-side aggregation.

**2. Unbounded client-side pagination on payments page** — [app/(protected)/payments/page.tsx:109-154](app/(protected)/payments/page.tsx#L109-L154)
- **What.** All payments + invoices + subscriptions + reps fetched, then sliced in the browser (around line 299).
- **Why.** Payments table grows monotonically with time. At 5k rows the payload is multi-MB and layout-shifting.
- **Fix.** Use `.range()` server-side, keyed on `paid_at DESC`. Join subscriptions only for the visible 25–50 rows. The toolbar filter state can push into the URL and server-query.

**3. Unbounded projects query with cross-table aggregations** — [app/(protected)/projects/page.tsx:100-141](app/(protected)/projects/page.tsx#L100-L141)
- **What.** Fetches all projects, clients, reps, payments, interactions, subscriptions in parallel, then builds 5 in-memory maps.
- **Why.** O(projects × interactions) map-building at N ≈ 2k projects / 5k interactions is already felt.
- **Fix.** Paginate projects first; then `.in("project_id", visibleProjectIds)` for the ancillary tables.

**4. Stripe webhook idempotency has a crash-window gap** — [app/api/webhooks/stripe/route.ts:615-653](app/api/webhooks/stripe/route.ts#L615-L653)
- **What.** The row is inserted into `processed_stripe_events` *before* handler dispatch; on handler throw, a compensating `DELETE` runs (line 652). But if the process crashes, the OOM-killer fires, or the Vercel lambda times out between lines 616 and 653, the event is marked processed and no work happened — Stripe's retry is silently dropped.
- **Why.** Small probability, large blast radius (missed subscription / commission / payment).
- **Fix.** Invert the pattern: do the work first in an idempotent way (the current handlers already use upsert patterns), then insert the `processed_stripe_events` row as the last successful side effect. Or move to a proper outbox: write a pending row, run handlers, mark row `completed`. The current delete-on-error is clever but not crash-safe.

**5. `invoice.paid` can arrive before its subscription row exists** — [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts) (`handleInvoicePaid` around line 371)
- **What.** If `invoice.payment_succeeded` lands before `checkout.session.completed` (Stripe does not guarantee ordering), the handler throws → idempotency row is rolled back → Stripe retries. Eventually it works, but loud error logs and retries-until-backoff-limit are not free.
- **Why.** Will happen in production; we just haven't seen it at dev volume.
- **Fix.** When the subscription isn't found, write a deferred row (`pending_stripe_invoices` or similar) and replay on the next `checkout.session.completed`, instead of throwing. Alternatively, accept the retries and raise the tolerance threshold explicitly.

**6. Server-side-rendered pages query Stripe synchronously inside the webhook** — [app/api/webhooks/stripe/route.ts:103-114](app/api/webhooks/stripe/route.ts#L103-L114)
- **What.** `resolveFirstInvoiceLine()` calls `stripe.invoices.listLineItems()` inside the handler.
- **Why.** Stripe's 30s webhook timeout is your deadline. If Stripe's own API is slow, you time out → retry → compound load.
- **Fix.** Read line items from the `invoice.lines.data` already on the event payload where possible. Only fall back to the API when lines are truncated (`invoice.lines.has_more`).

### P1

**7. Unbounded clients page scans** — [app/(protected)/clients/page.tsx:94-120](app/(protected)/clients/page.tsx#L94-L120)
- **What.** Four `.select("*")` calls, filtered in JS.
- **Fix.** Server-side `.range()` + `.ilike()` with either an index on `name` or a `pg_trgm` GIN index for substring matches.

**8. No pagination on admin users page** — [app/(protected)/admin/users/page.tsx:37-40](app/(protected)/admin/users/page.tsx#L37-L40)
- **What.** Fetches all profiles.
- **Why.** Becomes a scroll-of-death at ~100+ users.
- **Fix.** Add `.range()` or virtualized list.

**9. Likely missing index on `subscription_commission_ledger.period_month`** — [supabase/migrations/0012_subscription_commissions.sql](supabase/migrations/0012_subscription_commissions.sql)
- **What.** The unique constraint covers `(subscription_id, kind, period_month)`, but monthly payout queries filter on `period_month` alone.
- **Why.** Payout reports will scan the whole ledger as it grows.
- **Fix.** `create index subscription_commission_ledger_period_month_idx on public.subscription_commission_ledger (period_month desc);`

**10. Cascading `revalidatePath` calls on client reassignment** — [app/(protected)/clients/actions.ts](app/(protected)/clients/actions.ts) (reassign action near line 209)
- **What.** Revalidates `/pipeline`, `/projects`, `/commissions` for every reassignment.
- **Why.** Over-invalidation; at 10 reassignments/hour × 50 users this thrashes ISR.
- **Fix.** Use `revalidateTag` with rep- or client-scoped tags.

**11. Commission ledger — edge-case review needed**
- The handler has good `onConflict` guards at ledger inserts, but spot-check for:
  - Plan upgrade/downgrade mid-period: does the `(subscription_id, kind, period_month)` unique key allow a *corrected* amount, or does it silently keep the old?
  - `invoice.payment_failed` → later `invoice.paid`: ensure no double insert (unique key protects).
  - Subscription canceled and re-created under a new Stripe ID: does the rep get a second signing bonus?
  - Rep flips to `employment_status='terminated'`: verify the webhook checks this before inserting a residual row, rather than trusting a trigger.
- **Fix direction.** Write a short internal test matrix covering these four scenarios and run them against a Stripe test-mode sandbox.

### P2

**12. `lib/supabase/server.ts` lacks `import "server-only"`** — [lib/supabase/server.ts](lib/supabase/server.ts)
- **What.** `lib/supabase/admin.ts` is guarded with `"server-only"`; `server.ts` isn't.
- **Why.** A client component could accidentally import it and blow up at build. Low probability but free to prevent.
- **Fix.** Add `import "server-only"` at the top.

**13. RLS `EXISTS (... from clients c where c.assigned_to = auth.uid())` per-row pattern — currently fine, monitor** — [supabase/migrations/0016_reps_see_only_assigned.sql](supabase/migrations/0016_reps_see_only_assigned.sql)
- **What.** Downgraded from the initial agent's P1 concern after verifying [0001_init_crm.sql:133](supabase/migrations/0001_init_crm.sql#L133) indexes `clients.assigned_to` and `auth_role()` is marked `stable` ([0001:102-110](supabase/migrations/0001_init_crm.sql#L102-L110)).
- **Why.** Postgres will plan these as indexed semi-joins. Not a scale issue now.
- **Watch.** If `projects` or `interactions` grows past a few hundred thousand rows, re-check plans with `EXPLAIN ANALYZE`.

### Not an issue (initial flags cleared on verification)

- `auth_role()` volatility — already `stable` ([supabase/migrations/0001_init_crm.sql:105](supabase/migrations/0001_init_crm.sql#L105)).
- Stripe signature verification — present and correct ([app/api/webhooks/stripe/route.ts:608](app/api/webhooks/stripe/route.ts#L608)).

---

## Maintainability

### P0

**1. No test setup at all** — project root
- **What.** `pnpm typecheck` / `pnpm lint` are the only gates. No Jest/Vitest/Playwright configured.
- **Why.** Commission math, webhook idempotency, and RLS-sensitive server actions are precisely the code where a small regression silently breaks money flow. Type checks don't cover it.
- **Fix direction.** Not scoped here. Worth a separate conversation — at minimum, add Vitest for `lib/projects/*` pure utilities and webhook-handler unit tests with mocked Stripe payloads.

**2. Enum values hardcoded as string literals across features**
- Examples:
  - [components/clients/client-form-dialog.tsx:265](components/clients/client-form-dialog.tsx#L265) — `defaultValue="active_client"`
  - [components/projects/project-form-dialog.tsx:317](components/projects/project-form-dialog.tsx#L317) — `"proposal"`
  - [app/(protected)/pipeline/actions.ts:18-19](app/(protected)/pipeline/actions.ts#L18-L19) — `DRAGGABLE_FROM: ["proposal", "negotiation"]`
  - [components/pipeline/pipeline-board.tsx:39-46](components/pipeline/pipeline-board.tsx#L39-L46) — stage strings duplicated between column config and handlers
- **Why.** A rename in `lib/supabase/types.ts` compiles cleanly but silently breaks filters.
- **Fix.** Import the generated enum types from `lib/supabase/types.ts` and derive string lists from them — so dead strings fail the build.

### P1

**3. `project-board.tsx` is 990 LOC of mixed concerns** — [components/projects/project-board.tsx](components/projects/project-board.tsx)
- **Responsibilities.** Drag orchestration + task card rendering + filter state + editor dialog + due-date utilities.
- **Extraction seams.**
  - Due-date helpers (~lines 122–187) → `lib/projects/task-utilities.ts`. Pure functions, reusable.
  - Drag handlers (~lines 297–372) → `hooks/useProjectBoardDrag.ts`. Will also make `React.memo` adoption (P1 under Performance) easier.
  - `TaskDialog` is already extracted — leave it.

**4. ~~`project-form-dialog.tsx` at 691 LOC~~ — reconsidered, not extracting** — [components/projects/project-form-dialog.tsx](components/projects/project-form-dialog.tsx)
- **Second look.** Actual LOC is 621, not 691. On direct reading, the cost is JSX verbosity (every form field is a 15–25-line `Label + InputGroup/Select` block), not mixed concerns or performance. Fields interact across state (product-type-changes-payment-status, value-change-auto-toggles-financing, plan-id-conditionally-renders-rate), so splitting into `ProjectFormFields` / `ProjectFormTimeline` means passing 10+ props + setters down — more ceremony, not less. No pure utilities worth extracting; no hot re-render path.
- **Verdict.** Leave as-is. If form density becomes a real problem, the right fix is a design-system `<Field>` helper across every form in the app, not a one-off split here. Revisit only when adding a fifth entity form makes the duplication real.

**5. `app/api/webhooks/stripe/route.ts` at 657 LOC** — [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts)
- **Extraction.** One file per event handler under `lib/stripe/handlers/`: `checkout-completed.ts`, `invoice-paid.ts`, `invoice-failed.ts`, `subscription-updated.ts`, `subscription-deleted.ts`. The route becomes a thin dispatcher. Idempotency helpers → `lib/stripe/idempotency.ts`.
- **Bonus.** Smaller handlers make the P0 idempotency fix (write success-row last) easier to land cleanly.

**6. `commissions-view.tsx` at 652 LOC** — [components/commissions/commissions-view.tsx](components/commissions/commissions-view.tsx)
- **Extraction.** Two independent tables (subscriptions, ledger) → `CommissionsSubscriptionsTable`, `CommissionsLedgerTable`. KPI block stays in the parent.

**7. Double-cast `as unknown as Json` in webhook** — [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts) (lines ~312, ~403, ~545)
- **What.** `session as unknown as Json` / `invoice as unknown as Json` before writing to a `jsonb` column.
- **Why.** Hides that the generated `Json` type doesn't accept the Stripe SDK's object shape. Will mask a real type mismatch if the column schema ever tightens.
- **Fix.** Narrow with a small `stripeEventToJson()` helper that picks the fields we actually store.

**8. Server-action error shape is inconsistent**
- [app/(protected)/clients/actions.ts](app/(protected)/clients/actions.ts) returns `{ ok: true/false, ... }`.
- [app/(protected)/leads/actions.ts](app/(protected)/leads/actions.ts) mixes thrown errors and returned results.
- [app/(protected)/projects/actions.ts](app/(protected)/projects/actions.ts) throws on validation.
- **Why.** Callers have to memorize which file does what; toasting is ad hoc.
- **Fix.** Pick one discriminated-union shape (`type Result<T> = { ok: true; data: T } | { ok: false; error: string }`) and migrate.

**9. Subscription / commission badges reimplement status palettes outside `lib/status-colors.ts`**
- [components/commissions/commissions-view.tsx:456,458](components/commissions/commissions-view.tsx#L456-L458) — `emerald-500/15`, `amber-500/15`.
- [components/payments/payments-table.tsx:69](components/payments/payments-table.tsx#L69) — `bg-orange-500` dot.
- **Fix.** Add `subscriptionStatusTone()` / `paymentStatusDotClass()` to `lib/status-colors.ts`; replace the inline classes.

### P2

**10. `text-[10px]` in four toolbar badge counts** — [components/clients/clients-toolbar.tsx:123](components/clients/clients-toolbar.tsx#L123), [components/leads/leads-toolbar.tsx:120](components/leads/leads-toolbar.tsx#L120), [components/payments/payments-toolbar.tsx:252](components/payments/payments-toolbar.tsx#L252), [components/projects/projects-toolbar.tsx:138](components/projects/projects-toolbar.tsx#L138)
- Violates the "text-xs is the floor" rule. Use `text-xs` or tighten the parent layout so the badge fits.

**11. `text-primary` on a time display (not an action)** — [components/dashboard/todays-focus.tsx:294](components/dashboard/todays-focus.tsx#L294)
- Violates "primary color is for actions only." Use a neutral text color or an emphasis token.

**12. Cross-domain form/toolbar duplication is ~60–70% shape-similar but not high-priority**
- Worth a shared `BaseFormDialog` + `useToolbarNav` once a fourth entity is added. Not before — churn cost exceeds benefit today.

**13. `tsconfig.json` target is `ES2017`** — [tsconfig.json](tsconfig.json)
- Dated for Next 16 + React 19 (both require ES2020+ at runtime). No correctness impact because Next transpiles, but flag as a maintenance smell.

**14. Stale-comment scan was not exhaustive** — treat as "no findings" with low confidence. Worth a grep pass (`grep -rn "TODO\|FIXME\|XXX\|removed\|deprecated"`) if this becomes a concern.

### Already compliant (verified, not a finding)

- `lib/site.ts` is the authoritative nav/product source.
- `lib/status-colors.ts` covers stage/status/payment tones for all primary entities.
- `lib/supabase/admin.ts` is correctly `server-only`-guarded.

---

## Appendix

### Files to split / extract

| File | Current LOC | Target split |
|---|---|---|
| [components/projects/project-board.tsx](components/projects/project-board.tsx) | 990 | `lib/projects/task-utilities.ts`, `hooks/useProjectBoardDrag.ts` + memoized card children |
| [components/projects/project-form-dialog.tsx](components/projects/project-form-dialog.tsx) | 691 | `ProjectFormFields`, `ProjectFormTimeline` subcomponents |
| [app/api/webhooks/stripe/route.ts](app/api/webhooks/stripe/route.ts) | 657 | `lib/stripe/handlers/*.ts` per event + `lib/stripe/idempotency.ts` |
| [components/commissions/commissions-view.tsx](components/commissions/commissions-view.tsx) | 652 | `CommissionsSubscriptionsTable`, `CommissionsLedgerTable` |
| [components/leads/convert-lead-dialog.tsx](components/leads/convert-lead-dialog.tsx) | ~414 | `hooks/useConvertLeadPricing.ts` |
| [components/payments/payments-toolbar.tsx](components/payments/payments-toolbar.tsx) | ~397 | No extraction needed — well-scoped |
| [components/clients/client-form-dialog.tsx](components/clients/client-form-dialog.tsx) | ~345 | `lib/phone.ts` for `formatPhone`/`phoneDigits`; `ClientFormFields` subcomponent |

Skip [components/ui/sidebar.tsx](components/ui/sidebar.tsx) — shadcn primitive, not project code.

### Dependencies to reconsider

| Dep | Verdict | Note |
|---|---|---|
| `@base-ui/react` | Keep | Powers most shadcn primitives; removing breaks UI |
| `@calcom/embed-react` | Keep + lazy-load | Used by `BookCallButton`; defer the import |
| `tw-animate-css` | Keep | Provides `animate-accordion-*`, `data-open:animate-in`, `animate-caret-blink` |
| `motion` | Keep | Used by hero-shader and motion components |
| `qrcode.react` | Verify usage | `grep -rn "qrcode.react"` before keeping |
| `recharts` | Keep + dynamic-import | Isolate to the two files that render charts |

### Migrations to audit

- [0012_subscription_commissions.sql](supabase/migrations/0012_subscription_commissions.sql) — add index on `period_month`.
- [0013_subscriptions_stripe.sql](supabase/migrations/0013_subscriptions_stripe.sql) — confirm the `processed_stripe_events` PK is `event.id` (used by the idempotency insert at [route.ts:33](app/api/webhooks/stripe/route.ts#L33)).
- [0016_reps_see_only_assigned.sql](supabase/migrations/0016_reps_see_only_assigned.sql) — run `EXPLAIN ANALYZE` on the rep paths once seeded at 10k+ rows; currently-indexable predicates should hold but worth confirming.

### Concrete fix order

If I were implementing these myself, in this order:

1. **Performance P0 #1** (leads `.in()` filter) — 5 minutes, instant win.
2. **Performance P0 #2** (lazy-load Cal.com embed) — 15 minutes, LCP improvement.
3. **Scalability P0 #4** (Stripe idempotency: success-row-last) — 1–2 hours, needs careful testing.
4. **Scalability P0 #2, #3** (payments and projects pagination) — half a day each.
5. **Scalability P0 #1** (admin analytics view) — 1 day, new migration.
6. **Maintainability P1 #3, #5** (split `project-board.tsx` and the Stripe route) — best done before adding more features in those areas.
7. **Performance P1 #4** (`React.memo` on board cards) — lands after the board split.
8. Everything else as capacity allows.

### Verification once fixes are implemented

- `pnpm typecheck` and `pnpm lint` clean.
- `pnpm dev`: click through dashboard, projects board, payments, admin analytics, leads — watch network tab for payload sizes.
- Stripe webhook: `stripe trigger invoice.payment_succeeded` twice in a row, confirm exactly one `processed_stripe_events` row and one ledger row per `(subscription_id, kind, period_month)`.
- Seed script load test (if present): populate 5k payments, 5k projects, 5k clients; confirm list pages stay under ~500ms TTFB and <2MB payload.
