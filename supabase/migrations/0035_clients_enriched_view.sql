-- Enriched client view + sidebar count RPC. Before this migration, the
-- clients and leads pages loaded every matching client plus all related
-- projects, subscriptions, payments, and interactions into memory to
-- compute lifetime value, MRR, and derived status tabs. This pushed the
-- aggregations into Postgres so the pages can do .range() pagination and
-- per-tab count queries. The sidebar's new_leads_count likewise used to
-- fetch every lead id + every interaction row; now it's one scalar RPC.
--
-- security_invoker = true so RLS on the underlying tables still applies
-- to the caller. A rep only sees their assigned clients; an admin sees
-- everything — same behavior as querying the tables directly.
--
-- ---------- clients_enriched ----------
-- One row per client, plus precomputed booleans/aggregates the list
-- pages need for filtering, sorting, and tab counting.
--   lifetime: sum of paid payments across all projects for this client
--   mrr:      sum of monthly_rate for active/at_risk subscriptions
--   has_interactions:           used by the leads page to derive
--                               new vs. contacted
--   has_at_risk_subscription:   used by the clients page to derive the
--                               at_risk tab

create or replace view public.clients_enriched
with (security_invoker = true) as
  select
    c.*,
    coalesce(lifetime.total, 0)::numeric as lifetime,
    coalesce(mrr.total, 0)::numeric as mrr,
    coalesce(has_interactions.flag, false) as has_interactions,
    coalesce(has_at_risk.flag, false) as has_at_risk_subscription
  from public.clients c
  left join lateral (
    select sum(p.amount) as total
    from public.payments p
    join public.projects pr on pr.id = p.project_id
    where pr.client_id = c.id
      and p.status = 'paid'
  ) lifetime on true
  left join lateral (
    select sum(s.monthly_rate) as total
    from public.subscriptions s
    where s.client_id = c.id
      and s.status in ('active', 'at_risk')
  ) mrr on true
  left join lateral (
    select true as flag
    from public.interactions i
    where i.client_id = c.id
    limit 1
  ) has_interactions on true
  left join lateral (
    select true as flag
    from public.subscriptions s
    where s.client_id = c.id
      and s.status = 'at_risk'
    limit 1
  ) has_at_risk on true;

-- ---------- new_leads_count ----------
-- Scalar count used by the dashboard sidebar badge. "New" means a lead
-- that nobody has touched yet — status='lead' AND no interactions.
-- Returning a plain int keeps the call shape trivial on the client.

create or replace function public.new_leads_count()
returns integer
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::int
  from public.clients c
  where c.status = 'lead'
    and not exists (
      select 1 from public.interactions i where i.client_id = c.id
    );
$$;
