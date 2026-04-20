-- Sales rep commission model: hybrid one-time + residual
-- - One-time projects: 10% of value (unchanged — uses existing projects.commission_rate)
-- - Subscription sales: flat signing bonus + monthly residual while rep employed
--   - $97 plan → $100 bonus + $10/mo residual
--   - $247 plan → $250 bonus + $25/mo residual
-- - Residuals stop immediately when rep leaves (employment_status = 'terminated')
-- - First-month payment must land before any commission unlocks

-- ============================================================================
-- profiles.employment_status
-- ============================================================================

create type public.employment_status as enum ('active', 'terminated');

alter table public.profiles
  add column employment_status public.employment_status not null default 'active';

-- Default commission rate drops from 30 → 10 to match the new model.
-- Existing rows keep their stored value; only new inserts pick up the new default.
alter table public.profiles
  alter column default_commission_rate set default 10.00;

-- ============================================================================
-- subscriptions: per-sale commission amounts + first-payment gate
-- ============================================================================

alter table public.subscriptions
  add column signing_bonus_amount numeric(10, 2),
  add column monthly_residual_amount numeric(10, 2),
  add column first_payment_at timestamptz;

comment on column public.subscriptions.signing_bonus_amount is
  'One-time bonus paid to sold_by when first_payment_at is set. Derived from plan tier at creation.';
comment on column public.subscriptions.monthly_residual_amount is
  'Monthly residual paid to sold_by while sub is active and rep is employed.';
comment on column public.subscriptions.first_payment_at is
  'Set when the client pays their first month. Commission ledger entries are only generated after this timestamp.';

-- ============================================================================
-- subscription_commission_ledger
-- ============================================================================

create type public.commission_kind as enum ('signing_bonus', 'monthly_residual');
create type public.commission_ledger_status as enum ('pending', 'paid', 'voided');

create table public.subscription_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  rep_id uuid not null references public.profiles (id) on delete restrict,
  kind public.commission_kind not null,
  period_month date,
  amount numeric(10, 2) not null,
  status public.commission_ledger_status not null default 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ledger_period_matches_kind check (
    (kind = 'signing_bonus' and period_month is null)
    or (kind = 'monthly_residual' and period_month is not null)
  ),
  constraint ledger_unique_period unique (subscription_id, kind, period_month)
);

create index subscription_commission_ledger_rep_id_idx
  on public.subscription_commission_ledger (rep_id);
create index subscription_commission_ledger_subscription_id_idx
  on public.subscription_commission_ledger (subscription_id);
create index subscription_commission_ledger_status_idx
  on public.subscription_commission_ledger (status);

create trigger subscription_commission_ledger_set_updated_at
  before update on public.subscription_commission_ledger
  for each row execute function public.set_updated_at();

alter table public.subscription_commission_ledger enable row level security;

-- ============================================================================
-- RLS policies
-- ============================================================================

-- Staff read all
create policy "commission_ledger: staff read all"
  on public.subscription_commission_ledger for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

-- Reps read their own rows
create policy "commission_ledger: rep read own"
  on public.subscription_commission_ledger for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and rep_id = auth.uid()
  );

-- Only admins mutate the ledger (generation + marking paid happens via server actions)
create policy "commission_ledger: admin insert"
  on public.subscription_commission_ledger for insert
  to authenticated
  with check (public.auth_role() = 'admin');

create policy "commission_ledger: admin update"
  on public.subscription_commission_ledger for update
  to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

create policy "commission_ledger: admin delete"
  on public.subscription_commission_ledger for delete
  to authenticated
  using (public.auth_role() = 'admin');
