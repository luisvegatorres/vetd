-- Simplify the commission model to a flat 10% everywhere:
--   - 10% of project value, once, when the deposit clears.
--   - 10% of every subscription invoice that pays.
-- Signing bonuses are retired (the 10% project commission replaces them).
-- Reps keep residuals only while they are `employment_status = 'active'`;
-- the webhook's eligibility gate continues to enforce that.

-- ============================================================================
-- 1. Retire the signing_bonus branch of the subscription ledger.
-- ============================================================================

delete from public.subscription_commission_ledger
  where kind = 'signing_bonus';

alter table public.subscription_commission_ledger
  drop constraint ledger_period_matches_kind,
  drop constraint ledger_unique_period,
  drop column kind;

alter table public.subscription_commission_ledger
  add constraint subscription_commission_ledger_period_required
    check (period_month is not null),
  add constraint subscription_commission_ledger_unique_period
    unique (subscription_id, period_month);

drop type public.commission_kind;

alter table public.subscriptions
  drop column signing_bonus_amount;

-- monthly_residual_amount stays, but its meaning changes from a fixed tier
-- ($10 / $25) to 10% of monthly_rate. Backfill existing rows; admin-sold subs
-- keep null so Team MRC stays out of the payout rollup.
update public.subscriptions s
  set monthly_residual_amount = round(s.monthly_rate * 0.10, 2)
  from public.profiles p
  where p.id = s.sold_by
    and p.role <> 'admin';

update public.subscriptions s
  set monthly_residual_amount = null
  from public.profiles p
  where p.id = s.sold_by
    and p.role = 'admin';

-- ============================================================================
-- 2. project_commission_ledger — one row per project, created when deposit pays.
-- ============================================================================

create table public.project_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  rep_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(10, 2) not null,
  status public.commission_ledger_status not null default 'pending',
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_commission_ledger_unique_project unique (project_id)
);

create index project_commission_ledger_rep_id_idx
  on public.project_commission_ledger (rep_id);
create index project_commission_ledger_status_idx
  on public.project_commission_ledger (status);

create trigger project_commission_ledger_set_updated_at
  before update on public.project_commission_ledger
  for each row execute function public.set_updated_at();

alter table public.project_commission_ledger enable row level security;

create policy "project_commission_ledger: staff read all"
  on public.project_commission_ledger for select
  to authenticated
  using (public.auth_role() in ('admin', 'editor', 'viewer'));

create policy "project_commission_ledger: rep read own"
  on public.project_commission_ledger for select
  to authenticated
  using (
    public.auth_role() = 'sales_rep'
    and rep_id = auth.uid()
  );

create policy "project_commission_ledger: admin insert"
  on public.project_commission_ledger for insert
  to authenticated
  with check (public.auth_role() = 'admin');

create policy "project_commission_ledger: admin update"
  on public.project_commission_ledger for update
  to authenticated
  using (public.auth_role() = 'admin')
  with check (public.auth_role() = 'admin');

create policy "project_commission_ledger: admin delete"
  on public.project_commission_ledger for delete
  to authenticated
  using (public.auth_role() = 'admin');

-- ============================================================================
-- 3. Backfill paid-deposit projects (must happen before dropping
--    commission_amount, since the admin_analytics_team_performance view
--    depends on it and we need to recreate the view too).
-- ============================================================================

insert into public.project_commission_ledger (project_id, rep_id, amount)
select
  p.id,
  p.sold_by,
  round(p.value * 0.10, 2)
from public.projects p
join public.profiles pr on pr.id = p.sold_by
where p.deposit_paid_at is not null
  and p.value is not null
  and p.value > 0
  and p.sold_by is not null
  and pr.role <> 'admin'
on conflict (project_id) do nothing;

-- ============================================================================
-- 4. Rebuild admin_analytics_team_performance to source commission_earned
--    from the new ledger instead of projects.commission_amount.
-- ============================================================================

drop view if exists public.admin_analytics_team_performance;

create view public.admin_analytics_team_performance
with (security_invoker = true) as
  with rep_projects as (
    select
      pr.sold_by as rep_id,
      count(*) filter (
        where pr.stage in ('proposal', 'negotiation', 'active')
      )::integer as open_count,
      coalesce(sum(pr.value) filter (
        where pr.stage in ('proposal', 'negotiation', 'active')
      ), 0)::numeric as open_value,
      count(*) filter (where pr.stage = 'completed')::integer as won_count
    from public.projects pr
    where pr.sold_by is not null
    group by pr.sold_by
  ),
  rep_project_commission as (
    select
      l.rep_id,
      coalesce(sum(l.amount), 0)::numeric as commission_earned
    from public.project_commission_ledger l
    where l.status <> 'voided'
    group by l.rep_id
  ),
  rep_subs as (
    select
      s.sold_by as rep_id,
      coalesce(sum(s.monthly_rate), 0)::numeric as active_mrr
    from public.subscriptions s
    where s.sold_by is not null
      and s.status = 'active'
    group by s.sold_by
  )
  select
    p.id as rep_id,
    p.full_name,
    p.role::text as role,
    coalesce(rp.open_count, 0) as open_count,
    coalesce(rp.open_value, 0) as open_value,
    coalesce(rp.won_count, 0) as won_count,
    coalesce(rpc.commission_earned, 0) as commission_earned,
    coalesce(rs.active_mrr, 0) as active_mrr
  from public.profiles p
  left join rep_projects rp on rp.rep_id = p.id
  left join rep_project_commission rpc on rpc.rep_id = p.id
  left join rep_subs rs on rs.rep_id = p.id
  where p.role in ('admin', 'sales_rep')
    and (
      coalesce(rp.open_count, 0) > 0
      or coalesce(rp.won_count, 0) > 0
      or coalesce(rs.active_mrr, 0) > 0
      or coalesce(rpc.commission_earned, 0) > 0
    );

-- ============================================================================
-- 5. projects: drop the commission rate/flat inputs — commission is always 10%.
-- ============================================================================

alter table public.projects
  drop column commission_amount,
  drop column commission_rate,
  drop column commission_flat;

alter table public.profiles
  drop column default_commission_rate;
