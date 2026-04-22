-- Rep activity view — signals whether a contractor is actively working their
-- book. Admins use this to decide whether to flip `profiles.employment_status`
-- to 'terminated' (which stops residuals via the webhook's eligibility gate).
--
-- Signals tracked on trailing windows:
--   new_leads_30d         — clients.assigned_to = rep, created in last 30d
--   interactions_30d      — interactions.logged_by = rep, occurred in last 30d
--   new_mrr_90d           — subscriptions.sold_by = rep, started in last 90d
--   last_interaction_at   — most recent logged interaction (any type)
--
-- Thresholds are enforced in the app layer (lib/rep-activity.ts) so they can
-- be tuned without a migration. The view only returns raw counts.

create view public.admin_rep_activity
with (security_invoker = true) as
  with rep_leads as (
    select
      c.assigned_to as rep_id,
      count(*) filter (
        where c.created_at >= now() - interval '30 days'
      )::integer as new_leads_30d,
      count(*) filter (
        where c.created_at >= now() - interval '60 days'
      )::integer as new_leads_60d
    from public.clients c
    where c.assigned_to is not null
    group by c.assigned_to
  ),
  rep_interactions as (
    select
      i.logged_by as rep_id,
      count(*) filter (
        where i.occurred_at >= now() - interval '30 days'
      )::integer as interactions_30d,
      count(*) filter (
        where i.occurred_at >= now() - interval '60 days'
      )::integer as interactions_60d,
      max(i.occurred_at) as last_interaction_at
    from public.interactions i
    where i.logged_by is not null
    group by i.logged_by
  ),
  rep_new_mrr as (
    select
      s.sold_by as rep_id,
      coalesce(sum(s.monthly_rate) filter (
        where s.started_at >= (now() - interval '90 days')::date
      ), 0)::numeric as new_mrr_90d,
      count(*) filter (
        where s.started_at >= (now() - interval '90 days')::date
      )::integer as new_subs_90d
    from public.subscriptions s
    where s.sold_by is not null
      and s.status <> 'canceled'
    group by s.sold_by
  ),
  rep_active_subs as (
    select
      s.sold_by as rep_id,
      count(*)::integer as active_subs_count,
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
    p.employment_status::text as employment_status,
    p.created_at as joined_at,
    coalesce(rl.new_leads_30d, 0) as new_leads_30d,
    coalesce(rl.new_leads_60d, 0) as new_leads_60d,
    coalesce(ri.interactions_30d, 0) as interactions_30d,
    coalesce(ri.interactions_60d, 0) as interactions_60d,
    ri.last_interaction_at,
    coalesce(rm.new_mrr_90d, 0) as new_mrr_90d,
    coalesce(rm.new_subs_90d, 0) as new_subs_90d,
    coalesce(ras.active_subs_count, 0) as active_subs_count,
    coalesce(ras.active_mrr, 0) as active_mrr
  from public.profiles p
  left join rep_leads rl on rl.rep_id = p.id
  left join rep_interactions ri on ri.rep_id = p.id
  left join rep_new_mrr rm on rm.rep_id = p.id
  left join rep_active_subs ras on ras.rep_id = p.id
  where p.role = 'sales_rep';
