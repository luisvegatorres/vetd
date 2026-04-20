-- Projects: flat commission override
-- Some deals pay a flat commission instead of a percentage of value — e.g. a
-- Website build bundled into a recurring plan (value = 0, rep still earns a
-- flat sale commission). When `commission_flat` is set, `commission_amount`
-- prefers it over the percentage calculation.

alter table public.projects
  add column commission_flat numeric(10, 2);

-- Replace the generated expression: drop + re-add (Postgres doesn't allow
-- altering the expression of a generated column in place).
alter table public.projects
  drop column commission_amount;

alter table public.projects
  add column commission_amount numeric(10, 2) generated always as (
    case
      when commission_flat is not null then commission_flat
      when value is null or commission_rate is null then null
      else round(value * commission_rate / 100, 2)
    end
  ) stored;
