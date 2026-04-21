-- Anon contact-form inserts triggered clients_apply_score_after_insert, whose
-- internal UPDATE on public.clients runs under the caller's role. The anon
-- role has no UPDATE policy on clients, so the UPDATE silently affects 0 rows
-- and score stays null. Run the scoring trigger functions as definer so the
-- score write isn't filtered out by RLS.

create or replace function public.clients_apply_score_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clients
  set score = public.calculate_lead_score(new.id)
  where id = new.id;
  return new;
end;
$$;

create or replace function public.interactions_rescore_client()
returns trigger
language plpgsql
security definer
set search_path = public
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

-- Backfill rows whose score was swallowed by the prior RLS gap.
update public.clients
set score = public.calculate_lead_score(id)
where score is null;
