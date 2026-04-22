-- Admin analytics views. Pre-roll the aggregations that the
-- /admin/analytics page used to compute by fetching every row and summing
-- in JavaScript. At realistic scale (5k+ projects, 20k+ payments) that was
-- multi-MB per page load; these views push the math into Postgres.
--
-- All views use security_invoker = true so RLS on the underlying tables
-- still applies to the caller. Admins (who see every row via existing
-- policies) get the full rollup; reps querying these views would only see
-- their own slice — safe by design. The analytics page itself is guarded
-- by a role check in app code.

-- ---------- kpis ----------
-- Single-row view: the four headline KPIs shown at the top of the page.

create or replace view public.admin_analytics_kpis
with (security_invoker = true) as
  select
    (
      select coalesce(sum(amount), 0)
      from public.payments
      where status = 'paid'
        and created_at >= now() - interval '30 days'
    )::numeric as revenue_30d,
    (
      select count(*)
      from public.payments
      where status = 'paid'
        and created_at >= now() - interval '30 days'
    )::integer as paid_count_30d,
    (
      select coalesce(sum(value), 0)
      from public.projects
      where stage in ('proposal', 'negotiation', 'active')
    )::numeric as open_deal_value,
    (
      select count(*)
      from public.projects
      where stage in ('proposal', 'negotiation', 'active')
    )::integer as open_deal_count,
    (
      select coalesce(sum(monthly_rate), 0)
      from public.subscriptions
      where status = 'active'
    )::numeric as active_mrr,
    (
      select count(*)
      from public.subscriptions
      where status = 'active'
    )::integer as active_plan_count,
    (
      select count(*)
      from public.projects
      where stage = 'completed'
    )::integer as deals_won_count;

-- ---------- pipeline stats ----------
-- One row per canonical stage. The UI hides the legacy `negotiation` stage
-- and folds its rows into `proposal`, so we do the same here — the output
-- never returns a `negotiation` row.

create or replace view public.admin_analytics_pipeline_stats
with (security_invoker = true) as
  select
    case
      when stage = 'negotiation' then 'proposal'
      else stage::text
    end as stage,
    count(*)::integer as project_count,
    coalesce(sum(value), 0)::numeric as value_total
  from public.projects
  group by 1
  order by 1;

-- ---------- team performance ----------
-- One row per rep (admin or sales_rep) summarizing their pipeline. Only
-- reps with at least some activity appear; the page additionally sorts by
-- (open_value + commission) desc.

create or replace view public.admin_analytics_team_performance
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
      count(*) filter (where pr.stage = 'completed')::integer as won_count,
      coalesce(sum(pr.commission_amount) filter (
        where pr.stage = 'completed'
      ), 0)::numeric as commission_earned
    from public.projects pr
    where pr.sold_by is not null
    group by pr.sold_by
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
    coalesce(rp.commission_earned, 0) as commission_earned,
    coalesce(rs.active_mrr, 0) as active_mrr
  from public.profiles p
  left join rep_projects rp on rp.rep_id = p.id
  left join rep_subs rs on rs.rep_id = p.id
  where p.role in ('admin', 'sales_rep')
    and (
      coalesce(rp.open_count, 0) > 0
      or coalesce(rp.won_count, 0) > 0
      or coalesce(rs.active_mrr, 0) > 0
      or coalesce(rp.commission_earned, 0) > 0
    );
