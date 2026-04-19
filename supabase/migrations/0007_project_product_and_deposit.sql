-- Project product type + deposit gate
-- One-time projects (custom builds) track which product was sold and require
-- a 30% deposit (by default) before the deal can enter the `active` stage.
-- Recurring engagements live in `subscriptions` and are unaffected.

-- ============================================================================
-- Enum: product type for one-time projects
-- ============================================================================

create type public.project_product_type as enum (
  'business_website',
  'mobile_app',
  'web_app',
  'ai_integration'
);

-- ============================================================================
-- Columns
-- ============================================================================

alter table public.projects
  add column product_type public.project_product_type,
  add column deposit_rate numeric(5, 2) not null default 30.00,
  add column deposit_amount numeric(10, 2) generated always as (
    case
      when value is null then null
      else round(value * deposit_rate / 100, 2)
    end
  ) stored,
  add column deposit_paid_at timestamptz;

create index projects_product_type_idx on public.projects (product_type);

-- ============================================================================
-- Gate: cannot move a priced project to `active` until the deposit is paid
-- ============================================================================
-- A project with a non-null, positive value must have `deposit_paid_at` set
-- before it enters the `active` stage. Projects with no value (e.g. internal
-- or placeholder deals) bypass the gate.

create or replace function public.projects_enforce_deposit_gate()
returns trigger
language plpgsql
as $$
begin
  if new.stage = 'active'
     and new.deposit_paid_at is null
     and new.value is not null
     and new.value > 0 then
    raise exception 'project %: cannot move to active before deposit is paid', new.id
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_deposit_gate on public.projects;
create trigger projects_deposit_gate
  before insert or update of stage, deposit_paid_at, value on public.projects
  for each row execute function public.projects_enforce_deposit_gate();
