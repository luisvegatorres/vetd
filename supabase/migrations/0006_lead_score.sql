-- Lead scoring: deterministic 0-100 score derived from source, budget, intent,
-- recent engagement, freshness, and contact completeness. Recomputed by
-- triggers on clients and interactions. Weights live as CASE expressions below
-- so tuning is a matter of editing this function and rescoring with:
--   update public.clients set updated_at = now();

-- ============================================================================
-- Score function
-- ============================================================================

create or replace function public.calculate_lead_score(p_client_id uuid)
returns int
language plpgsql
stable
as $$
declare
  v_source public.client_source;
  v_budget text;
  v_intent text;
  v_email text;
  v_phone text;
  v_created_at timestamptz;
  v_interactions_30d int;
  v_budget_num numeric;
  v_source_score int := 0;
  v_budget_score int := 0;
  v_intent_score int := 0;
  v_engagement_score int := 0;
  v_freshness_score int := 0;
  v_contact_penalty int := 0;
  v_age_days numeric;
  v_total int;
begin
  select source, budget, intent, email, phone, created_at
    into v_source, v_budget, v_intent, v_email, v_phone, v_created_at
  from public.clients
  where id = p_client_id;

  if not found then
    return null;
  end if;

  -- Source (max 25)
  v_source_score := case v_source
    when 'referral' then 25
    when 'contact_form' then 20
    when 'social' then 15
    when 'event' then 15
    when 'rep_field' then 10
    when 'cold_outreach' then 8
    else 5
  end;

  -- Budget (max 20). Parses the first number from the free-text budget field
  -- and infers a band. "$5k", "5000", "$2-5k", "10k+" all resolve sensibly.
  if v_budget is not null then
    v_budget_num := nullif(
      regexp_replace(
        coalesce((regexp_match(v_budget, '([0-9]+(?:\.[0-9]+)?)'))[1], ''),
        '[^0-9.]', '', 'g'
      ),
      ''
    )::numeric;
    -- If the budget string contains "k", treat the number as thousands
    if v_budget ~* 'k' and v_budget_num is not null then
      v_budget_num := v_budget_num * 1000;
    end if;

    v_budget_score := case
      when v_budget_num is null then 0
      when v_budget_num >= 10000 then 20
      when v_budget_num >= 5000 then 15
      when v_budget_num >= 2000 then 10
      when v_budget_num > 0 then 5
      else 0
    end;
  end if;

  -- Intent quality (max 20)
  if v_intent is not null and length(trim(v_intent)) > 0 then
    v_intent_score := v_intent_score + 8;
    if length(v_intent) > 80 then
      v_intent_score := v_intent_score + 6;
    end if;
    if v_intent ~* '(urgent|asap|launch|redesign|quote|rebuild|migrate|scale)' then
      v_intent_score := v_intent_score + 6;
    end if;
  end if;

  -- Engagement: interactions in last 30 days (max 20)
  select count(*)::int into v_interactions_30d
  from public.interactions
  where client_id = p_client_id
    and created_at >= now() - interval '30 days';

  v_engagement_score := case
    when v_interactions_30d >= 3 then 20
    when v_interactions_30d = 2 then 14
    when v_interactions_30d = 1 then 8
    else 0
  end;

  -- Freshness (max 15)
  v_age_days := extract(epoch from (now() - v_created_at)) / 86400.0;
  v_freshness_score := case
    when v_age_days <= 3 then 15
    when v_age_days <= 7 then 12
    when v_age_days <= 14 then 8
    when v_age_days <= 30 then 4
    else 0
  end;

  -- Contact completeness penalty
  if (v_email is null or length(trim(v_email)) = 0)
     and (v_phone is null or length(trim(v_phone)) = 0) then
    v_contact_penalty := 10;
  end if;

  v_total := v_source_score
           + v_budget_score
           + v_intent_score
           + v_engagement_score
           + v_freshness_score
           - v_contact_penalty;

  return greatest(0, least(100, v_total));
end;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

create or replace function public.clients_apply_score()
returns trigger
language plpgsql
as $$
begin
  new.score := public.calculate_lead_score(new.id);
  return new;
end;
$$;

-- On clients: recompute whenever a scored field changes. Runs after insert so
-- the row's id is available, then updates in place.
create or replace function public.clients_apply_score_after_insert()
returns trigger
language plpgsql
as $$
begin
  update public.clients
  set score = public.calculate_lead_score(new.id)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists clients_score_after_insert on public.clients;
create trigger clients_score_after_insert
  after insert on public.clients
  for each row
  execute function public.clients_apply_score_after_insert();

drop trigger if exists clients_score_before_update on public.clients;
create trigger clients_score_before_update
  before update of source, budget, intent, email, phone, created_at
  on public.clients
  for each row
  execute function public.clients_apply_score();

-- On interactions: any insert/delete/update that shifts the 30-day count
-- should rescore the affected client.
create or replace function public.interactions_rescore_client()
returns trigger
language plpgsql
as $$
declare
  v_client_id uuid;
begin
  v_client_id := coalesce(new.client_id, old.client_id);
  if v_client_id is not null then
    update public.clients
    set score = public.calculate_lead_score(v_client_id)
    where id = v_client_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists interactions_rescore on public.interactions;
create trigger interactions_rescore
  after insert or update or delete on public.interactions
  for each row
  execute function public.interactions_rescore_client();

-- ============================================================================
-- Backfill existing rows
-- ============================================================================

update public.clients
set score = public.calculate_lead_score(id);
