-- Stripe integration for subscriptions
-- - Adds Stripe identifiers to subscriptions so webhook events can resolve back to CRM rows
-- - Adds subscription_invoices table to record every Stripe invoice (mirrors what `payments`
--   does for projects, but scoped to recurring billing)
-- - Adds processed_stripe_events for idempotent webhook handling

-- ============================================================================
-- subscriptions: Stripe identifiers
-- ============================================================================

alter table public.subscriptions
  add column stripe_customer_id text,
  add column stripe_subscription_id text unique,
  add column stripe_price_id text,
  add column stripe_status text;

comment on column public.subscriptions.stripe_customer_id is
  'Stripe Customer ID (cus_...) — set on checkout completion.';
comment on column public.subscriptions.stripe_subscription_id is
  'Stripe Subscription ID (sub_...) — set on customer.subscription.created.';
comment on column public.subscriptions.stripe_price_id is
  'Stripe Price ID (price_...) for the active plan. Updates on plan changes.';
comment on column public.subscriptions.stripe_status is
  'Raw Stripe status (active, past_due, canceled, incomplete, etc). Distinct from our subscription_status enum which is a higher-level CRM view.';

create index subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

-- ============================================================================
-- subscription_invoices (recurring billing audit log)
-- ============================================================================

create table public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_payment_intent_id text,
  amount_paid numeric(10, 2) not null,
  currency text not null default 'USD',
  status text not null,
  billing_reason text,
  period_start timestamptz,
  period_end timestamptz,
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

comment on column public.subscription_invoices.billing_reason is
  'Stripe billing_reason: subscription_create (first invoice), subscription_cycle (recurring), etc. Used by the commission ledger to distinguish signing bonus vs monthly residual triggers.';

create index subscription_invoices_subscription_id_idx
  on public.subscription_invoices (subscription_id);
create index subscription_invoices_status_idx
  on public.subscription_invoices (status);
create index subscription_invoices_paid_at_idx
  on public.subscription_invoices (paid_at desc);

alter table public.subscription_invoices enable row level security;

-- ============================================================================
-- subscription_invoices RLS
-- ============================================================================

create policy "subscription_invoices: staff read all"
  on public.subscription_invoices for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

create policy "subscription_invoices: rep read via visible subscriptions"
  on public.subscription_invoices for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and exists (
      select 1
      from public.subscriptions s
      join public.clients c on c.id = s.client_id
      where s.id = subscription_invoices.subscription_id
        and (c.assigned_to = auth.uid() or c.assigned_to is null)
    )
  );

-- Webhook writes via service role (bypasses RLS) — no insert/update/delete policies
-- needed for normal authenticated users.

-- ============================================================================
-- processed_stripe_events (webhook idempotency)
-- ============================================================================

create table public.processed_stripe_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

comment on table public.processed_stripe_events is
  'Idempotency log for Stripe webhook handler. Insert with event.id before processing; ON CONFLICT DO NOTHING means the event has already been handled.';

create index processed_stripe_events_event_type_idx
  on public.processed_stripe_events (event_type);

alter table public.processed_stripe_events enable row level security;

create policy "processed_stripe_events: admin read"
  on public.processed_stripe_events for select
  to authenticated
  using (public.auth_role() = 'admin');
